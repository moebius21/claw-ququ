import Link from "next/link";
import { notFound } from "next/navigation";

import { getLatestReportByPostId, getPublishedPostById } from "@/data/orchestrator";
import { getPostById, type VerificationStatus } from "@/data/posts";

const statusLabel: Record<VerificationStatus, string> = {
  verified: "已验证",
  pending: "待验证",
  outdated: "已过期",
};

const statusStyles: Record<VerificationStatus, string> = {
  verified:
    "border-emerald-400/20 bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/20",
  pending:
    "border-amber-400/20 bg-amber-400/10 text-amber-200 ring-1 ring-amber-400/20",
  outdated:
    "border-zinc-400/20 bg-zinc-400/10 text-zinc-200 ring-1 ring-zinc-400/20",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = getPostById(id) ?? getPublishedPostById(id);
  if (!post) return { title: "帖子不存在 · Claw蛐蛐" };
  return {
    title: `${post.title} · Claw蛐蛐`,
    description: post.summary,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = getPostById(id) ?? getPublishedPostById(id);
  if (!post) notFound();
  const report = getLatestReportByPostId(id);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(900px_circle_at_20%_0%,rgba(56,189,248,0.12),transparent_60%),radial-gradient(700px_circle_at_80%_10%,rgba(167,139,250,0.10),transparent_55%)]" />

      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
          >
            ← 返回首页
          </Link>
          <span className="text-xs text-zinc-500">
            发布于 {new Date(post.createdAt).toLocaleString("zh-CN")}
          </span>
        </div>

        <header className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-xs text-zinc-200 ring-1 ring-white/10">
              {post.source}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${statusStyles[post.verificationStatus]}`}
            >
              {statusLabel[post.verificationStatus]}
            </span>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-zinc-200">
              可信度 {post.trustScore}
            </span>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-zinc-300">
              适用 {post.clawVersion}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {post.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{post.summary}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-zinc-300"
              >
                #{t}
              </span>
            ))}
          </div>
        </header>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-sm font-medium text-white">正文</h2>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-200">
            {post.content}
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-sm font-medium text-white">Agent 验证信息</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-1">
                <dt className="text-zinc-400">验证状态</dt>
                <dd className="mt-1 text-zinc-200">
                  {statusLabel[post.verificationStatus]}
                </dd>
              </div>
              <div className="col-span-1">
                <dt className="text-zinc-400">可信度评分</dt>
                <dd className="mt-1 text-zinc-200">{post.trustScore} / 100</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-zinc-400">验证时间</dt>
                <dd className="mt-1 text-zinc-200">
                  {report?.createdAt
                    ? new Date(report.createdAt).toLocaleString("zh-CN")
                    : post.verifiedAt
                      ? new Date(post.verifiedAt).toLocaleString("zh-CN")
                      : "未验证"}
                </dd>
              </div>
            </dl>
            <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
              <h3 className="text-xs font-medium text-zinc-200">验证结论</h3>
              <p className="mt-1 text-xs leading-6 text-zinc-400">
                {report?.summary ??
                  "MVP 阶段的评分代表 agent 对可复现性、信息一致性、风险提示的综合判断。"}
              </p>
            </div>
            <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
              <h3 className="text-xs font-medium text-zinc-200">建议动作</h3>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-zinc-400">
                <li>优先复用高可信度且已验证内容</li>
                <li>版本不一致时，先对照官方文档再落地</li>
                <li>高风险项建议二次复核后再执行</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-sm font-medium text-white">验证证据</h2>
            {report?.evidence?.length ? (
              <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                {report.evidence.map((ev: { id: string; type: string; title: string; url: string }) => (
                  <li key={ev.id}>
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-200 hover:underline"
                    >
                      [{ev.type}] {ev.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-zinc-400">暂无结构化证据</p>
            )}

            <h3 className="mt-5 text-sm font-medium text-white">风险提示</h3>
            {report?.risks?.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
                {report.risks.map((risk: string) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-zinc-400">暂无风险项</p>
            )}

            <h3 className="mt-5 text-sm font-medium text-white">来源链接</h3>
            <a
              href={post.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block break-all rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-sky-200 hover:bg-black/30"
            >
              {post.sourceUrl}
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

