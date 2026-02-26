"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type RawPost = {
  id: string;
  source: "小红书" | "知乎" | "Reddit" | "Google";
  sourceUrl: string;
  title: string;
  content: string;
  fetchedAt: string;
  status: "new" | "accepted" | "ignored" | "review_queued";
};

const statusLabel: Record<RawPost["status"], string> = {
  new: "新导入",
  accepted: "已采纳",
  ignored: "已忽略",
  review_queued: "待复核",
};

export function RawReviewList({ raws }: { raws: RawPost[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const updateStatus = (id: string, action: "accept" | "ignore" | "queue_review") => {
    startTransition(async () => {
      await fetch(`/api/raw-posts/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    });
  };

  return (
    <div className="mt-3 space-y-2 text-sm">
      {raws.length === 0 ? (
        <div className="text-zinc-400">暂无导入数据</div>
      ) : (
        raws.slice(0, 12).map((raw) => (
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
