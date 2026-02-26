"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type RawPost = {
  id: string;
  source: "小红书" | "知乎" | "Reddit" | "Google";
  sourceUrl: string;
  title: string;
  content: string;
  fetchedAt: string;
  status: "new" | "accepted" | "ignored" | "review_queued" | "drafted";
};

const statusLabel: Record<RawPost["status"], string> = {
  new: "新导入",
  accepted: "已采纳",
  ignored: "已忽略",
  review_queued: "待复核",
  drafted: "已生成草稿",
};

export function RawReviewList({ raws }: { raws: RawPost[] }) {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RawPost["status"] | "all">("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const router = useRouter();

  const updateStatus = (
    id: string,
    action: "accept" | "ignore" | "queue_review" | "create_draft",
  ) => {
    startTransition(async () => {
      await fetch(`/api/raw-posts/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return raws
      .filter((r) => (statusFilter === "all" ? true : r.status === statusFilter))
      .filter((r) => {
        if (!q) return true;
        return [r.title, r.content, r.source].join("\n").toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sortOrder === "desc") return a.fetchedAt < b.fetchedAt ? 1 : -1;
        return a.fetchedAt > b.fetchedAt ? 1 : -1;
      });
  }, [raws, query, statusFilter, sortOrder]);

  return (
    <div className="mt-3 space-y-2 text-sm">
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索标题/内容/来源"
          className="rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-100"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RawPost["status"] | "all")}
          className="rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-100"
        >
          <option value="all">全部状态</option>
          <option value="new">新导入</option>
          <option value="accepted">已采纳</option>
          <option value="review_queued">待复核</option>
          <option value="drafted">已生成草稿</option>
          <option value="ignored">已忽略</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
          className="rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-100"
        >
          <option value="desc">按时间：最新优先</option>
          <option value="asc">按时间：最旧优先</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-zinc-400">没有匹配的数据</div>
      ) : (
        filtered.slice(0, 20).map((raw) => (
          <div key={raw.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-zinc-200">{raw.title}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  {raw.source} · {new Date(raw.fetchedAt).toLocaleString("zh-CN")} · {statusLabel[raw.status]}
                </div>
              </div>
              <a href={raw.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-sky-200 hover:underline">
                原文
              </a>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => updateStatus(raw.id, "accept")}
                className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200"
              >
                采纳为候选
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => updateStatus(raw.id, "queue_review")}
                className="rounded-md border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-xs text-sky-200"
              >
                加入复核队列
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => updateStatus(raw.id, "create_draft")}
                className="rounded-md border border-violet-400/30 bg-violet-500/10 px-2 py-1 text-xs text-violet-200"
              >
                生成帖子草稿
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => updateStatus(raw.id, "ignore")}
                className="rounded-md border border-zinc-400/30 bg-zinc-500/10 px-2 py-1 text-xs text-zinc-300"
              >
                忽略
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
