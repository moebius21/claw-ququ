"use client";

import { useState, useTransition } from "react";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editTags, setEditTags] = useState("");
  const router = useRouter();

  const publish = (draftId: string) => {
    startTransition(async () => {
      await fetch(`/api/drafts/${draftId}/publish`, { method: "POST" });
      router.refresh();
    });
  };

  const startEdit = (draft: Draft) => {
    setEditingId(draft.id);
    setEditTitle(draft.title);
    setEditSummary(draft.summary);
    setEditTags(draft.tags.join(", "));
  };

  const saveEdit = (draftId: string) => {
    startTransition(async () => {
      await fetch(`/api/drafts/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          summary: editSummary,
          tags: editTags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      setEditingId(null);
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
            {editingId === draft.id ? (
              <div className="space-y-2">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded border border-white/10 bg-zinc-950/40 px-2 py-1 text-xs"
                />
                <textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="min-h-16 w-full rounded border border-white/10 bg-zinc-950/40 px-2 py-1 text-xs"
                />
                <input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full rounded border border-white/10 bg-zinc-950/40 px-2 py-1 text-xs"
                  placeholder="标签用逗号分隔"
                />
              </div>
            ) : (
              <>
                <div className="text-zinc-200">{draft.title}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  {draft.source} · {draft.status} · {new Date(draft.createdAt).toLocaleString("zh-CN")}
                </div>
                <div className="mt-1 text-xs text-zinc-400">{draft.summary}</div>
                <div className="mt-1 text-xs text-zinc-500">标签：{draft.tags.join(" / ")}</div>
              </>
            )}
            <div className="mt-2 flex items-center gap-2">
              {draft.status !== "published" ? (
                <>
                  {editingId === draft.id ? (
                    <>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => saveEdit(draft.id)}
                        className="rounded-md border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-xs text-sky-200"
                      >
                        保存草稿
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setEditingId(null)}
                        className="rounded-md border border-zinc-400/30 bg-zinc-500/10 px-2 py-1 text-xs text-zinc-300"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => startEdit(draft)}
                      className="rounded-md border border-violet-400/30 bg-violet-500/10 px-2 py-1 text-xs text-violet-200"
                    >
                      编辑草稿
                    </button>
                  )}
                </>
              ) : null}
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
