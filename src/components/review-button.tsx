"use client";

import { useState, useTransition } from "react";

export function ReviewButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>("");

  const onClick = () => {
    startTransition(async () => {
      setMessage("正在排队...");
      try {
        const createRes = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        });

        if (!createRes.ok) throw new Error("创建任务失败");
        const createData = (await createRes.json()) as { job: { id: string } };

        setMessage("正在执行复核...");
        const runRes = await fetch(`/api/jobs/${createData.job.id}/run`, {
          method: "POST",
        });
        if (!runRes.ok) throw new Error("执行任务失败");

        setMessage("复核完成，刷新页面可看最新报告");
      } catch {
        setMessage("复核失败，请稍后重试");
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-zinc-100 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "处理中..." : "发起复核"}
      </button>
      {message ? <span className="text-xs text-zinc-400">{message}</span> : null}
    </div>
  );
}
