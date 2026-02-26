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
  fetched_at TEXT NOT NULL
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
`);

const reportCount = (db.prepare("SELECT COUNT(*) as c FROM reports").get() as { c: number }).c;
if (reportCount === 0) {
  const insertRaw = db.prepare(
    "INSERT OR IGNORE INTO raw_posts (id, source, source_url, title, content, fetched_at) VALUES (?, ?, ?, ?, ?, ?)",
  );
  const insertReport = db.prepare(
    "INSERT INTO reports (id, post_id, status, trust_score, summary, risks_json, versions_json, claims_json, evidence_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );

  for (const p of posts) {
    insertRaw.run(`raw-${p.id}`, p.source, p.sourceUrl, p.title, p.content, p.createdAt);

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
  const post = getPostById(postId);
  if (!post) throw new Error("post not found");
  return post;
};

export const listRawPosts = (): RawPost[] =>
  db
    .prepare(
      "SELECT id, source, source_url as sourceUrl, title, content, fetched_at as fetchedAt FROM raw_posts ORDER BY fetched_at DESC",
    )
    .all() as RawPost[];

export const listJobs = (): VerifyJob[] =>
  db
    .prepare(
      "SELECT id, post_id as postId, status, created_at as createdAt, updated_at as updatedAt, error FROM jobs ORDER BY created_at DESC",
    )
    .all() as VerifyJob[];

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
  };

  db.prepare(
    "INSERT INTO raw_posts (id, source, source_url, title, content, fetched_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(raw.id, raw.source, raw.sourceUrl, raw.title, raw.content, raw.fetchedAt);

  return raw;
};
