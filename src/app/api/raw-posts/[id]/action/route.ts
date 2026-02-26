import { setRawPostStatus } from "@/data/orchestrator";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as { action?: "accept" | "ignore" | "queue_review" };

  if (!body.action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }

  try {
    const raw = setRawPostStatus(id, body.action);
    return NextResponse.json({ raw });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "update failed" },
      { status: 400 },
    );
  }
}
