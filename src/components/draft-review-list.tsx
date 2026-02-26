"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type Draft = {
  id: string;
  rawId: string;
  source: "小红书" | "知乎" | "Reddit" | "Google";
  sourceUrl: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  status: "draft" | "published";
  createdAt: string;
};

export function DraftReviewList({ drafts }: { drafts: Draft[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const publish = (draftId: string) => {
    startTransition(async () => {
      await fetch(`/api/drafts/${draftId}/publish`, { method: "POST" });
      router.refresh();
    });
  };

  return (
    <div className="mt-3 space-y-2 text-sm">
      {drafts.length === 0 ? (
        <div className="text-zinc-400">暂无草稿</div>
      ) : (
        drafts.slice(0, 10).map((draft) => (
          <div key={draft.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <div className="text-zinc-200">{draft.title}</div>
            <div className="mt-1 text-xs text-zinc-500">
              {draft.source} · {draft.status} · {new Date(draft.createdAt).toLocaleString("zh-CN")}
            </div>
            <div className="mt-1 text-xs text-zinc-400">{draft.summary}</div>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                disabled={isPending || draft.status === "published"}
                onClick={() => publish(draft.id)}
                className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200 disabled:opacity-50"
              >
                {draft.status === "published" ? "已发布" : "发布到首页"}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
