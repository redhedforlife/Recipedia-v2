import { NextResponse } from "next/server";
import { z } from "zod";
import { createVariation } from "@/lib/data";

export const runtime = "nodejs";

const variationSchema = z.object({
  parentSlug: z.string().min(1),
  title: z.string().min(2),
  description: z.string().min(1),
  ingredients: z.array(z.string()).min(1),
  steps: z.array(z.string()).min(1),
  note: z.string().default("")
});

export async function POST(request: Request) {
  try {
    const input = variationSchema.parse(await request.json());
    const recipe = await createVariation(input);
    return NextResponse.json({ slug: recipe.slug });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create variation." },
      { status: 400 }
    );
  }
}

