import { NextResponse } from "next/server";

import { runSingleAgentCampaign } from "@/data/xiaohongshu";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      keyword?: string;
      mode?: "hotspot" | "competitor";
      noteCount?: number;
    };

    const result = runSingleAgentCampaign({
      keyword: body.keyword ?? "",
      mode: body.mode === "competitor" ? "competitor" : "hotspot",
      noteCount: Number(body.noteCount ?? 3),
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "unknown error" },
      { status: 400 },
    );
  }
}
