import { NextResponse } from "next/server";
import { z } from "zod";
import { addCookReport } from "@/lib/data";

export const runtime = "nodejs";

const reportSchema = z.object({
  recipeSlug: z.string().min(1),
  madeIt: z.boolean(),
  rating: z.number().int().min(1).max(5),
  wouldMakeAgain: z.boolean(),
  difficultyRating: z.number().int().min(1).max(5),
  notes: z.string().default("")
});

export async function POST(request: Request) {
  try {
    const input = reportSchema.parse(await request.json());
    const report = await addCookReport(input);
    return NextResponse.json({ id: report.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save cook report." },
      { status: 400 }
    );
  }
}

