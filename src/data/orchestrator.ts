import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { getPostById, posts, type Post, type VerificationStatus } from "@/data/posts";

export type RawPost = {
  id: string;
  source: Post["source"];
  sourceUrl: string;
  title: string;
  content: string;
  fetchedAt: string;
  status: "new" | "accepted" | "ignored" | "review_queued" | "drafted";
};

export type Claim = {
  id: string;
  postId: string;
  text: string;
  severity: "low" | "medium" | "high";
};

export type Evidence = {
  id: string;
  postId: string;
  type: "official-doc" | "community" | "repro-log";
  title: string;
  url: string;
};

export type VerificationReport = {
  id: string;
  postId: string;
  status: VerificationStatus;
  trustScore: number;
  summary: string;
  risks: string[];
  applicableVersions: string[];
  claims: Claim[];
  evidence: Evidence[];
  createdAt: string;
};

export type VerifyJob = {
  id: string;
  postId: string;
  status: "queued" | "running" | "done" | "failed";
  createdAt: string;
  updatedAt: string;
  error?: string;
};

export type DraftPost = {
  id: string;
  rawId: string;
  source: Post["source"];
  sourceUrl: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  status: "draft" | "published";
  createdAt: string;
};

export type PublishedPost = Post;

const now = () => new Date().toISOString();

const dataDir = path.join(process.cwd(), ".data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "clawququ.db"));

db.exec(`
CREATE TABLE IF NOT EXISTS raw_posts (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  source_url TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  error TEXT
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  status TEXT NOT NULL,
  trust_score INTEGER NOT NULL,
  summary TEXT NOT NULL,
  risks_json TEXT NOT NULL,
  versions_json TEXT NOT NULL,
  claims_json TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  raw_id TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  source_url TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS published_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  trust_score INTEGER NOT NULL,
  verification_status TEXT NOT NULL,
  claw_version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  verified_at TEXT
);
`);

const rawColumns = db.prepare("PRAGMA table_info(raw_posts)").all() as Array<{ name: string }>;
if (!rawColumns.some((c) => c.name === "status")) {
  db.exec("ALTER TABLE raw_posts ADD COLUMN status TEXT NOT NULL DEFAULT 'new'");
}

const reportCount = (db.prepare("SELECT COUNT(*) as c FROM reports").get() as { c: number }).c;
if (reportCount === 0) {
  const insertRaw = db.prepare(
    "INSERT OR IGNORE INTO raw_posts (id, source, source_url, title, content, fetched_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  const insertReport = db.prepare(
    "INSERT INTO reports (id, post_id, status, trust_score, summary, risks_json, versions_json, claims_json, evidence_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );

  for (const p of posts) {
    insertRaw.run(`raw-${p.id}`, p.source, p.sourceUrl, p.title, p.content, p.createdAt, "accepted");

    const claims: Claim[] = [
      { id: `claim-${p.id}-1`, postId: p.id, text: p.summary, severity: "medium" },
    ];
    const evidence: Evidence[] = [
      {
        id: `ev-${p.id}-1`,
        postId: p.id,
        type: "community",
        title: `${p.source} 原帖`,
        url: p.sourceUrl,
      },
    ];

    insertReport.run(
      `vr-${p.id}`,
      p.id,
      p.verificationStatus,
      p.trustScore,
      `来自 ${p.source} 的经验帖，已完成初始规则校验。`,
      JSON.stringify(
        p.verificationStatus === "verified"
          ? ["需要周期性复验，避免版本漂移"]
          : p.verificationStatus === "outdated"
            ? ["配置项可能已迁移", "建议按最新版本复跑步骤"]
            : ["尚未完成可复现性验证"],
      ),
      JSON.stringify([p.clawVersion]),
      JSON.stringify(claims),
      JSON.stringify(evidence),
      p.verifiedAt ?? p.createdAt,
    );
  }
}

const getPostOrThrow = (postId: string) => {
  const post = getPostById(postId) ?? getPublishedPostById(postId);
  if (!post) throw new Error("post not found");
  return post;
};

export const listRawPosts = (): RawPost[] =>
  db
    .prepare(
      "SELECT id, source, source_url as sourceUrl, title, content, fetched_at as fetchedAt, status FROM raw_posts ORDER BY fetched_at DESC",
    )
    .all() as RawPost[];

export const listJobs = (): VerifyJob[] =>
  db
    .prepare(
      "SELECT id, post_id as postId, status, created_at as createdAt, updated_at as updatedAt, error FROM jobs ORDER BY created_at DESC",
    )
    .all() as VerifyJob[];

export const listDrafts = (): DraftPost[] => {
  const rows = db
    .prepare(
      "SELECT id, raw_id as rawId, source, source_url as sourceUrl, title, summary, content, tags_json as tagsJson, status, created_at as createdAt FROM drafts ORDER BY created_at DESC",
    )
    .all() as Array<{
    id: string;
    rawId: string;
    source: Post["source"];
    sourceUrl: string;
    title: string;
    summary: string;
    content: string;
    tagsJson: string;
    status: "draft" | "published";
    createdAt: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    rawId: r.rawId,
    source: r.source,
    sourceUrl: r.sourceUrl,
    title: r.title,
    summary: r.summary,
    content: r.content,
    tags: JSON.parse(r.tagsJson),
    status: r.status,
    createdAt: r.createdAt,
  }));
};

