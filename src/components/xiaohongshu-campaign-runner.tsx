"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function XiaohongshuCampaignRunner() {
  const [keyword, setKeyword] = useState("openclaw");
  const [mode, setMode] = useState<"hotspot" | "competitor">("hotspot");
  const [noteCount, setNoteCount] = useState(3);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    startTransition(async () => {
      setMessage("单 Agent pipeline 运行中...");
      const res = await fetch("/api/xiaohongshu/campaigns/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, mode, noteCount }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage(data.error ? `运行失败：${data.error}` : "运行失败");
        return;
      }

      setMessage("运行完成，已生成 campaign、话题、笔记和物料包。 ");
      router.refresh();
    });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">运行单 Agent 小红书案例</h2>
          <p className="mt-1 text-xs text-zinc-400">
            同一个 agent 顺序完成 collect → analyze → draft → package，适合稳定演示。
          </p>
        </div>
        <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200">
          single-agent pipeline
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-zinc-300">
          主题关键词
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="openclaw"
            className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-xs text-zinc-300">
          模式
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "hotspot" | "competitor")}
            className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm"
          >
            <option value="hotspot">热点追踪</option>
            <option value="competitor">竞品分析</option>
          </select>
        </label>

        <label className="text-xs text-zinc-300">
          生成篇数
          <input
            type="number"
            min={1}
            max={6}
            value={noteCount}
            onChange={(e) => setNoteCount(Number(e.target.value || 1))}
            className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-zinc-900 disabled:opacity-60"
        >
          {isPending ? "运行中..." : "启动案例"}
        </button>
        {message ? <span className="text-xs text-zinc-400">{message}</span> : null}
      </div>
    </div>
  );
}
