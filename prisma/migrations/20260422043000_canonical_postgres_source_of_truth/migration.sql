-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ImportEntityType" AS ENUM ('nodes', 'edges', 'recipes', 'ingredients', 'recipe_ingredients', 'sources', 'variations');

-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('preview_ready', 'validation_failed', 'published');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "site_name" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "license_note" TEXT NOT NULL,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extraction_method" TEXT NOT NULL,
    "extraction_confidence" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuisines" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "region_group" TEXT,

    CONSTRAINT "cuisines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cuisine_id" TEXT,
    "parent_category_id" TEXT,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cooking_methods" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "cooking_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "difficulty_bands" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "difficulty_bands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_families" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "category_id" TEXT,
    "cuisine" TEXT,
    "description" TEXT NOT NULL,
    "cuisine_id" TEXT,
    "difficulty_band_id" TEXT,
    "primary_method_id" TEXT,
    "is_canonical" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "recipe_families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "families" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cuisine_id" TEXT,
    "category_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dishes" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cuisine_id" TEXT,
    "category_id" TEXT,
    "family_id" TEXT,
    "confidence_score" DOUBLE PRECISION,
    "recipe_count" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dishes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dish_aliases" (
    "id" TEXT NOT NULL,
    "dish_id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "normalized_alias" TEXT NOT NULL,
    "is_preferred" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dish_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dish_canonical_ingredients" (
    "dish_id" TEXT NOT NULL,
    "ingredient_id" TEXT NOT NULL,
    "family_id" TEXT,
    "role" TEXT NOT NULL DEFAULT 'canonical',
    "is_core" BOOLEAN NOT NULL DEFAULT false,
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dish_canonical_ingredients_pkey" PRIMARY KEY ("dish_id","ingredient_id")
);

-- CreateTable
CREATE TABLE "source_imports" (
    "id" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "site_name" TEXT NOT NULL,
    "author_name" TEXT,
    "license_note" TEXT,
    "extraction_method" TEXT NOT NULL,
    "extraction_confidence" DOUBLE PRECISION NOT NULL,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "recipe_family_id" TEXT NOT NULL,
    "dish_id" TEXT,
    "source_id" TEXT,
    "source_import_id" TEXT,
    "parent_recipe_id" TEXT,
    "created_by_user_id" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serves" TEXT,
    "prep_time_minutes" INTEGER,
    "cook_time_minutes" INTEGER,
    "total_time_minutes" INTEGER,
    "image_url" TEXT,
    "is_source_recipe" BOOLEAN NOT NULL DEFAULT false,
    "is_user_variation" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "canonical_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "category" TEXT,
    "category_id" TEXT,
    "aliases" JSONB NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "parent_category_id" TEXT,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "ingredient_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "techniques" (
    "id" TEXT NOT NULL,
    "canonical_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "technique_group" TEXT,
    "technique_group_id" TEXT,

    CONSTRAINT "techniques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technique_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "parent_category_id" TEXT,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "technique_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuisine_dish_families" (
    "cuisine_id" TEXT NOT NULL,
    "dish_family_id" TEXT NOT NULL,
    "relationship_strength" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "cuisine_dish_families_pkey" PRIMARY KEY ("cuisine_id","dish_family_id")
);

-- CreateTable
CREATE TABLE "dish_family_ingredients" (
    "dish_family_id" TEXT NOT NULL,
    "ingredient_id" TEXT NOT NULL,
    "importance_score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "dish_family_ingredients_pkey" PRIMARY KEY ("dish_family_id","ingredient_id")
);

-- CreateTable
CREATE TABLE "dish_family_techniques" (
    "dish_family_id" TEXT NOT NULL,
    "technique_id" TEXT NOT NULL,
    "importance_score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "dish_family_techniques_pkey" PRIMARY KEY ("dish_family_id","technique_id")
);

-- CreateTable
CREATE TABLE "dish_family_methods" (
    "dish_family_id" TEXT NOT NULL,
    "cooking_method_id" TEXT NOT NULL,
    "importance_score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "dish_family_methods_pkey" PRIMARY KEY ("dish_family_id","cooking_method_id")
);