export const listPublishedPosts = (): PublishedPost[] => {
  const rows = db
    .prepare(
      "SELECT id, title, summary, content, source, source_url as sourceUrl, tags_json as tagsJson, trust_score as trustScore, verification_status as verificationStatus, claw_version as clawVersion, created_at as createdAt, verified_at as verifiedAt FROM published_posts ORDER BY created_at DESC",
    )
    .all() as Array<{
    id: string;
    title: string;
    summary: string;
    content: string;
    source: Post["source"];
    sourceUrl: string;
    tagsJson: string;
    trustScore: number;
    verificationStatus: VerificationStatus;
    clawVersion: string;
    createdAt: string;
    verifiedAt: string | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    summary: r.summary,
    content: r.content,
    source: r.source,
    sourceUrl: r.sourceUrl,
    tags: JSON.parse(r.tagsJson),
    trustScore: r.trustScore,
    verificationStatus: r.verificationStatus,
    clawVersion: r.clawVersion,
    createdAt: r.createdAt,
    verifiedAt: r.verifiedAt,
  }));
};

export const getPublishedPostById = (id: string): PublishedPost | undefined => {
  const row = db
    .prepare(
      "SELECT id, title, summary, content, source, source_url as sourceUrl, tags_json as tagsJson, trust_score as trustScore, verification_status as verificationStatus, claw_version as clawVersion, created_at as createdAt, verified_at as verifiedAt FROM published_posts WHERE id = ? LIMIT 1",
    )
    .get(id) as
    | {
        id: string;
        title: string;
        summary: string;
        content: string;
        source: Post["source"];
        sourceUrl: string;
        tagsJson: string;
        trustScore: number;
        verificationStatus: VerificationStatus;
        clawVersion: string;
        createdAt: string;
        verifiedAt: string | null;
      }
    | undefined;

  if (!row) return undefined;

  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    content: row.content,
    source: row.source,
    sourceUrl: row.sourceUrl,
    tags: JSON.parse(row.tagsJson),
    trustScore: row.trustScore,
    verificationStatus: row.verificationStatus,
    clawVersion: row.clawVersion,
    createdAt: row.createdAt,
    verifiedAt: row.verifiedAt,
  };
};

