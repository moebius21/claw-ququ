"use client";

import Link from "next/link";
import { useState } from "react";

type SearchResponse = {
  query: string;
  local: Array<{
    id: string;
    title: string;
    summary: string;
    source: string;
    sourceUrl: string;
    trustScore: number;
    verificationStatus: string;
    origin: "seed" | "published";
  }>;
  externalCount: number;
  imported: Array<{
    rawId: string;
    publishedId: string;
    jobId: string;
    title: string;
    sourceUrl: string;
    sourceType: "Reddit" | "Docs" | "GitHub" | "Web";
    importedAt: string;
  }>;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState("");

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/search/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error("搜索失败");
      setResult((await res.json()) as SearchResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "搜索失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Claw蛐蛐 · 智能搜索</h1>
          <Link href="/" className="text-sm text-sky-200 hover:underline">
            返回首页
          </Link>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => (e.key === "Enter" ? runSearch() : null)}
              placeholder="输入 OpenClaw 问题，例如：chrome relay token rejected"
              className="w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={runSearch}
              disabled={loading}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-50"
            >
              {loading ? "搜索中..." : "搜索并抓取"}
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            会先检索站内内容，再抓取 Reddit/官方网页并自动导入、发布、复核。
          </p>
          {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
        </div>

        {result ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-sm font-medium text-white">站内命中 ({result.local.length})</h2>
              <div className="mt-3 space-y-2 text-sm">
                {result.local.length === 0 ? (
                  <div className="text-zinc-400">无命中</div>
                ) : (
                  result.local.map((item) => (
                    <div key={`${item.origin}-${item.id}`} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                      <div className="text-zinc-200">{item.title}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {item.source} · {item.origin} · score {item.trustScore} · {item.verificationStatus}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-sm font-medium text-white">新抓取并导入 ({result.imported.length})</h2>
              <div className="mt-3 space-y-2 text-sm">
                {result.imported.length === 0 ? (
                  <div className="text-zinc-400">无新增抓取</div>
                ) : (
                  result.imported.map((item) => (
                    <div key={item.jobId} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                      <div className="text-zinc-200">{item.title}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        来源: {item.sourceType} · 导入: {new Date(item.importedAt).toLocaleString("zh-CN")}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">published: {item.publishedId} · job: {item.jobId}</div>
                      <a className="mt-1 block text-xs text-sky-200 hover:underline" href={item.sourceUrl} target="_blank" rel="noreferrer">
                        查看来源
                      </a>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
