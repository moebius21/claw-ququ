import { getLatestReportByPostId } from "@/data/orchestrator";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;
  const report = getLatestReportByPostId(postId);

  if (!report) {
    return NextResponse.json({ error: "report not found" }, { status: 404 });
  }

  return NextResponse.json({ report });
}
