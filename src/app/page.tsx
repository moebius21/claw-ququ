import Link from "next/link";

import { ReviewButton } from "@/components/review-button";
import { listPublishedPosts } from "@/data/orchestrator";
import { posts, queryPosts, type Post, type VerificationStatus } from "@/data/posts";

const getFirst = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

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

const sourceStyles: Record<Post["source"], string> = {
  小红书: "bg-pink-500/10 text-pink-200 ring-1 ring-pink-400/20",
  知乎: "bg-sky-500/10 text-sky-200 ring-1 ring-sky-400/20",
  Reddit: "bg-orange-500/10 text-orange-200 ring-1 ring-orange-400/20",
  Google: "bg-violet-500/10 text-violet-200 ring-1 ring-violet-400/20",
};

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const tag = getFirst(sp.tag) ?? "";
  const source = getFirst(sp.source) ?? "";
  const status = getFirst(sp.status) ?? "";
  const q = getFirst(sp.q) ?? "";

  const filteredStatic = queryPosts({
    tag: tag || null,
    source: source || null,
    status: status || null,
    q: q || null,
  });

  const published = listPublishedPosts();
  const normalize = (v: string) => v.trim().toLowerCase();
  const filteredPublished = published
    .filter((post) => {
      if (tag && !post.tags.some((t) => normalize(t) === normalize(tag))) return false;
      if (source && normalize(post.source) !== normalize(source)) return false;
      if (status && normalize(post.verificationStatus) !== normalize(status)) return false;
      if (q) {
        const h = normalize([post.title, post.summary, post.content, post.source, ...post.tags].join("\n"));
        if (!h.includes(normalize(q))) return false;
      }
      return true;
    })
    .map((post) => ({ ...post, contentOrigin: "published" as const }));

  const filteredSeed = filteredStatic.map((post) => ({
    ...post,
    contentOrigin: "seed" as const,
  }));

  const filtered = [...filteredPublished, ...filteredSeed].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );

  const allTags = Array.from(new Set([...posts, ...published].flatMap((p) => p.tags))).sort((a, b) =>
    a.localeCompare(b, "zh-Hans-CN"),
  );
  const allSources = Array.from(new Set([...posts, ...published].map((p) => p.source)));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(900px_circle_at_20%_0%,rgba(56,189,248,0.14),transparent_60%),radial-gradient(700px_circle_at_80%_10%,rgba(167,139,250,0.12),transparent_55%),radial-gradient(500px_circle_at_50%_90%,rgba(34,197,94,0.10),transparent_55%)]" />
      <main className="mx-auto w-full max-w-5xl px-6 py-14">
        <header className="flex flex-col gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.65)]" />
            OpenClaw 社区知识库 · MVP
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Claw蛐蛐
          </h1>
          <p className="max-w-2xl text-base leading-7 text-zinc-300">
            聚合小红书、知乎、Reddit、Google 的 OpenClaw 使用经验帖；每条帖子由 agent
            进行可信度验证，方便人类和 AI agent 快速检索与复用。
          </p>
          <div className="flex gap-2">
            <Link
              href="/search"
              className="inline-flex rounded-lg border border-sky-400/25 bg-sky-500/10 px-3 py-1.5 text-xs text-sky-100 hover:bg-sky-500/20"
            >
              智能搜索
            </Link>
            <Link
              href="/assessment"
              className="inline-flex rounded-lg border border-violet-400/25 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-100 hover:bg-violet-500/20"
            >
              关系角色测评
            </Link>
            <Link
              href="/ops"
              className="inline-flex rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-zinc-100 hover:bg-white/15"
            >
              进入编排控制台（Ops）
            </Link>
          </div>
        </header>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <form method="get" className="grid gap-3 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <label className="text-xs text-zinc-300">搜索</label>
              <input
                name="q"
                defaultValue={q}
                placeholder="例如：429 / schema / 权限 / streaming"
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/20"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-xs text-zinc-300">来源</label>
              <select
                name="source"
                defaultValue={source}
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/20"
              >
                <option value="">全部</option>
                {allSources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-zinc-300">状态</label>
              <select
                name="status"
                defaultValue={status}
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/20"
              >
                <option value="">全部</option>
                <option value="verified">已验证</option>
                <option value="pending">待验证</option>
                <option value="outdated">已过期</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-zinc-300">标签</label>
              <select
                name="tag"
                defaultValue={tag}
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/20"
              >
                <option value="">全部</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-12 flex items-center justify-between pt-2">
              <div className="text-sm text-zinc-400">
                共 <span className="text-zinc-200">{filtered.length}</span> 条
                （全部 {posts.length + published.length} 条）
              </div>
              <div className="flex gap-2">
                <Link
                  href="/"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
                >
                  重置
                </Link>
                <button
                  type="submit"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
                >
                  筛选
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="mt-8 grid gap-4">
          {filtered.map((post) => (
            <div
              key={post.id}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-white/20 hover:bg-white/[0.07]"
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${sourceStyles[post.source]}`}
                  >
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
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-zinc-300">
                    来源类型 {post.contentOrigin === "published" ? "发布" : "种子"}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <Link
                    href={`/posts/${post.id}`}
                    className="text-lg font-semibold text-white hover:text-sky-200"
                  >
                    {post.title}
                  </Link>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                <p className="text-sm leading-6 text-zinc-300">
                  {post.summary}
                </p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.slice(0, 5).map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-zinc-300"
                    >
                      #{t}
                    </span>
                  ))}
                  {post.tags.length > 5 ? (
                    <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-zinc-500">
                      +{post.tags.length - 5}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-zinc-500">
                    最近复核：
                    {post.verifiedAt
                      ? new Date(post.verifiedAt).toLocaleString("zh-CN")
                      : "未复核"}
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/posts/${post.id}`}
                      className="text-xs text-sky-200 hover:underline"
                    >
                      查看详情与验证报告 →
                    </Link>
                    <ReviewButton postId={post.id} />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-zinc-300">
              没有匹配的帖子。试试清空筛选或换个关键词。
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
