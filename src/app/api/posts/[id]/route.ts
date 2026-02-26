import { getPostById } from "@/data/posts";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const post = getPostById(id);
  if (!post) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "帖子不存在" },
      { status: 404 },
    );
  }
  return NextResponse.json({ post });
}
