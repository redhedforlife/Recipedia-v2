import { ImportBatchStatus, ImportEntityType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type CsvRow = Record<string, string>;

type RowIssue = {
  code: string;
  message: string;
  field?: string;
};

type StagedRow = {
  rowNumber: number;
  rawRow: CsvRow;
  normalizedRow: CsvRow;
  blockingErrors: RowIssue[];
  warnings: RowIssue[];
};

type StageCsvImportInput = {
  entityType: ImportEntityType;
  filename?: string;
  csvText: string;
};

export type StageCsvImportResult = {
  batchId: string;
  entityType: ImportEntityType;
  status: ImportBatchStatus;
  rowCount: number;
  validRowCount: number;
  errorCount: number;
  warningCount: number;
  previewRows: Array<{
    rowNumber: number;
    normalizedRow: CsvRow;
    blockingErrors: RowIssue[];
    warnings: RowIssue[];
  }>;
};

export type PublishCsvImportResult = {
  batchId: string;
  entityType: ImportEntityType;
  status: ImportBatchStatus;
  publishedCount: number;
};

const REQUIRED_FIELDS: Record<ImportEntityType, string[]> = {
  nodes: ["id", "kind", "label", "href"],
  edges: ["id", "source", "target", "label"],
  recipes: ["id", "recipe_family_id", "slug", "title", "description"],
  ingredients: ["id", "canonical_name", "display_name"],
  recipe_ingredients: ["id", "recipe_id", "ingredient_id", "raw_text", "sort_order"],
  sources: ["id", "site_name", "source_url", "author_name", "license_note", "extraction_method", "extraction_confidence"],
  variations: ["id", "parent_recipe_id", "variation_recipe_id", "variation_type"]
};

const NATURAL_KEY_FIELDS: Record<ImportEntityType, string[]> = {
  nodes: ["id"],
  edges: ["id"],
  recipes: ["id"],
  ingredients: ["id"],
  recipe_ingredients: ["id"],
  sources: ["id"],
  variations: ["id"]
};

export async function stageCsvImport(input: StageCsvImportInput): Promise<StageCsvImportResult> {
  const parsed = parseCsv(input.csvText);
  const rows = parsed.rows.map((row) => normalizeRowKeys(row));

  if (rows.length === 0) {
    const emptyBatch = await prisma.importBatch.create({
      data: {
        entityType: input.entityType,
        status: "validation_failed",
        filename: input.filename,
        rowCount: 0,
        validRowCount: 0,
        errorCount: 1,
        warningCount: 0,
        previewSummary: {
          message: "CSV had headers but no data rows"
        }
      }
    });

    return {
      batchId: emptyBatch.id,
      entityType: input.entityType,
      status: emptyBatch.status,
      rowCount: 0,
      validRowCount: 0,
      errorCount: 1,
      warningCount: 0,
      previewRows: []
    };
  }

  const context = await buildValidationContext(input.entityType, rows);
  const duplicateKeys = findDuplicateKeys(rows, NATURAL_KEY_FIELDS[input.entityType]);

  const stagedRows: StagedRow[] = rows.map((row, index) => {
    const rowNumber = index + 2; // account for CSV header row
    const blockingErrors: RowIssue[] = [];
    const warnings: RowIssue[] = [];

    validateRequiredFields(input.entityType, row, blockingErrors);
    validateTypeFields(input.entityType, row, blockingErrors);

    const key = buildNaturalKey(row, NATURAL_KEY_FIELDS[input.entityType]);
    if (key && duplicateKeys.has(key)) {
      blockingErrors.push({
        code: "duplicate_in_upload",
        message: `Duplicate key '${key}' appears multiple times in this CSV.`
      });
    }

    if (key && context.existingNaturalKeys.has(key)) {
      warnings.push({
        code: "existing_row",
        message: `A row with key '${key}' already exists and will be updated on publish.`
      });
    }

    validateForeignKeys(input.entityType, row, context, blockingErrors);

    return {
      rowNumber,
      rawRow: row,
      normalizedRow: row,
      blockingErrors,
      warnings
    };
  });

  const rowCount = stagedRows.length;
  const errorCount = stagedRows.reduce((sum, row) => sum + row.blockingErrors.length, 0);
  const warningCount = stagedRows.reduce((sum, row) => sum + row.warnings.length, 0);
  const validRowCount = stagedRows.filter((row) => row.blockingErrors.length === 0).length;
  const status: ImportBatchStatus = errorCount > 0 ? "validation_failed" : "preview_ready";

  const batch = await prisma.$transaction(async (tx) => {
    const created = await tx.importBatch.create({
      data: {
        entityType: input.entityType,
        status,
        filename: input.filename,
        rowCount,
        validRowCount,
        errorCount,
        warningCount,
        previewSummary: {
          headers: parsed.headers,
          previewRows: stagedRows.slice(0, 25).map((row) => ({
            rowNumber: row.rowNumber,
            normalizedRow: row.normalizedRow,
            blockingErrors: row.blockingErrors,
            warnings: row.warnings
          }))
        }
      }
    });

    if (stagedRows.length > 0) {
      await tx.importRow.createMany({
        data: stagedRows.map((row) => ({
          batchId: created.id,
          entityType: input.entityType,
          rowNumber: row.rowNumber,
          rawRow: row.rawRow,
          normalizedRow: row.normalizedRow,
          blockingErrors: row.blockingErrors,
          warnings: row.warnings
        }))
      });
    }

    return created;
  });

  return {
    batchId: batch.id,
    entityType: input.entityType,
    status,
    rowCount,
    validRowCount,
    errorCount,
    warningCount,
    previewRows: stagedRows.slice(0, 25).map((row) => ({
      rowNumber: row.rowNumber,
      normalizedRow: row.normalizedRow,
      blockingErrors: row.blockingErrors,
      warnings: row.warnings
    }))
  };
}

export async function publishStagedImport(batchId: string): Promise<PublishCsvImportResult> {
  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
    include: {
      rows: {
        orderBy: { rowNumber: "asc" }
      }
    }
  });

  if (!batch) {
    throw new Error("Import batch not found.");
  }

  if (batch.status !== "preview_ready") {
    throw new Error("Only preview-ready batches can be published.");
  }

  const rowsWithErrors = batch.rows.filter((row) => jsonArrayLength(row.blockingErrors) > 0);
  if (rowsWithErrors.length > 0) {
    throw new Error("Import batch still has validation errors.");
  }

  await prisma.$transaction(async (tx) => {
    for (const row of batch.rows) {
      const normalizedRow = castToRecord(row.normalizedRow);
      await applyRow(tx, batch.entityType, normalizedRow);
    }

    await tx.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "published",
        publishedAt: new Date()
      }
    });
  });

  return {
    batchId: batch.id,
    entityType: batch.entityType,
    status: "published",
    publishedCount: batch.rows.length
  };
}

