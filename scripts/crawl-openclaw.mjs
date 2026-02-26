#!/usr/bin/env node

/**
 * 独立抓取脚本：GitHub + Reddit + OpenClaw Docs
 * 用法： node scripts/crawl-openclaw.mjs "chrome relay token"
 */

import fs from "node:fs";
import path from "node:path";

const query = (process.argv[2] || "openclaw").trim();

function norm(v) {
  return String(v || "").toLowerCase();
}

async function safeFetch(url, init = {}, timeoutMs = 5000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchGithubIssues(q) {
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(`${q} repo:openclaw/openclaw is:issue`)}&per_page=8&sort=updated&order=desc`;
  try {
    const res = await safeFetch(
      url,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "clawququ-crawler",
        },
      },
      6000,
    );
    if (!res.ok) return { source: "github", ok: false, items: [], error: `HTTP ${res.status}` };
    const data = await res.json();
    const items = (data.items || []).map((it) => ({
      sourceType: "GitHub",
      title: it.title || "Untitled",
      url: it.html_url || "https://github.com/openclaw/openclaw/issues",
      content: (it.body || it.title || "").slice(0, 5000),
      fetchedAt: new Date().toISOString(),
    }));
    return { source: "github", ok: true, items };
  } catch (e) {
    return { source: "github", ok: false, items: [], error: e instanceof Error ? e.message : "fetch failed" };
  }
}

async function fetchReddit(q) {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(`openclaw ${q}`)}&sort=relevance&t=year&limit=8`;
  try {
    const res = await safeFetch(
      url,
      {
        headers: { "User-Agent": "Mozilla/5.0 clawququ-crawler" },
      },
      6000,
    );
    if (!res.ok) return { source: "reddit", ok: false, items: [], error: `HTTP ${res.status}` };
    const data = await res.json();
    const items = (data?.data?.children || [])
      .map((c) => c?.data)
      .filter(Boolean)
      .map((d) => ({
        sourceType: "Reddit",
        title: d.title || "Untitled",
        url: d.permalink ? `https://www.reddit.com${d.permalink}` : "https://www.reddit.com",
        content: (d.selftext || d.title || "").slice(0, 5000),
        fetchedAt: new Date().toISOString(),
      }))
      .filter((x) => x.content.length > 0);
    return { source: "reddit", ok: true, items };
  } catch (e) {
    return { source: "reddit", ok: false, items: [], error: e instanceof Error ? e.message : "fetch failed" };
  }
}

async function fetchDocs(q) {
  const docs = [
    "https://docs.openclaw.ai/tools/browser",
    "https://docs.openclaw.ai/tools/chrome-extension",
    "https://docs.openclaw.ai/gateway/security",
    "https://docs.openclaw.ai/gateway/tailscale",
  ];
  const items = [];
  const errors = [];

  for (const url of docs) {
    try {
      const res = await safeFetch(url, {}, 5000);
      if (!res.ok) {
        errors.push(`${url}: HTTP ${res.status}`);
        continue;
      }
      const text = await res.text();
      const content = text.slice(0, 5000);
      // docs 作为高可信来源，即使关键词不命中也保留精简样本
      const shouldKeep =
        norm(content).includes(norm(q)) ||
        norm(content).includes("openclaw") ||
        items.length < 2;

      if (shouldKeep) {
        items.push({
          sourceType: "Docs",
          title: `OpenClaw Docs: ${url.split("/").pop()}`,
          url,
          content,
          fetchedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      errors.push(`${url}: ${e instanceof Error ? e.message : "fetch failed"}`);
    }
  }

  return { source: "docs", ok: items.length > 0 || errors.length === 0, items, error: errors.join(" | ") || undefined };
}

function dedupeByUrl(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = item.url.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

async function main() {
  const [gh, rd, dc] = await Promise.all([
    fetchGithubIssues(query),
    fetchReddit(query),
    fetchDocs(query),
  ]);

  const merged = dedupeByUrl([...gh.items, ...rd.items, ...dc.items]);

  const result = {
    query,
    fetchedAt: new Date().toISOString(),
    sources: {
      github: { ok: gh.ok, count: gh.items.length, error: gh.error || null },
      reddit: { ok: rd.ok, count: rd.items.length, error: rd.error || null },
      docs: { ok: dc.ok, count: dc.items.length, error: dc.error || null },
    },
    total: merged.length,
    items: merged,
  };

  const outDir = path.join(process.cwd(), ".data", "crawl-results");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `openclaw-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");

  console.log(JSON.stringify({
    ok: true,
    query,
    total: result.total,
    sources: result.sources,
    outPath,
  }, null, 2));
}

main().catch((e) => {
  console.error(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }, null, 2));
  process.exit(1);
});