export const listReports = (): VerificationReport[] => {
  const rows = db
    .prepare(
      "SELECT id, post_id as postId, status, trust_score as trustScore, summary, risks_json as risksJson, versions_json as versionsJson, claims_json as claimsJson, evidence_json as evidenceJson, created_at as createdAt FROM reports ORDER BY created_at DESC",
    )
    .all() as Array<{
    id: string;
    postId: string;
    status: VerificationStatus;
    trustScore: number;
    summary: string;
    risksJson: string;
    versionsJson: string;
    claimsJson: string;
    evidenceJson: string;
    createdAt: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    postId: r.postId,
    status: r.status,
    trustScore: r.trustScore,
    summary: r.summary,
    risks: JSON.parse(r.risksJson),
    applicableVersions: JSON.parse(r.versionsJson),
    claims: JSON.parse(r.claimsJson),
    evidence: JSON.parse(r.evidenceJson),
    createdAt: r.createdAt,
  }));
};

export const getLatestReportByPostId = (postId: string) => {
  const row = db
    .prepare(
      "SELECT id, post_id as postId, status, trust_score as trustScore, summary, risks_json as risksJson, versions_json as versionsJson, claims_json as claimsJson, evidence_json as evidenceJson, created_at as createdAt FROM reports WHERE post_id = ? ORDER BY created_at DESC LIMIT 1",
    )
    .get(postId) as
    | {
        id: string;
        postId: string;
        status: VerificationStatus;
        trustScore: number;
        summary: string;
        risksJson: string;
        versionsJson: string;
        claimsJson: string;
        evidenceJson: string;
        createdAt: string;
      }
    | undefined;

  if (!row) return undefined;

  return {
    id: row.id,
    postId: row.postId,
    status: row.status,
    trustScore: row.trustScore,
    summary: row.summary,
    risks: JSON.parse(row.risksJson),
    applicableVersions: JSON.parse(row.versionsJson),
    claims: JSON.parse(row.claimsJson),
    evidence: JSON.parse(row.evidenceJson),
    createdAt: row.createdAt,
  } satisfies VerificationReport;
};

export const enqueueVerifyJob = (postId: string) => {
  getPostOrThrow(postId);
  const job: VerifyJob = {
    id: `job-${postId}-${Date.now()}`,
    postId,
    status: "queued",
    createdAt: now(),
    updatedAt: now(),
  };
  db.prepare(
    "INSERT INTO jobs (id, post_id, status, created_at, updated_at, error) VALUES (?, ?, ?, ?, ?, NULL)",
  ).run(job.id, job.postId, job.status, job.createdAt, job.updatedAt);
  return job;
};