async function buildValidationContext(entityType: ImportEntityType, rows: CsvRow[]) {
  const existingNaturalKeys = new Set<string>();

  switch (entityType) {
    case "nodes": {
      const ids = rows.map((row) => row.id).filter(Boolean);
      if (ids.length > 0) {
        const existing = await prisma.graphNode.findMany({
          where: { id: { in: ids } },
          select: { id: true }
        });
        existing.forEach((row) => existingNaturalKeys.add(row.id));
      }
      return {
        existingNaturalKeys,
        existingRecipeFamilies: new Set<string>(),
        existingDishes: new Set<string>(),
        existingRecipes: new Set<string>(),
        existingIngredients: new Set<string>(),
        existingSourceImports: new Set<string>(),
        existingSources: new Set<string>(),
        existingGraphNodes: new Set<string>()
      };
    }
    case "edges": {
      const ids = rows.map((row) => row.id).filter(Boolean);
      const graphNodeIds = new Set(rows.flatMap((row) => [row.source, row.target]).filter(Boolean));
      const [existingEdges, existingNodes] = await Promise.all([
        ids.length
          ? prisma.graphEdge.findMany({ where: { id: { in: ids } }, select: { id: true } })
          : Promise.resolve([]),
        graphNodeIds.size
          ? prisma.graphNode.findMany({ where: { id: { in: Array.from(graphNodeIds) } }, select: { id: true } })
          : Promise.resolve([])
      ]);
      existingEdges.forEach((row) => existingNaturalKeys.add(row.id));
      return {
        existingNaturalKeys,
        existingRecipeFamilies: new Set<string>(),
        existingDishes: new Set<string>(),
        existingRecipes: new Set<string>(),
        existingIngredients: new Set<string>(),
        existingSourceImports: new Set<string>(),
        existingSources: new Set<string>(),
        existingGraphNodes: new Set(existingNodes.map((row) => row.id))
      };
    }
    case "recipes": {
      const ids = rows.map((row) => row.id).filter(Boolean);
      const familyIds = new Set(rows.map((row) => row.recipe_family_id).filter(Boolean));
      const dishIds = new Set(rows.map((row) => row.dish_id).filter(Boolean));
      const parentRecipeIds = new Set(rows.map((row) => row.parent_recipe_id).filter(Boolean));
      const sourceImportIds = new Set(rows.map((row) => row.source_import_id).filter(Boolean));
      const sourceIds = new Set(rows.map((row) => row.source_id).filter(Boolean));

      const [existingRecipes, existingFamilies, existingDishes, existingSourceImports, existingSources] = await Promise.all([
        ids.length ? prisma.recipe.findMany({ where: { id: { in: ids } }, select: { id: true } }) : Promise.resolve([]),
        familyIds.size
          ? prisma.recipeFamily.findMany({ where: { id: { in: Array.from(familyIds) } }, select: { id: true } })
          : Promise.resolve([]),
        dishIds.size ? prisma.dish.findMany({ where: { id: { in: Array.from(dishIds) } }, select: { id: true } }) : Promise.resolve([]),
        sourceImportIds.size
          ? prisma.sourceImport.findMany({ where: { id: { in: Array.from(sourceImportIds) } }, select: { id: true } })
          : Promise.resolve([]),
        sourceIds.size ? prisma.source.findMany({ where: { id: { in: Array.from(sourceIds) } }, select: { id: true } }) : Promise.resolve([])
      ]);

      const combinedRecipeIds = new Set(parentRecipeIds);
      rows.forEach((row) => {
        if (row.id) combinedRecipeIds.add(row.id);
      });
      const parentRecipes = combinedRecipeIds.size
        ? await prisma.recipe.findMany({ where: { id: { in: Array.from(combinedRecipeIds) } }, select: { id: true } })
        : [];

      existingRecipes.forEach((row) => existingNaturalKeys.add(row.id));

      return {
        existingNaturalKeys,
        existingRecipeFamilies: new Set(existingFamilies.map((row) => row.id)),
        existingDishes: new Set(existingDishes.map((row) => row.id)),
        existingRecipes: new Set(parentRecipes.map((row) => row.id).concat(rows.map((row) => row.id).filter(Boolean))),
        existingIngredients: new Set<string>(),
        existingSourceImports: new Set(existingSourceImports.map((row) => row.id)),
        existingSources: new Set(existingSources.map((row) => row.id)),
        existingGraphNodes: new Set<string>()
      };
    }
    case "ingredients": {
      const ids = rows.map((row) => row.id).filter(Boolean);
      const existing = ids.length
        ? await prisma.ingredient.findMany({ where: { id: { in: ids } }, select: { id: true } })
        : [];
      existing.forEach((row) => existingNaturalKeys.add(row.id));
      return {
        existingNaturalKeys,
        existingRecipeFamilies: new Set<string>(),
        existingDishes: new Set<string>(),
        existingRecipes: new Set<string>(),
        existingIngredients: new Set<string>(),
        existingSourceImports: new Set<string>(),
        existingSources: new Set<string>(),
        existingGraphNodes: new Set<string>()
      };
    }
    case "recipe_ingredients": {
      const ids = rows.map((row) => row.id).filter(Boolean);
      const recipeIds = new Set(rows.map((row) => row.recipe_id).filter(Boolean));
      const ingredientIds = new Set(rows.map((row) => row.ingredient_id).filter(Boolean));
      const [existingRecipeIngredients, existingRecipes, existingIngredients] = await Promise.all([
        ids.length
          ? prisma.recipeIngredient.findMany({ where: { id: { in: ids } }, select: { id: true } })
          : Promise.resolve([]),
        recipeIds.size ? prisma.recipe.findMany({ where: { id: { in: Array.from(recipeIds) } }, select: { id: true } }) : Promise.resolve([]),
        ingredientIds.size
          ? prisma.ingredient.findMany({ where: { id: { in: Array.from(ingredientIds) } }, select: { id: true } })
          : Promise.resolve([])
      ]);

      existingRecipeIngredients.forEach((row) => existingNaturalKeys.add(row.id));

      return {
        existingNaturalKeys,
        existingRecipeFamilies: new Set<string>(),
        existingDishes: new Set<string>(),
        existingRecipes: new Set(existingRecipes.map((row) => row.id)),
        existingIngredients: new Set(existingIngredients.map((row) => row.id)),
        existingSourceImports: new Set<string>(),
        existingSources: new Set<string>(),
        existingGraphNodes: new Set<string>()
      };
    }
    case "sources": {
      const ids = rows.map((row) => row.id).filter(Boolean);
      const existing = ids.length
        ? await prisma.source.findMany({ where: { id: { in: ids } }, select: { id: true } })
        : [];
      existing.forEach((row) => existingNaturalKeys.add(row.id));
      return {
        existingNaturalKeys,
        existingRecipeFamilies: new Set<string>(),
        existingDishes: new Set<string>(),
        existingRecipes: new Set<string>(),
        existingIngredients: new Set<string>(),
        existingSourceImports: new Set<string>(),
        existingSources: new Set<string>(),
        existingGraphNodes: new Set<string>()
      };
    }
    case "variations": {
      const ids = rows.map((row) => row.id).filter(Boolean);
      const parentIds = new Set(rows.map((row) => row.parent_recipe_id).filter(Boolean));
      const childIds = new Set(rows.map((row) => row.variation_recipe_id).filter(Boolean));
      const recipeIds = new Set(Array.from(parentIds).concat(Array.from(childIds)));
      const [existingVariations, existingRecipes] = await Promise.all([
        ids.length
          ? prisma.recipeVariation.findMany({ where: { id: { in: ids } }, select: { id: true } })
          : Promise.resolve([]),
        recipeIds.size ? prisma.recipe.findMany({ where: { id: { in: Array.from(recipeIds) } }, select: { id: true } }) : Promise.resolve([])
      ]);
      existingVariations.forEach((row) => existingNaturalKeys.add(row.id));
      return {
        existingNaturalKeys,
        existingRecipeFamilies: new Set<string>(),
        existingDishes: new Set<string>(),
        existingRecipes: new Set(existingRecipes.map((row) => row.id)),
        existingIngredients: new Set<string>(),
        existingSourceImports: new Set<string>(),
        existingSources: new Set<string>(),
        existingGraphNodes: new Set<string>()
      };
    }
    default:
      return {
        existingNaturalKeys,
        existingRecipeFamilies: new Set<string>(),
        existingDishes: new Set<string>(),
        existingRecipes: new Set<string>(),
        existingIngredients: new Set<string>(),
        existingSourceImports: new Set<string>(),
        existingSources: new Set<string>(),
        existingGraphNodes: new Set<string>()
      };
  }
}

