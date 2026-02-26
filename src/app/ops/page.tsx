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

export default function OpsPage() {
  const jobs = listJobs();
  const raws = listRawPosts();
  const reports = listReports();
  const drafts = listDrafts();
  const published = listPublishedPosts();
  const pendingPublished = published.filter((p) => p.verificationStatus === "pending");
  const lowScorePublished = published.filter((p) => p.trustScore < 75);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Claw蛐蛐 · 编排控制台</h1>
          <Link href="/" className="text-sm text-sky-200 hover:underline">
            返回首页
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

        <JobsQueuePanel jobs={jobs} />
      </main>
    </div>
  );
}
