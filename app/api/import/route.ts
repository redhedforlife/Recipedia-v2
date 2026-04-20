import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getData, registerImportedRecipe } from "@/lib/data";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

const importSchema = z.object({
  url: z.string().url(),
  familySlug: z.string().min(1)
});

type ExtractedRecipe = {
  title: string;
  source_url: string;
  author_name: string;
  ingredients: string[];
  instructions: string[];
  extraction_method: "recipe-scrapers" | "json-ld" | "beautiful-soup";
  extraction_confidence: number;
};

export async function POST(request: Request) {
  try {
    const input = importSchema.parse(await request.json());
    const url = new URL(input.url);
    if (!url.hostname.includes("seriouseats.com")) {
      return NextResponse.json({ error: "MVP imports Serious Eats URLs only." }, { status: 400 });
    }

    const { stdout } = await execFileAsync("python3", [
      "scripts/ingest_seriouseats.py",
      "--url",
      input.url,
      "--stdout"
    ], {
      cwd: process.cwd(),
      timeout: 45000,
      maxBuffer: 1024 * 1024 * 4
    });

    const extracted = JSON.parse(stdout) as ExtractedRecipe;
    const data = await getData();
    const family = data.families.find((candidate) => candidate.slug === input.familySlug);
    if (!family) {
      return NextResponse.json({ error: "Recipe family was not found." }, { status: 400 });
    }

    const recipe = await registerImportedRecipe({
      title: extracted.title,
      sourceUrl: extracted.source_url,
      authorName: extracted.author_name,
      ingredients: extracted.ingredients,
      instructions: extracted.instructions,
      category: family.category,
      familySlug: input.familySlug,
      extractionMethod: extracted.extraction_method,
      extractionConfidence: extracted.extraction_confidence
    });

    return NextResponse.json(recipe);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not import recipe. Install Python requirements and try again."
      },
      { status: 400 }
    );
  }
}