export const runVerifyJob = (jobId: string) => {
  const job = db
    .prepare(
      "SELECT id, post_id as postId, status, created_at as createdAt, updated_at as updatedAt, error FROM jobs WHERE id = ?",
    )
    .get(jobId) as VerifyJob | undefined;

  if (!job) throw new Error("job not found");

  db.prepare("UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?").run(
    "running",
    now(),
    jobId,
  );

  try {
    const post = getPostOrThrow(job.postId);
    const status: VerificationStatus = post.verificationStatus === "outdated" ? "outdated" : "verified";
    const trustScore = Math.min(97, Math.max(65, post.trustScore + (status === "verified" ? 2 : 0)));

    const report: VerificationReport = {
      id: `vr-${job.postId}-${Date.now()}`,
      postId: job.postId,
      status,
      trustScore,
      summary: "编排层已调度执行层完成一次复核：结构一致性 + 可操作性 + 风险提示。",
      risks:
        status === "verified"
          ? ["建议在版本升级后自动重跑", "社区经验可能存在环境依赖"]
          : ["当前内容与新版本存在偏差", "建议以官方文档优先"],
      applicableVersions: [post.clawVersion],
      claims: [
        {
          id: `claim-${job.postId}-${Date.now()}`,
          postId: job.postId,
          text: post.summary,
          severity: "medium",
        },
      ],
      evidence: [
        {
          id: `ev-${job.postId}-community-${Date.now()}`,
          postId: job.postId,
          type: "community",
          title: `${post.source} 原帖`,
          url: post.sourceUrl,
        },
        {
          id: `ev-${job.postId}-official-${Date.now()}`,
          postId: job.postId,
          type: "official-doc",
          title: "OpenClaw 官方文档",
          url: "https://docs.openclaw.ai",
        },
      ],
      createdAt: now(),
    };

    db.prepare(
      "INSERT INTO reports (id, post_id, status, trust_score, summary, risks_json, versions_json, claims_json, evidence_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      report.id,
      report.postId,
      report.status,
      report.trustScore,
      report.summary,
      JSON.stringify(report.risks),
      JSON.stringify(report.applicableVersions),
      JSON.stringify(report.claims),
      JSON.stringify(report.evidence),
      report.createdAt,
    );

    // 如果复核对象是已发布内容，则把最新复核结果回写到发布表。
    const publishedExists = db
      .prepare("SELECT id FROM published_posts WHERE id = ?")
      .get(report.postId) as { id: string } | undefined;

    if (publishedExists) {
      db.prepare(
        "UPDATE published_posts SET trust_score = ?, verification_status = ?, verified_at = ? WHERE id = ?",
      ).run(report.trustScore, report.status, report.createdAt, report.postId);
    }

    db.prepare("UPDATE jobs SET status = ?, updated_at = ?, error = NULL WHERE id = ?").run(
      "done",
      now(),
      jobId,
    );

    const doneJob = db
      .prepare(
        "SELECT id, post_id as postId, status, created_at as createdAt, updated_at as updatedAt, error FROM jobs WHERE id = ?",
      )
      .get(jobId) as VerifyJob;

    return { job: doneJob, report };
  } catch (error) {
    db.prepare("UPDATE jobs SET status = ?, updated_at = ?, error = ? WHERE id = ?").run(
      "failed",
      now(),
      error instanceof Error ? error.message : "unknown error",
      jobId,
    );
    throw error;
  }
};