function validateRequiredFields(entityType: ImportEntityType, row: CsvRow, blockingErrors: RowIssue[]) {
  for (const field of REQUIRED_FIELDS[entityType]) {
    if (!row[field]) {
      blockingErrors.push({
        code: "missing_required",
        field,
        message: `Required field '${field}' is missing.`
      });
    }
  }
}

function validateTypeFields(entityType: ImportEntityType, row: CsvRow, blockingErrors: RowIssue[]) {
  const numericFieldsByEntity: Partial<Record<ImportEntityType, string[]>> = {
    edges: ["strength"],
    recipe_ingredients: ["sort_order"],
    sources: ["extraction_confidence"],
    recipes: ["prep_time_minutes", "cook_time_minutes", "total_time_minutes"]
  };

  const numericFields = numericFieldsByEntity[entityType] ?? [];
  for (const field of numericFields) {
    const value = row[field];
    if (!value) continue;
    if (!isFiniteNumber(value)) {
      blockingErrors.push({
        code: "invalid_number",
        field,
        message: `Field '${field}' must be numeric.`
      });
    }
  }
}

function validateForeignKeys(
  entityType: ImportEntityType,
  row: CsvRow,
  context: {
    existingRecipeFamilies: Set<string>;
    existingDishes: Set<string>;
    existingRecipes: Set<string>;
    existingIngredients: Set<string>;
    existingSourceImports: Set<string>;
    existingSources: Set<string>;
    existingGraphNodes: Set<string>;
  },
  blockingErrors: RowIssue[]
) {
  if (entityType === "edges") {
    if (row.source && !context.existingGraphNodes.has(row.source)) {
      blockingErrors.push({
        code: "fk_missing",
        field: "source",
        message: `Edge source '${row.source}' does not exist in graph_nodes.`
      });
    }
    if (row.target && !context.existingGraphNodes.has(row.target)) {
      blockingErrors.push({
        code: "fk_missing",
        field: "target",
        message: `Edge target '${row.target}' does not exist in graph_nodes.`
      });
    }
  }

  if (entityType === "recipes") {
    if (row.recipe_family_id && !context.existingRecipeFamilies.has(row.recipe_family_id)) {
      blockingErrors.push({
        code: "fk_missing",
        field: "recipe_family_id",
        message: `Recipe family '${row.recipe_family_id}' does not exist.`
      });
    }
    if (row.dish_id && !context.existingDishes.has(row.dish_id)) {
      blockingErrors.push({
        code: "fk_missing",
        field: "dish_id",
        message: `Dish '${row.dish_id}' does not exist.`
      });
    }
    if (row.parent_recipe_id && !context.existingRecipes.has(row.parent_recipe_id)) {
      blockingErrors.push({
        code: "fk_missing",
        field: "parent_recipe_id",
        message: `Parent recipe '${row.parent_recipe_id}' does not exist.`
      });
    }
    if (row.source_import_id && !context.existingSourceImports.has(row.source_import_id)) {
      blockingErrors.push({
        code: "fk_missing",
        field: "source_import_id",
        message: `Source import '${row.source_import_id}' does not exist.`
      });
    }
    if (row.source_id && !context.existingSources.has(row.source_id)) {
      blockingErrors.push({
        code: "fk_missing",
        field: "source_id",
        message: `Source '${row.source_id}' does not exist.`
      });
    }
  }

  if (entityType === "recipe_ingredients") {
    if (row.recipe_id && !context.existingRecipes.has(row.recipe_id)) {
      blockingErrors.push({
        code: "fk_missing",
        field: "recipe_id",
        message: `Recipe '${row.recipe_id}' does not exist.`
      });
    }
    if (row.ingredient_id && !context.existingIngredients.has(row.ingredient_id)) {
      blockingErrors.push({
        code: "fk_missing",
        field: "ingredient_id",
        message: `Ingredient '${row.ingredient_id}' does not exist.`
      });
    }
  }

  if (entityType === "variations") {
    if (row.parent_recipe_id && !context.existingRecipes.has(row.parent_recipe_id)) {
      blockingErrors.push({
        code: "fk_missing",
        field: "parent_recipe_id",
        message: `Parent recipe '${row.parent_recipe_id}' does not exist.`
      });
    }
    if (row.variation_recipe_id && !context.existingRecipes.has(row.variation_recipe_id)) {
      blockingErrors.push({
        code: "fk_missing",
        field: "variation_recipe_id",
        message: `Variation recipe '${row.variation_recipe_id}' does not exist.`
      });
    }
  }
}

