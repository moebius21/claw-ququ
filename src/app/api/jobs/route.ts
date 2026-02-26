import { enqueueVerifyJob, listJobs } from "@/data/orchestrator";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ jobs: listJobs() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { postId?: string };
  if (!body.postId) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }

  try {
    const job = enqueueVerifyJob(body.postId);
    return NextResponse.json({ job }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "post not found" }, { status: 404 });
  }
}
