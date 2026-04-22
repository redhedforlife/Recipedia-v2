import { ImportEntityType } from "@prisma/client";
import { NextResponse } from "next/server";
import { stageCsvImport } from "@/lib/import/csvWorkflow";

export const runtime = "nodejs";

const ENTITY_TYPES = new Set<ImportEntityType>([
  "nodes",
  "edges",
  "recipes",
  "ingredients",
  "recipe_ingredients",
  "sources",
  "variations"
]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const entityTypeRaw = String(formData.get("entityType") ?? "").trim();
    const file = formData.get("file");

    if (!ENTITY_TYPES.has(entityTypeRaw as ImportEntityType)) {
      return NextResponse.json({ error: "Unsupported entity type." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "CSV file is required." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json({ error: "Only .csv files are supported." }, { status: 400 });
    }

    const csvText = await file.text();
    const staged = await stageCsvImport({
      entityType: entityTypeRaw as ImportEntityType,
      filename: file.name,
      csvText
    });

    return NextResponse.json(staged);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to stage CSV import."
      },
      { status: 400 }
    );
  }
}