-- CreateTable
CREATE TABLE "dish_family_related_dish_families" (
    "from_dish_family_id" TEXT NOT NULL,
    "to_dish_family_id" TEXT NOT NULL,
    "relationship_type" TEXT NOT NULL,

    CONSTRAINT "dish_family_related_dish_families_pkey" PRIMARY KEY ("from_dish_family_id","to_dish_family_id","relationship_type")
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "ingredient_id" TEXT NOT NULL,
    "raw_text" TEXT NOT NULL,
    "quantity" TEXT,
    "unit" TEXT,
    "preparation_note" TEXT,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_steps" (
    "id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "instruction_text" TEXT NOT NULL,

    CONSTRAINT "recipe_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_techniques" (
    "id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "technique_id" TEXT NOT NULL,

    CONSTRAINT "recipe_techniques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_changes" (
    "id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "parent_recipe_id" TEXT NOT NULL,
    "change_type" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "before_value" TEXT,
    "after_value" TEXT,
    "note" TEXT,

    CONSTRAINT "recipe_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cook_reports" (
    "id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "made_it" BOOLEAN NOT NULL,
    "rating" INTEGER NOT NULL,
    "would_make_again" BOOLEAN NOT NULL,
    "difficulty_rating" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cook_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_relationships" (
    "id" TEXT NOT NULL,
    "from_recipe_id" TEXT NOT NULL,
    "to_recipe_id" TEXT NOT NULL,
    "relationship_type" TEXT NOT NULL,

    CONSTRAINT "recipe_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "graph_nodes" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "description" TEXT,
    "meta" TEXT,
    "tags" JSONB,
    "canonical" BOOLEAN NOT NULL DEFAULT false,
    "cuisine_id" TEXT,
    "category_id" TEXT,
    "taxonomy_id" TEXT,
    "parent_taxonomy_id" TEXT,
    "parent_category_id" TEXT,
    "difficulty_band_id" TEXT,
    "primary_method_id" TEXT,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "graph_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "graph_edges" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" TEXT,
    "strength" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "graph_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_variations" (
    "id" TEXT NOT NULL,
    "parent_recipe_id" TEXT NOT NULL,
    "variation_recipe_id" TEXT NOT NULL,
    "variation_type" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_variations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "entity_type" "ImportEntityType" NOT NULL,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'preview_ready',
    "filename" TEXT,
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "valid_row_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "warning_count" INTEGER NOT NULL DEFAULT 0,
    "preview_summary" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_rows" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "entity_type" "ImportEntityType" NOT NULL,
    "row_number" INTEGER NOT NULL,
    "raw_row" JSONB NOT NULL,
    "normalized_row" JSONB,
    "blockingErrors" JSONB NOT NULL DEFAULT '[]',
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_rows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sources_source_url_key" ON "sources"("source_url");

-- CreateIndex
CREATE UNIQUE INDEX "cuisines_slug_key" ON "cuisines"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_cuisine_id_idx" ON "categories"("cuisine_id");

-- CreateIndex
CREATE INDEX "categories_parent_category_id_idx" ON "categories"("parent_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "cooking_methods_slug_key" ON "cooking_methods"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "difficulty_bands_slug_key" ON "difficulty_bands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_families_slug_key" ON "recipe_families"("slug");

-- CreateIndex
CREATE INDEX "recipe_families_category_id_idx" ON "recipe_families"("category_id");

-- CreateIndex
CREATE INDEX "recipe_families_cuisine_id_idx" ON "recipe_families"("cuisine_id");

-- CreateIndex
CREATE INDEX "recipe_families_difficulty_band_id_idx" ON "recipe_families"("difficulty_band_id");

-- CreateIndex
CREATE INDEX "recipe_families_primary_method_id_idx" ON "recipe_families"("primary_method_id");

-- CreateIndex
CREATE UNIQUE INDEX "families_slug_key" ON "families"("slug");

-- CreateIndex
CREATE INDEX "families_cuisine_id_idx" ON "families"("cuisine_id");

-- CreateIndex
CREATE INDEX "families_category_id_idx" ON "families"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "dishes_slug_key" ON "dishes"("slug");

-- CreateIndex
CREATE INDEX "dishes_family_id_idx" ON "dishes"("family_id");

-- CreateIndex
CREATE INDEX "dishes_cuisine_id_idx" ON "dishes"("cuisine_id");

-- CreateIndex
CREATE INDEX "dishes_category_id_idx" ON "dishes"("category_id");

-- CreateIndex
CREATE INDEX "dishes_is_published_slug_idx" ON "dishes"("is_published", "slug");

-- CreateIndex
CREATE INDEX "dish_aliases_dish_id_idx" ON "dish_aliases"("dish_id");

-- CreateIndex
CREATE INDEX "dish_aliases_normalized_alias_idx" ON "dish_aliases"("normalized_alias");

-- CreateIndex
CREATE INDEX "dish_canonical_ingredients_ingredient_id_idx" ON "dish_canonical_ingredients"("ingredient_id");

-- CreateIndex
CREATE INDEX "dish_canonical_ingredients_family_id_idx" ON "dish_canonical_ingredients"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "source_imports_source_url_key" ON "source_imports"("source_url");

-- CreateIndex
CREATE UNIQUE INDEX "recipes_slug_key" ON "recipes"("slug");

-- CreateIndex
CREATE INDEX "recipes_recipe_family_id_idx" ON "recipes"("recipe_family_id");

-- CreateIndex
CREATE INDEX "recipes_dish_id_idx" ON "recipes"("dish_id");

-- CreateIndex
CREATE INDEX "recipes_source_import_id_idx" ON "recipes"("source_import_id");

-- CreateIndex
CREATE INDEX "recipes_parent_recipe_id_idx" ON "recipes"("parent_recipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_canonical_name_key" ON "ingredients"("canonical_name");

-- CreateIndex
CREATE INDEX "ingredients_category_id_idx" ON "ingredients"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_categories_slug_key" ON "ingredient_categories"("slug");

-- CreateIndex
CREATE INDEX "ingredient_categories_parent_category_id_idx" ON "ingredient_categories"("parent_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "techniques_canonical_name_key" ON "techniques"("canonical_name");

-- CreateIndex
CREATE INDEX "techniques_technique_group_id_idx" ON "techniques"("technique_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "technique_categories_slug_key" ON "technique_categories"("slug");

-- CreateIndex
CREATE INDEX "technique_categories_parent_category_id_idx" ON "technique_categories"("parent_category_id");

-- CreateIndex
CREATE INDEX "cuisine_dish_families_dish_family_id_idx" ON "cuisine_dish_families"("dish_family_id");

-- CreateIndex
CREATE INDEX "dish_family_ingredients_ingredient_id_idx" ON "dish_family_ingredients"("ingredient_id");

-- CreateIndex
CREATE INDEX "dish_family_techniques_technique_id_idx" ON "dish_family_techniques"("technique_id");

-- CreateIndex
CREATE INDEX "dish_family_methods_cooking_method_id_idx" ON "dish_family_methods"("cooking_method_id");

-- CreateIndex
CREATE INDEX "dish_family_related_dish_families_to_dish_family_id_idx" ON "dish_family_related_dish_families"("to_dish_family_id");

-- CreateIndex
CREATE INDEX "recipe_ingredients_recipe_id_idx" ON "recipe_ingredients"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_ingredients_ingredient_id_idx" ON "recipe_ingredients"("ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_steps_recipe_id_step_number_key" ON "recipe_steps"("recipe_id", "step_number");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_techniques_recipe_id_technique_id_key" ON "recipe_techniques"("recipe_id", "technique_id");

-- CreateIndex
CREATE INDEX "recipe_changes_recipe_id_idx" ON "recipe_changes"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_changes_parent_recipe_id_idx" ON "recipe_changes"("parent_recipe_id");

-- CreateIndex
CREATE INDEX "cook_reports_recipe_id_idx" ON "cook_reports"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_relationships_from_recipe_id_idx" ON "recipe_relationships"("from_recipe_id");

-- CreateIndex
CREATE INDEX "recipe_relationships_to_recipe_id_idx" ON "recipe_relationships"("to_recipe_id");

-- CreateIndex
CREATE INDEX "graph_nodes_kind_idx" ON "graph_nodes"("kind");

-- CreateIndex
CREATE INDEX "graph_nodes_cuisine_id_idx" ON "graph_nodes"("cuisine_id");

-- CreateIndex
CREATE INDEX "graph_nodes_category_id_idx" ON "graph_nodes"("category_id");

-- CreateIndex
CREATE INDEX "graph_edges_source_idx" ON "graph_edges"("source");

-- CreateIndex
CREATE INDEX "graph_edges_target_idx" ON "graph_edges"("target");

-- CreateIndex
CREATE INDEX "recipe_variations_variation_recipe_id_idx" ON "recipe_variations"("variation_recipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_variations_parent_recipe_id_variation_recipe_id_vari_key" ON "recipe_variations"("parent_recipe_id", "variation_recipe_id", "variation_type");

-- CreateIndex
CREATE INDEX "import_batches_entity_type_status_idx" ON "import_batches"("entity_type", "status");

-- CreateIndex
CREATE INDEX "import_rows_batch_id_row_number_idx" ON "import_rows"("batch_id", "row_number");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_cuisine_id_fkey" FOREIGN KEY ("cuisine_id") REFERENCES "cuisines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_families" ADD CONSTRAINT "recipe_families_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_families" ADD CONSTRAINT "recipe_families_cuisine_id_fkey" FOREIGN KEY ("cuisine_id") REFERENCES "cuisines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_families" ADD CONSTRAINT "recipe_families_difficulty_band_id_fkey" FOREIGN KEY ("difficulty_band_id") REFERENCES "difficulty_bands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_families" ADD CONSTRAINT "recipe_families_primary_method_id_fkey" FOREIGN KEY ("primary_method_id") REFERENCES "cooking_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "families" ADD CONSTRAINT "families_cuisine_id_fkey" FOREIGN KEY ("cuisine_id") REFERENCES "cuisines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "families" ADD CONSTRAINT "families_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dishes" ADD CONSTRAINT "dishes_cuisine_id_fkey" FOREIGN KEY ("cuisine_id") REFERENCES "cuisines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dishes" ADD CONSTRAINT "dishes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dishes" ADD CONSTRAINT "dishes_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dish_aliases" ADD CONSTRAINT "dish_aliases_dish_id_fkey" FOREIGN KEY ("dish_id") REFERENCES "dishes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dish_canonical_ingredients" ADD CONSTRAINT "dish_canonical_ingredients_dish_id_fkey" FOREIGN KEY ("dish_id") REFERENCES "dishes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dish_canonical_ingredients" ADD CONSTRAINT "dish_canonical_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dish_canonical_ingredients" ADD CONSTRAINT "dish_canonical_ingredients_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_recipe_family_id_fkey" FOREIGN KEY ("recipe_family_id") REFERENCES "recipe_families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_dish_id_fkey" FOREIGN KEY ("dish_id") REFERENCES "dishes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_source_import_id_fkey" FOREIGN KEY ("source_import_id") REFERENCES "source_imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_parent_recipe_id_fkey" FOREIGN KEY ("parent_recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ingredient_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_categories" ADD CONSTRAINT "ingredient_categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "ingredient_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "techniques" ADD CONSTRAINT "techniques_technique_group_id_fkey" FOREIGN KEY ("technique_group_id") REFERENCES "technique_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technique_categories" ADD CONSTRAINT "technique_categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "technique_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuisine_dish_families" ADD CONSTRAINT "cuisine_dish_families_cuisine_id_fkey" FOREIGN KEY ("cuisine_id") REFERENCES "cuisines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuisine_dish_families" ADD CONSTRAINT "cuisine_dish_families_dish_family_id_fkey" FOREIGN KEY ("dish_family_id") REFERENCES "recipe_families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dish_family_ingredients" ADD CONSTRAINT "dish_family_ingredients_dish_family_id_fkey" FOREIGN KEY ("dish_family_id") REFERENCES "recipe_families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dish_family_ingredients" ADD CONSTRAINT "dish_family_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dish_family_techniques" ADD CONSTRAINT "dish_family_techniques_dish_family_id_fkey" FOREIGN KEY ("dish_family_id") REFERENCES "recipe_families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dish_family_techniques" ADD CONSTRAINT "dish_family_techniques_technique_id_fkey" FOREIGN KEY ("technique_id") REFERENCES "techniques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dish_family_methods" ADD CONSTRAINT "dish_family_methods_dish_family_id_fkey" FOREIGN KEY ("dish_family_id") REFERENCES "recipe_families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dish_family_methods" ADD CONSTRAINT "dish_family_methods_cooking_method_id_fkey" FOREIGN KEY ("cooking_method_id") REFERENCES "cooking_methods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dish_family_related_dish_families" ADD CONSTRAINT "dish_family_related_dish_families_from_dish_family_id_fkey" FOREIGN KEY ("from_dish_family_id") REFERENCES "recipe_families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dish_family_related_dish_families" ADD CONSTRAINT "dish_family_related_dish_families_to_dish_family_id_fkey" FOREIGN KEY ("to_dish_family_id") REFERENCES "recipe_families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_techniques" ADD CONSTRAINT "recipe_techniques_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_techniques" ADD CONSTRAINT "recipe_techniques_technique_id_fkey" FOREIGN KEY ("technique_id") REFERENCES "techniques"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_changes" ADD CONSTRAINT "recipe_changes_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_changes" ADD CONSTRAINT "recipe_changes_parent_recipe_id_fkey" FOREIGN KEY ("parent_recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cook_reports" ADD CONSTRAINT "cook_reports_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cook_reports" ADD CONSTRAINT "cook_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_relationships" ADD CONSTRAINT "recipe_relationships_from_recipe_id_fkey" FOREIGN KEY ("from_recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_relationships" ADD CONSTRAINT "recipe_relationships_to_recipe_id_fkey" FOREIGN KEY ("to_recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "graph_edges" ADD CONSTRAINT "graph_edges_source_fkey" FOREIGN KEY ("source") REFERENCES "graph_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "graph_edges" ADD CONSTRAINT "graph_edges_target_fkey" FOREIGN KEY ("target") REFERENCES "graph_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_variations" ADD CONSTRAINT "recipe_variations_parent_recipe_id_fkey" FOREIGN KEY ("parent_recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_variations" ADD CONSTRAINT "recipe_variations_variation_recipe_id_fkey" FOREIGN KEY ("variation_recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

