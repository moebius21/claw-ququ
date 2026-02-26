"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type Job = {
  id: string;
  postId: string;
  status: "queued" | "running" | "done" | "failed";
  createdAt: string;
  updatedAt: string;
  error?: string;
};

const statusStyle: Record<Job["status"], string> = {
  queued: "text-amber-200",
  running: "text-sky-200",
  done: "text-emerald-200",
  failed: "text-rose-200",
};

export function JobsQueuePanel({ jobs }: { jobs: Job[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const runJob = (id: string) => {
    startTransition(async () => {
      await fetch(`/api/jobs/${id}/run`, { method: "POST" });
      router.refresh();
    });
  };

  const runAllQueued = () => {
    startTransition(async () => {
      const queued = jobs.filter((j) => j.status === "queued").slice(0, 20);
      for (const job of queued) {
        await fetch(`/api/jobs/${job.id}/run`, { method: "POST" });
      }
      router.refresh();
    });
  };

  return (
    <section className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-white">最近任务</h2>
        <button
          type="button"
          disabled={isPending || !jobs.some((j) => j.status === "queued")}
          onClick={runAllQueued}
          className="rounded-md border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-xs text-sky-200 disabled:opacity-50"
        >
          一键执行全部 queued
        </button>
      </div>

      <div className="mt-3 space-y-2 text-sm">
        {jobs.length === 0 ? (
          <div className="text-zinc-400">暂无任务</div>
        ) : (
          jobs.slice(0, 20).map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2"
            >
              <div>
                <div className="text-zinc-200">{job.id}</div>
                <div className="text-xs text-zinc-500">postId: {job.postId}</div>
                {job.error ? <div className="text-xs text-rose-300">error: {job.error}</div> : null}
              </div>
              <div className="flex items-center gap-3">
                <div className={`text-xs ${statusStyle[job.status]}`}>{job.status}</div>
                {job.status === "queued" ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => runJob(job.id)}
                    className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200"
                  >
                    执行
                  </button>
                ) : null}
                {job.status === "failed" ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => runJob(job.id)}
                    className="rounded-md border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-200"
                  >
                    重试
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
