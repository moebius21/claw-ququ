import Link from "next/link";

import { DraftReviewList } from "@/components/draft-review-list";
import { IngestForm } from "@/components/ingest-form";
import { JobsQueuePanel } from "@/components/jobs-queue-panel";
import { PublishedQuickLists } from "@/components/published-quick-lists";
import { RawReviewList } from "@/components/raw-review-list";
import {
  listDrafts,
  listJobs,
  listPublishedPosts,
  listRawPosts,
  listReports,
} from "@/data/orchestrator";

export default async function OpsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const qJob = Array.isArray(sp.job) ? sp.job[0] : sp.job;
  const qPub = Array.isArray(sp.pub) ? sp.pub[0] : sp.pub;

  const jobs = listJobs();
  const raws = listRawPosts();
  const reports = listReports();
  const drafts = listDrafts();
  const published = listPublishedPosts();

  const pendingPublishedAll = published.filter((p) => p.verificationStatus === "pending");
  const lowScorePublishedAll = published.filter((p) => p.trustScore < 75);

  const pendingPublished =
    qPub === "low" ? lowScorePublishedAll : qPub === "pending" ? pendingPublishedAll : pendingPublishedAll;
  const lowScorePublished =
    qPub === "pending" ? pendingPublishedAll : qPub === "low" ? lowScorePublishedAll : lowScorePublishedAll;

  const filteredJobs =
    qJob === "queued"
      ? jobs.filter((j) => j.status === "queued")
      : qJob === "failed"
        ? jobs.filter((j) => j.status === "failed")
        : jobs;

  const isToday = (iso: string | null | undefined) => {
    if (!iso) return false;
    const d = new Date(iso);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  const todayImported = raws.filter((r) => isToday(r.fetchedAt)).length;
  const todayDrafted = drafts.filter((d) => isToday(d.createdAt)).length;
  const todayPublished = published.filter((p) => isToday(p.createdAt)).length;
  const todayReviewed = jobs.filter((j) => j.status === "done" && isToday(j.updatedAt)).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Claw蛐蛐 · 编排控制台</h1>
          <div className="flex items-center gap-3">
            <Link href="/ops/xiaohongshu" className="text-sm text-emerald-200 hover:underline">
              单 Agent 小红书案例
            </Link>
            <Link href="/" className="text-sm text-sky-200 hover:underline">
              返回首页
            </Link>
          </div>
        </div>

        <section className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-medium text-white">今日处理进度</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <div className="text-[11px] text-zinc-400">今日导入</div>
              <div className="mt-1 text-lg font-semibold text-zinc-100">{todayImported}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <div className="text-[11px] text-zinc-400">今日生成草稿</div>
              <div className="mt-1 text-lg font-semibold text-zinc-100">{todayDrafted}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <div className="text-[11px] text-zinc-400">今日发布</div>
              <div className="mt-1 text-lg font-semibold text-zinc-100">{todayPublished}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <div className="text-[11px] text-zinc-400">今日复核完成</div>
              <div className="mt-1 text-lg font-semibold text-zinc-100">{todayReviewed}</div>
            </div>
          </div>
        </section>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <Link href="/ops" className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-zinc-200">
            全部任务 ({jobs.length})
          </Link>
          <Link href="/ops?job=queued" className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-amber-200">
            queued ({jobs.filter((j) => j.status === "queued").length})
          </Link>
          <Link href="/ops?job=failed" className="rounded-full border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 text-rose-200">
            failed ({jobs.filter((j) => j.status === "failed").length})
          </Link>
          <Link href="/ops?pub=pending" className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-sky-200">
            已发布待复核 ({pendingPublishedAll.length})
          </Link>
          <Link href="/ops?pub=low" className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-violet-200">
            已发布低分 ({lowScorePublishedAll.length})
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-zinc-400">Raw Posts</div>
            <div className="mt-2 text-2xl font-semibold">{raws.length}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-zinc-400">Jobs</div>
            <div className="mt-2 text-2xl font-semibold">{jobs.length}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-zinc-400">Reports</div>
            <div className="mt-2 text-2xl font-semibold">{reports.length}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-zinc-400">Drafts</div>
            <div className="mt-2 text-2xl font-semibold">{drafts.length}</div>
          </div>
        </div>

        <section className="mt-8">
          <IngestForm />
        </section>

        <section className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-medium text-white">最近导入（Raw Posts）</h2>
          <RawReviewList raws={raws} />
        </section>

        <section className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-medium text-white">帖子草稿（Drafts）</h2>
          <DraftReviewList drafts={drafts} />
        </section>

        <PublishedQuickLists pending={pendingPublished} lowScore={lowScorePublished} />

        <JobsQueuePanel jobs={filteredJobs} />
      </main>
    </div>
  );
}
