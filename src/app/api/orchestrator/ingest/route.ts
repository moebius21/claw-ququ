import { ingestRawPost } from "@/data/orchestrator";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    source?: "小红书" | "知乎" | "Reddit" | "Google";
    sourceUrl?: string;
    title?: string;
    content?: string;
  };

  if (!body.source || !body.sourceUrl || !body.title || !body.content) {
    return NextResponse.json(
      { error: "source, sourceUrl, title, content are required" },
      { status: 400 },
    );
  }

  const raw = ingestRawPost({
    source: body.source,
    sourceUrl: body.sourceUrl,
    title: body.title,
    content: body.content,
  });
  return NextResponse.json({ raw }, { status: 201 });
}
