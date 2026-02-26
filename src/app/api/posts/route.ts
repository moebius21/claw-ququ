import { queryPosts } from "@/data/posts";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tag = url.searchParams.get("tag");
  const source = url.searchParams.get("source");
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q");

  const results = queryPosts({ tag, source, status, q });

  return NextResponse.json({
    total: results.length,
    posts: results,
    applied: { tag, source, status, q },
  });
}

