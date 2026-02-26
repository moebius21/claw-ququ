"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type Published = {
  id: string;
  title: string;
  trustScore: number;
  verificationStatus: "verified" | "pending" | "outdated";
  verifiedAt: string | null;
};

function Item({ p }: { p: Published }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const queueReview = () => {
    startTransition(async () => {
      await fetch(`/api/published/${p.id}/queue-review`, { method: "POST" });
      router.refresh();
    });
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-zinc-200">{p.title}</div>
      <div className="mt-1 text-xs text-zinc-500">
        score {p.trustScore} · {p.verificationStatus}
        {p.verifiedAt ? ` · 最近复核 ${new Date(p.verifiedAt).toLocaleString("zh-CN")}` : " · 未复核"}
      </div>
      <div className="mt-2">
        <button
          type="button"
          disabled={isPending}
          onClick={queueReview}
          className="rounded-md border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-xs text-sky-200"
        >
          加入复核队列
        </button>
      </div>
    </div>
  );
}

export function PublishedQuickLists({
  pending,
  lowScore,
}: {
  pending: Published[];
  lowScore: Published[];
}) {
  return (
    <section className="mt-8 grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-medium text-white">已发布待复核</h2>
        <div className="mt-3 space-y-2 text-sm">
          {pending.length === 0 ? (
            <div className="text-zinc-400">暂无待复核发布内容</div>
          ) : (
            pending.slice(0, 8).map((p) => <Item key={p.id} p={p} />)
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-medium text-white">已发布低分内容（&lt;75）</h2>
        <div className="mt-3 space-y-2 text-sm">
          {lowScore.length === 0 ? (
            <div className="text-zinc-400">暂无低分发布内容</div>
          ) : (
            lowScore.slice(0, 8).map((p) => <Item key={p.id} p={p} />)
          )}
        </div>
      </div>
    </section>
  );
}