async function applyRow(tx: Prisma.TransactionClient, entityType: ImportEntityType, row: CsvRow) {
  switch (entityType) {
    case "nodes": {
      const tags = parseStringArray(row.tags);
      await tx.graphNode.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          kind: row.kind,
          label: row.label,
          href: row.href,
          description: row.description || null,
          meta: row.meta || null,
          tags: tags.length ? tags : undefined,
          canonical: parseBoolean(row.canonical),
          cuisineId: row.cuisine_id || null,
          categoryId: row.category_id || null,
          taxonomyId: row.taxonomy_id || null,
          parentTaxonomyId: row.parent_taxonomy_id || null,
          parentCategoryId: row.parent_category_id || null,
          difficultyBandId: row.difficulty_band_id || null,
          primaryMethodId: row.primary_method_id || null,
          category: row.category || null
        },
        update: {
          kind: row.kind,
          label: row.label,
          href: row.href,
          description: row.description || null,
          meta: row.meta || null,
          tags: tags.length ? tags : undefined,
          canonical: parseBoolean(row.canonical),
          cuisineId: row.cuisine_id || null,
          categoryId: row.category_id || null,
          taxonomyId: row.taxonomy_id || null,
          parentTaxonomyId: row.parent_taxonomy_id || null,
          parentCategoryId: row.parent_category_id || null,
          difficultyBandId: row.difficulty_band_id || null,
          primaryMethodId: row.primary_method_id || null,
          category: row.category || null
        }
      });
      return;
    }
    case "edges": {
      await tx.graphEdge.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          source: row.source,
          target: row.target,
          label: row.label,
          kind: row.kind || null,
          strength: row.strength ? Number(row.strength) : null
        },
        update: {
          source: row.source,
          target: row.target,
          label: row.label,
          kind: row.kind || null,
          strength: row.strength ? Number(row.strength) : null
        }
      });
      return;
    }
    case "recipes": {
      await tx.recipe.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          recipeFamilyId: row.recipe_family_id,
          dishId: row.dish_id || null,
          sourceId: row.source_id || null,
          sourceImportId: row.source_import_id || null,
          parentRecipeId: row.parent_recipe_id || null,
          createdByUserId: row.created_by_user_id || null,
          slug: row.slug,
          title: row.title,
          description: row.description,
          serves: row.serves || null,
          prepTimeMinutes: row.prep_time_minutes ? Number(row.prep_time_minutes) : null,
          cookTimeMinutes: row.cook_time_minutes ? Number(row.cook_time_minutes) : null,
          totalTimeMinutes: row.total_time_minutes ? Number(row.total_time_minutes) : null,
          imageUrl: row.image_url || null,
          isSourceRecipe: parseBoolean(row.is_source_recipe),
          isUserVariation: parseBoolean(row.is_user_variation)
        },
        update: {
          recipeFamilyId: row.recipe_family_id,
          dishId: row.dish_id || null,
          sourceId: row.source_id || null,
          sourceImportId: row.source_import_id || null,
          parentRecipeId: row.parent_recipe_id || null,
          createdByUserId: row.created_by_user_id || null,
          slug: row.slug,
          title: row.title,
          description: row.description,
          serves: row.serves || null,
          prepTimeMinutes: row.prep_time_minutes ? Number(row.prep_time_minutes) : null,
          cookTimeMinutes: row.cook_time_minutes ? Number(row.cook_time_minutes) : null,
          totalTimeMinutes: row.total_time_minutes ? Number(row.total_time_minutes) : null,
          imageUrl: row.image_url || null,
          isSourceRecipe: parseBoolean(row.is_source_recipe),
          isUserVariation: parseBoolean(row.is_user_variation)
        }
      });
      return;
    }
    case "ingredients": {
      const aliases = parseStringArray(row.aliases);
      await tx.ingredient.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          canonicalName: row.canonical_name,
          displayName: row.display_name,
          category: row.category || null,
          categoryId: row.category_id || null,
          aliases
        },
        update: {
          canonicalName: row.canonical_name,
          displayName: row.display_name,
          category: row.category || null,
          categoryId: row.category_id || null,
          aliases
        }
      });
      return;
    }
    case "recipe_ingredients": {
      await tx.recipeIngredient.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          recipeId: row.recipe_id,
          ingredientId: row.ingredient_id,
          rawText: row.raw_text,
          quantity: row.quantity || null,
          unit: row.unit || null,
          preparationNote: row.preparation_note || null,
          sortOrder: Number(row.sort_order)
        },
        update: {
          recipeId: row.recipe_id,
          ingredientId: row.ingredient_id,
          rawText: row.raw_text,
          quantity: row.quantity || null,
          unit: row.unit || null,
          preparationNote: row.preparation_note || null,
          sortOrder: Number(row.sort_order)
        }
      });
      return;
    }
    case "sources": {
      await tx.source.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          siteName: row.site_name,
          sourceUrl: row.source_url,
          authorName: row.author_name,
          licenseNote: row.license_note,
          extractionMethod: row.extraction_method,
          extractionConfidence: Number(row.extraction_confidence),
          importedAt: row.imported_at ? new Date(row.imported_at) : new Date()
        },
        update: {
          siteName: row.site_name,
          sourceUrl: row.source_url,
          authorName: row.author_name,
          licenseNote: row.license_note,
          extractionMethod: row.extraction_method,
          extractionConfidence: Number(row.extraction_confidence),
          importedAt: row.imported_at ? new Date(row.imported_at) : undefined
        }
      });
      return;
    }
    case "variations": {
      await tx.recipeVariation.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          parentRecipeId: row.parent_recipe_id,
          variationRecipeId: row.variation_recipe_id,
          variationType: row.variation_type,
          note: row.note || null
        },
        update: {
          parentRecipeId: row.parent_recipe_id,
          variationRecipeId: row.variation_recipe_id,
          variationType: row.variation_type,
          note: row.note || null
        }
      });
      return;
    }
    default:
      throw new Error(`Unsupported import entity type: ${entityType}`);
  }
}