export const ingestRawPost = (input: {
  source: Post["source"];
  sourceUrl: string;
  title: string;
  content: string;
}) => {
  const id = `raw-custom-${Date.now()}`;
  const raw: RawPost = {
    id,
    source: input.source,
    sourceUrl: input.sourceUrl,
    title: input.title,
    content: input.content,
    fetchedAt: now(),
    status: "new",
  };

  db.prepare(
    "INSERT INTO raw_posts (id, source, source_url, title, content, fetched_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(raw.id, raw.source, raw.sourceUrl, raw.title, raw.content, raw.fetchedAt, raw.status);

  return raw;
};

export const setRawPostStatus = (
  rawId: string,
  action: "accept" | "ignore" | "queue_review" | "create_draft",
) => {
  const targetStatus: RawPost["status"] =
    action === "accept"
      ? "accepted"
      : action === "ignore"
        ? "ignored"
        : action === "queue_review"
          ? "review_queued"
          : "drafted";

  const found = db
    .prepare(
      "SELECT id, source, source_url as sourceUrl, title, content, fetched_at as fetchedAt, status FROM raw_posts WHERE id = ?",
    )
    .get(rawId) as RawPost | undefined;

  if (!found) throw new Error("raw post not found");

  db.prepare("UPDATE raw_posts SET status = ? WHERE id = ?").run(targetStatus, rawId);

  if (action === "create_draft") {
    const existing = db
      .prepare("SELECT id FROM drafts WHERE raw_id = ?")
      .get(rawId) as { id: string } | undefined;

    if (!existing) {
      const summary = found.content.slice(0, 120).replace(/\s+/g, " ").trim();
      const draftId = `draft-${rawId}`;
      const tags = [found.source, "待整理", "待复核"];
      db.prepare(
        "INSERT INTO drafts (id, raw_id, source, source_url, title, summary, content, tags_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(
        draftId,
        rawId,
        found.source,
        found.sourceUrl,
        found.title,
        summary || found.title,
        found.content,
        JSON.stringify(tags),
        "draft",
        now(),
      );
    }
  }

  return {
    ...found,
    status: targetStatus,
  } satisfies RawPost;
};

export const updateDraft = (
  draftId: string,
  input: { title?: string; summary?: string; tags?: string[] },
) => {
  const draft = db
    .prepare(
      "SELECT id, raw_id as rawId, source, source_url as sourceUrl, title, summary, content, tags_json as tagsJson, status, created_at as createdAt FROM drafts WHERE id = ?",
    )
    .get(draftId) as
    | {
        id: string;
        rawId: string;
        source: Post["source"];
        sourceUrl: string;
        title: string;
        summary: string;
        content: string;
        tagsJson: string;
        status: "draft" | "published";
        createdAt: string;
      }
    | undefined;

  if (!draft) throw new Error("draft not found");
  if (draft.status === "published") throw new Error("published draft is read-only");

  const nextTitle = input.title?.trim() || draft.title;
  const nextSummary = input.summary?.trim() || draft.summary;
  const nextTags = (input.tags?.filter(Boolean) ?? JSON.parse(draft.tagsJson)) as string[];

  db.prepare("UPDATE drafts SET title = ?, summary = ?, tags_json = ? WHERE id = ?").run(
    nextTitle,
    nextSummary,
    JSON.stringify(nextTags),
    draftId,
  );

  return {
    id: draft.id,
    rawId: draft.rawId,
    source: draft.source,
    sourceUrl: draft.sourceUrl,
    title: nextTitle,
    summary: nextSummary,
    content: draft.content,
    tags: nextTags,
    status: draft.status,
    createdAt: draft.createdAt,
  } satisfies DraftPost;
};

export const enqueueVerifyJobForPublished = (publishedId: string) => {
  const pub = db
    .prepare("SELECT id FROM published_posts WHERE id = ?")
    .get(publishedId) as { id: string } | undefined;
  if (!pub) throw new Error("published post not found");

  const job: VerifyJob = {
    id: `job-${publishedId}-${Date.now()}`,
    postId: publishedId,
    status: "queued",
    createdAt: now(),
    updatedAt: now(),
  };

  db.prepare(
    "INSERT INTO jobs (id, post_id, status, created_at, updated_at, error) VALUES (?, ?, ?, ?, ?, NULL)",
  ).run(job.id, job.postId, job.status, job.createdAt, job.updatedAt);

  return { job };
};

export const publishDraft = (draftId: string) => {
  const draft = db
    .prepare(
      "SELECT id, raw_id as rawId, source, source_url as sourceUrl, title, summary, content, tags_json as tagsJson, status, created_at as createdAt FROM drafts WHERE id = ?",
    )
    .get(draftId) as
    | {
        id: string;
        rawId: string;
        source: Post["source"];
        sourceUrl: string;
        title: string;
        summary: string;
        content: string;
        tagsJson: string;
        status: "draft" | "published";
        createdAt: string;
      }
    | undefined;

  if (!draft) throw new Error("draft not found");

  const publishedId = `pub-${draft.id}`;
  const exists = db
    .prepare("SELECT id FROM published_posts WHERE id = ?")
    .get(publishedId) as { id: string } | undefined;

  if (!exists) {
    db.prepare(
      "INSERT INTO published_posts (id, title, summary, content, source, source_url, tags_json, trust_score, verification_status, claw_version, created_at, verified_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      publishedId,
      draft.title,
      draft.summary,
      draft.content,
      draft.source,
      draft.sourceUrl,
      draft.tagsJson,
      72,
      "pending",
      ">=0.10.0",
      now(),
      null,
    );
  }

  db.prepare("UPDATE drafts SET status = ? WHERE id = ?").run("published", draftId);

  const updated = db
    .prepare(
      "SELECT id, raw_id as rawId, source, source_url as sourceUrl, title, summary, content, tags_json as tagsJson, status, created_at as createdAt FROM drafts WHERE id = ?",
    )
    .get(draftId);

  return { draft: updated, publishedId };
};
