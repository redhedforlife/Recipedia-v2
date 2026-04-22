import { NextResponse } from "next/server";
import { z } from "zod";
import { publishStagedImport } from "@/lib/import/csvWorkflow";

export const runtime = "nodejs";

const publishSchema = z.object({
  batchId: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const input = publishSchema.parse(await request.json());
    const published = await publishStagedImport(input.batchId);
    return NextResponse.json(published);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to publish staged import."
      },
      { status: 400 }
    );
  }
}