function normalizeRowKeys(row: CsvRow): CsvRow {
  const normalized: CsvRow = {};
  Object.entries(row).forEach(([key, value]) => {
    normalized[normalizeHeader(key)] = value.trim();
  });
  return normalized;
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function buildNaturalKey(row: CsvRow, fields: string[]) {
  const values = fields.map((field) => row[field]).filter(Boolean);
  if (values.length !== fields.length) return "";
  return values.join("::");
}

function findDuplicateKeys(rows: CsvRow[], fields: string[]) {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const key = buildNaturalKey(row, fields);
    if (!key) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([key]) => key));
}

function parseStringArray(value?: string) {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item)).filter((item) => item.length > 0);
      }
    } catch {
      // fall through
    }
  }
  return trimmed
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBoolean(value?: string) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "y";
}

function isFiniteNumber(value: string) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue);
}

function castToRecord(value: unknown): CsvRow {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const record: CsvRow = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, entryValue]) => {
    record[key] = entryValue == null ? "" : String(entryValue);
  });
  return record;
}

function jsonArrayLength(value: unknown) {
  if (!Array.isArray(value)) return 0;
  return value.length;
}

function parseCsv(input: string): { headers: string[]; rows: CsvRow[] } {
  const rows: string[][] = [];
  let currentCell = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (char === '"') {
      if (inQuotes && input[index + 1] === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && input[index + 1] === "\n") {
        index += 1;
      }
      currentRow.push(currentCell);
      if (currentRow.some((value) => value.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell);
  if (currentRow.some((value) => value.trim().length > 0)) {
    rows.push(currentRow);
  }

  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }

  const [headerRow, ...bodyRows] = rows;
  const headers = headerRow.map((header) => header.trim());

  const dataRows = bodyRows
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row) => {
      const record: CsvRow = {};
      headers.forEach((header, index) => {
        record[header] = (row[index] ?? "").trim();
      });
      return record;
    });

  return {
    headers,
    rows: dataRows
  };
}
