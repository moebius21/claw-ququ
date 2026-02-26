import { enqueueVerifyJobForPublished } from "@/data/orchestrator";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const result = enqueueVerifyJobForPublished(id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "queue failed" },
      { status: 400 },
    );
  }
}
