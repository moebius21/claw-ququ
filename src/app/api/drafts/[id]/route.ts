import { updateDraft } from "@/data/orchestrator";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as {
    title?: string;
    summary?: string;
    tags?: string[];
  };

  try {
    const draft = updateDraft(id, {
      title: body.title,
      summary: body.summary,
      tags: body.tags,
    });
    return NextResponse.json({ draft });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "update failed" },
      { status: 400 },
    );
  }
}
