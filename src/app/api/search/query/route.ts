import {
  enqueueVerifyJobForPublished,
  ingestRawPost,
  listPublishedPosts,
  listReports,
  publishDraft,
  runVerifyJob,
  setRawPostStatus,
} from "@/data/orchestrator";
import { posts } from "@/data/posts";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type LocalResult = {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  trustScore: number;
  verificationStatus: string;
  origin: "seed" | "published";
};

const norm = (v: string) => v.toLowerCase().trim();

async function fetchReddit(query: string) {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(`openclaw ${query}`)}&sort=relevance&t=year&limit=5`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 clawququ-bot" },
    cache: "no-store",
  });
  if (!res.ok) return [] as Array<{ title: string; url: string; content: string }>;
  const data = (await res.json()) as {
    data?: { children?: Array<{ data?: { title?: string; selftext?: string; permalink?: string } }> };
  };

  return (data.data?.children ?? [])
    .map((c) => c.data)
    .filter(Boolean)
    .map((d) => ({
      title: d?.title?.trim() || "Untitled",
      url: d?.permalink ? `https://www.reddit.com${d.permalink}` : "https://www.reddit.com",
      content: d?.selftext?.trim() || d?.title?.trim() || "",
    }))
    .filter((x) => x.content.length > 0);
}

async function fetchGithubIssues(query: string) {
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(`${query} repo:openclaw/openclaw is:issue`)}&per_page=5&sort=updated&order=desc`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "clawququ-search-bot",
      },
      cache: "no-store",
    });
    if (!res.ok) return [] as Array<{ title: string; url: string; content: string }>;
    const data = (await res.json()) as {
      items?: Array<{ title?: string; html_url?: string; body?: string }>;
    };

    return (data.items ?? []).map((it) => ({
      title: `GitHub Issue: ${it.title?.trim() || "Untitled"}`,
      url: it.html_url || "https://github.com/openclaw/openclaw/issues",
      content: (it.body || it.title || "").slice(0, 5000),
    }));
  } catch {
    return [];
  }
}

async function fetchDocs(query: string) {
  const seeds = [
    "https://docs.openclaw.ai/tools/browser",
    "https://docs.openclaw.ai/tools/chrome-extension",
    "https://docs.openclaw.ai/gateway/security",
    "https://docs.openclaw.ai/gateway/tailscale",
  ];

  const items: Array<{ title: string; url: string; content: string }> = [];
  for (const url of seeds) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) continue;
      const text = await r.text();
      const plain = text.slice(0, 4000);
      if (norm(plain).includes(norm(query)) || norm(plain).includes("openclaw")) {
        items.push({
          title: `OpenClaw Docs: ${url.split("/").pop()}`,
          url,
          content: plain,
        });
      }
    } catch {
      // ignore
    }
  }
  return items.slice(0, 4);
}

function localSearch(query: string): LocalResult[] {
  const q = norm(query);
  const h = (s: string) => norm(s).includes(q);

  const seed = posts
    .filter((p) => h([p.title, p.summary, p.content, p.source, ...p.tags].join("\n")))
    .map((p) => ({
      id: p.id,
      title: p.title,
      summary: p.summary,
      source: p.source,
      sourceUrl: p.sourceUrl,
      trustScore: p.trustScore,
      verificationStatus: p.verificationStatus,
      origin: "seed" as const,
    }));

  const reportMap = new Map(listReports().map((r) => [r.postId, r]));
  const published = listPublishedPosts()
    .filter((p) => h([p.title, p.summary, p.content, p.source, ...p.tags].join("\n")))
    .map((p) => ({
      id: p.id,
      title: p.title,
      summary: p.summary,
      source: p.source,
      sourceUrl: p.sourceUrl,
      trustScore: p.trustScore,
      verificationStatus: reportMap.get(p.id)?.status ?? p.verificationStatus,
      origin: "published" as const,
    }));

  return [...published, ...seed].slice(0, 20);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { query?: string };
  const query = body.query?.trim();
  if (!query) return NextResponse.json({ error: "query is required" }, { status: 400 });

  const local = localSearch(query);
  const [reddit, docs, githubIssues] = await Promise.all([
    fetchReddit(query),
    fetchDocs(query),
    fetchGithubIssues(query),
  ]);

  const knownSourceUrls = new Set<string>([
    ...posts.map((p) => p.sourceUrl),
    ...listPublishedPosts().map((p) => p.sourceUrl),
  ]);

  const seen = new Set<string>();
  const external = [...reddit, ...docs, ...githubIssues]
    .filter((item) => {
      const url = item.url.trim();
      if (!url) return false;
      if (knownSourceUrls.has(url)) return false;
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    })
    .slice(0, 10);

  const imported: Array<{ rawId: string; publishedId: string; jobId: string; title: string; sourceUrl: string }> = [];
  for (const item of external) {
    const raw = ingestRawPost({
      source: item.url.includes("reddit.com") ? "Reddit" : "Google",
      sourceUrl: item.url,
      title: item.title,
      content: item.content.slice(0, 5000),
    });

    // 自动从 raw 生成草稿并发布，再加入复核队列
    setRawPostStatus(raw.id, "create_draft");
    const draftResult = publishDraft(`draft-${raw.id}`) as { publishedId: string };
    const queued = enqueueVerifyJobForPublished(draftResult.publishedId) as { job: { id: string } };

    try {
      runVerifyJob(queued.job.id);
    } catch {
      // keep queued/failed state
    }

    imported.push({
      rawId: raw.id,
      publishedId: draftResult.publishedId,
      jobId: queued.job.id,
      title: item.title,
      sourceUrl: item.url,
    });
  }

  return NextResponse.json({
    query,
    local,
    externalCount: external.length,
    imported,
  });
}
