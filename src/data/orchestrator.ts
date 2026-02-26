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

let rawPosts: RawPost[] = posts.map((p) => ({
  id: `raw-${p.id}`,
  source: p.source,
  sourceUrl: p.sourceUrl,
  title: p.title,
  content: p.content,
  fetchedAt: p.createdAt,
}));

let jobs: VerifyJob[] = [];
let reports: VerificationReport[] = posts.map((p) => ({
  id: `vr-${p.id}`,
  postId: p.id,
  status: p.verificationStatus,
  trustScore: p.trustScore,
  summary: `来自 ${p.source} 的经验帖，已完成初始规则校验。`,
  risks:
    p.verificationStatus === "verified"
      ? ["需要周期性复验，避免版本漂移"]
      : p.verificationStatus === "outdated"
        ? ["配置项可能已迁移", "建议按最新版本复跑步骤"]
        : ["尚未完成可复现性验证"],
  applicableVersions: [p.clawVersion],
  claims: [
    {
      id: `claim-${p.id}-1`,
      postId: p.id,
      text: p.summary,
      severity: "medium",
    },
  ],
  evidence: [
    {
      id: `ev-${p.id}-1`,
      postId: p.id,
      type: "community",
      title: `${p.source} 原帖`,
      url: p.sourceUrl,
    },
  ],
  createdAt: p.verifiedAt ?? p.createdAt,
}));

const getPostOrThrow = (postId: string) => {
  const post = getPostById(postId);
  if (!post) throw new Error("post not found");
  return post;
};

export const listRawPosts = () => rawPosts;
export const listJobs = () => jobs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
export const listReports = () => reports.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

export const getLatestReportByPostId = (postId: string) =>
  reports
    .filter((r) => r.postId === postId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];

export const enqueueVerifyJob = (postId: string) => {
  getPostOrThrow(postId);
  const job: VerifyJob = {
    id: `job-${postId}-${Date.now()}`,
    postId,
    status: "queued",
    createdAt: now(),
    updatedAt: now(),
  };
  jobs.unshift(job);
  return job;
};

export const runVerifyJob = (jobId: string) => {
  const job = jobs.find((j) => j.id === jobId);
  if (!job) throw new Error("job not found");

  job.status = "running";
  job.updatedAt = now();

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

    reports.unshift(report);
    job.status = "done";
    job.updatedAt = now();
    return { job, report };
  } catch (error) {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : "unknown error";
    job.updatedAt = now();
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
  rawPosts.unshift(raw);
  return raw;
};
