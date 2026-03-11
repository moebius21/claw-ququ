import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type CampaignMode = "hotspot" | "competitor";
export type PipelineStage = "collect" | "analyze" | "draft" | "package";
export type PipelineStageStatus = "done";

export type Campaign = {
  id: string;
  keyword: string;
  mode: CampaignMode;
  noteCount: number;
  status: "done";
  summary: string;
  collectSummary: string;
  analyzeSummary: string;
  draftSummary: string;
  packageSummary: string;
  createdAt: string;
  updatedAt: string;
};

export type CampaignRun = {
  id: string;
  campaignId: string;
  stage: PipelineStage;
  status: PipelineStageStatus;
  title: string;
  detail: string;
  createdAt: string;
};

export type CampaignTopic = {
  id: string;
  campaignId: string;
  title: string;
  angle: string;
  reason: string;
  sourceType: string;
  score: number;
  picked: boolean;
};

export type GeneratedNote = {
  id: string;
  campaignId: string;
  topicId: string;
  title: string;
  hook: string;
  body: string;
  coverText: string;
  hashtags: string[];
  cards: string[];
  status: "generated";
  createdAt: string;
};

export type MaterialPackage = {
  id: string;
  campaignId: string;
  topicId: string;
  name: string;
  outputDir: string;
  summary: string;
  files: string[];
  createdAt: string;
};

const now = () => new Date().toISOString();
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const dataDir = path.join(process.cwd(), ".data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "clawququ.db"));

db.exec(`
CREATE TABLE IF NOT EXISTS xhs_campaigns (
  id TEXT PRIMARY KEY,
  keyword TEXT NOT NULL,
  mode TEXT NOT NULL,
  note_count INTEGER NOT NULL,
  status TEXT NOT NULL,
  summary TEXT NOT NULL,
  collect_summary TEXT NOT NULL,
  analyze_summary TEXT NOT NULL,
  draft_summary TEXT NOT NULL,
  package_summary TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS xhs_campaign_runs (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS xhs_campaign_topics (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  title TEXT NOT NULL,
  angle TEXT NOT NULL,
  reason TEXT NOT NULL,
  source_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  picked INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS xhs_generated_notes (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  title TEXT NOT NULL,
  hook TEXT NOT NULL,
  body TEXT NOT NULL,
  cover_text TEXT NOT NULL,
  hashtags_json TEXT NOT NULL,
  cards_json TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS xhs_material_packages (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  name TEXT NOT NULL,
  output_dir TEXT NOT NULL,
  summary TEXT NOT NULL,
  files_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`);

const keywordSeeds = {
  hotspot: [
    "7 天上手",
    "效率流",
    "低门槛 demo",
    "避坑清单",
    "分享会可复现案例",
    "一人可搭建",
  ],
  competitor: [
    "爆文拆解",
    "对标选题",
    "术语翻译",
    "案例改写",
    "高互动结构",
    "新手友好讲法",
  ],
} as const;

const stageTitle: Record<PipelineStage, string> = {
  collect: "collect / 素材收集",
  analyze: "analyze / 选题分析",
  draft: "draft / 笔记生成",
  package: "package / 产物打包",
};

function buildCollectedTopics(keyword: string, mode: CampaignMode): Omit<CampaignTopic, "id" | "campaignId">[] {
  const seeds = keywordSeeds[mode];
  const sourceType = mode === "hotspot" ? "热榜候选" : "竞品笔记";

  return seeds.map((seed, index) => ({
    title:
      mode === "hotspot"
        ? `${keyword} ${seed}`
        : `${keyword} ${seed}怎么讲更容易火`,
    angle:
      mode === "hotspot"
        ? `从 ${seed} 切入，把复杂的 OpenClaw 使用路径压缩成一次可演示的闭环。`
        : `参考竞品常见结构，把 ${keyword} 讲成“问题-方案-结果”的实战案例。`,
    reason:
      mode === "hotspot"
        ? `适合今晚分享场景：关键词明确、可视化结果强、能快速建立信任。`
        : `适合做对标创作：标题结构清晰，容易转成可复用的内容模板。`,
    sourceType,
    score: Math.max(72, 94 - index * 3),
    picked: false,
  }));
}

function pickTopics(collected: Omit<CampaignTopic, "id" | "campaignId">[], noteCount: number) {
  return collected
    .slice()
    .sort((a, b) => b.score - a.score)
    .map((topic, index) => ({ ...topic, picked: index < noteCount }));
}

function makeNoteBody(keyword: string, topicTitle: string, angle: string, mode: CampaignMode) {
  const opening =
    mode === "hotspot"
      ? `如果你今晚要分享 ${keyword}，又不想只讲概念，那最好的方式就是现场跑一个单 Agent 流水线 demo。`
      : `我把 ${keyword} 相关竞品笔记看了一圈，发现真正容易拿到互动的，不是功能堆砌，而是把一个真实案例讲透。`;

  return [
    opening,
    "",
    `这次我把主题定成：${topicTitle}`,
    `切入角度：${angle}`,
    "",
    "为什么这个选题适合讲：",
    "1. 用户能立刻看懂输入和输出。",
    "2. 演示链路短，稳定性高。",
    "3. 可以自然带出 OpenClaw 的工具编排能力。",
    "",
    "我这套 demo 的结构很简单：",
    "- collect：先准备候选素材",
    "- analyze：挑出更值得讲的话题",
    "- draft：自动生成笔记文案",
    "- package：整理成可展示的物料包",
    "",
    "重点不是做得多复杂，而是让观众看到：一个 Agent 就能把闭环跑通。",
    "",
    "如果你也想做分享，建议优先准备这种能现场跑起来的案例，可信度会比 PPT 高很多。",
  ].join("\n");
}

function makeCards(topicTitle: string, keyword: string) {
  return [
    `封面：${topicTitle}`,
    `${keyword} 的场景痛点与机会`,
    "单 Agent 流水线的四个阶段",
    "演示过程中的关键看点",
    "最终产物与后续可扩展方向",
  ];
}

export function runSingleAgentCampaign(input: {
  keyword: string;
  mode: CampaignMode;
  noteCount: number;
}) {
  const keyword = input.keyword.trim();
  if (!keyword) throw new Error("keyword is required");

  const safeNoteCount = Math.min(6, Math.max(1, input.noteCount));
  const campaignId = uid("xhs-campaign");
  const createdAt = now();

  const collected = buildCollectedTopics(keyword, input.mode);
  const analyzed = pickTopics(collected, safeNoteCount);
  const selected = analyzed.filter((topic) => topic.picked);

  const runs: CampaignRun[] = [
    {
      id: uid("xhs-run"),
      campaignId,
      stage: "collect",
      status: "done",
      title: stageTitle.collect,
      detail: `已生成 ${collected.length} 条候选素材，来源类型：${input.mode === "hotspot" ? "热榜模拟数据" : "竞品模拟数据"}。`,
      createdAt,
    },
    {
      id: uid("xhs-run"),
      campaignId,
      stage: "analyze",
      status: "done",
      title: stageTitle.analyze,
      detail: `已筛选 ${selected.length} 个高潜主题，优先考虑分享场景、可视化结果和标题张力。`,
      createdAt,
    },
  ];

  const notes: GeneratedNote[] = selected.map((topic, index) => ({
    id: uid("xhs-note"),
    campaignId,
    topicId: uid(`topic-ref-${index}`),
    title: `${topic.title}：一个人也能跑通的 OpenClaw 内容流水线`,
    hook: `别再上来就讲多 Agent 了，先把 ${topic.title} 这个单 Agent 案例跑通。`,
    body: makeNoteBody(keyword, topic.title, topic.angle, input.mode),
    coverText: `${keyword}\n单 Agent 案例`,
    hashtags: [keyword, "OpenClaw", "AI工作流", "小红书运营", "分享会案例"],
    cards: makeCards(topic.title, keyword),
    status: "generated",
    createdAt,
  }));

  runs.push({
    id: uid("xhs-run"),
    campaignId,
    stage: "draft",
    status: "done",
    title: stageTitle.draft,
    detail: `已生成 ${notes.length} 篇笔记草稿，每篇都包含标题、hook、正文、封面文案与卡片页结构。`,
    createdAt,
  });

  const topicIdMap = new Map<string, string>();
  const topics: CampaignTopic[] = analyzed.map((topic, index) => {
    const id = notes[index]?.topicId ?? uid("xhs-topic");
    topicIdMap.set(topic.title, id);
    return {
      id,
      campaignId,
      title: topic.title,
      angle: topic.angle,
      reason: topic.reason,
      sourceType: topic.sourceType,
      score: topic.score,
      picked: topic.picked,
    };
  });

  const packages: MaterialPackage[] = selected.map((topic) => {
    const topicId = topicIdMap.get(topic.title) ?? uid("xhs-topic");
    const slug = topic.title.replace(/\s+/g, "-").replace(/[\\/]/g, "-");
    const outputDir = path.join(process.cwd(), "tmp", "xhs-demo", campaignId, slug);
    const files = [
      `${outputDir}/note.md`,
      `${outputDir}/cover.txt`,
      `${outputDir}/cards.json`,
      `${outputDir}/publish-checklist.txt`,
    ];

    return {
      id: uid("xhs-pkg"),
      campaignId,
      topicId,
      name: `${topic.title} 物料包`,
      outputDir,
      summary: "包含笔记正文、封面文案、卡片分页结构与发布检查清单。",
      files,
      createdAt,
    };
  });

  runs.push({
    id: uid("xhs-run"),
    campaignId,
    stage: "package",
    status: "done",
    title: stageTitle.package,
    detail: `已打包 ${packages.length} 份演示物料，输出目录位于 tmp/xhs-demo/<campaignId>/...`,
    createdAt,
  });

  const campaign: Campaign = {
    id: campaignId,
    keyword,
    mode: input.mode,
    noteCount: safeNoteCount,
    status: "done",
    summary: `单 Agent 已完成一轮 ${input.mode === "hotspot" ? "热点追踪" : "竞品分析"} campaign，从素材到笔记物料全部串行跑通。`,
    collectSummary: runs[0].detail,
    analyzeSummary: runs[1].detail,
    draftSummary: runs[2].detail,
    packageSummary: runs[3].detail,
    createdAt,
    updatedAt: createdAt,
  };

  const insertCampaign = db.prepare(
    `INSERT INTO xhs_campaigns (id, keyword, mode, note_count, status, summary, collect_summary, analyze_summary, draft_summary, package_summary, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertRun = db.prepare(
    `INSERT INTO xhs_campaign_runs (id, campaign_id, stage, status, title, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertTopic = db.prepare(
    `INSERT INTO xhs_campaign_topics (id, campaign_id, title, angle, reason, source_type, score, picked)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertNote = db.prepare(
    `INSERT INTO xhs_generated_notes (id, campaign_id, topic_id, title, hook, body, cover_text, hashtags_json, cards_json, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertPackage = db.prepare(
    `INSERT INTO xhs_material_packages (id, campaign_id, topic_id, name, output_dir, summary, files_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const tx = db.transaction(() => {
    insertCampaign.run(
      campaign.id,
      campaign.keyword,
      campaign.mode,
      campaign.noteCount,
      campaign.status,
      campaign.summary,
      campaign.collectSummary,
      campaign.analyzeSummary,
      campaign.draftSummary,
      campaign.packageSummary,
      campaign.createdAt,
      campaign.updatedAt,
    );

    for (const run of runs) {
      insertRun.run(run.id, run.campaignId, run.stage, run.status, run.title, run.detail, run.createdAt);
    }

    for (const topic of topics) {
      insertTopic.run(
        topic.id,
        topic.campaignId,
        topic.title,
        topic.angle,
        topic.reason,
        topic.sourceType,
        topic.score,
        topic.picked ? 1 : 0,
      );
    }

    for (const note of notes) {
      insertNote.run(
        note.id,
        note.campaignId,
        note.topicId,
        note.title,
        note.hook,
        note.body,
        note.coverText,
        JSON.stringify(note.hashtags),
        JSON.stringify(note.cards),
        note.status,
        note.createdAt,
      );
    }

    for (const item of packages) {
      insertPackage.run(
        item.id,
        item.campaignId,
        item.topicId,
        item.name,
        item.outputDir,
        item.summary,
        JSON.stringify(item.files),
        item.createdAt,
      );
    }
  });

  tx();

  return { campaign, runs, topics, notes, packages };
}

export function listCampaigns(): Campaign[] {
  return db
    .prepare(
      `SELECT id, keyword, mode, note_count as noteCount, status, summary,
              collect_summary as collectSummary, analyze_summary as analyzeSummary,
              draft_summary as draftSummary, package_summary as packageSummary,
              created_at as createdAt, updated_at as updatedAt
       FROM xhs_campaigns
       ORDER BY created_at DESC`,
    )
    .all() as Campaign[];
}

export function listCampaignRuns(campaignId?: string): CampaignRun[] {
  const sql = campaignId
    ? `SELECT id, campaign_id as campaignId, stage, status, title, detail, created_at as createdAt FROM xhs_campaign_runs WHERE campaign_id = ? ORDER BY created_at DESC`
    : `SELECT id, campaign_id as campaignId, stage, status, title, detail, created_at as createdAt FROM xhs_campaign_runs ORDER BY created_at DESC`;
  return (campaignId ? db.prepare(sql).all(campaignId) : db.prepare(sql).all()) as CampaignRun[];
}

export function listCampaignTopics(campaignId?: string): CampaignTopic[] {
  const sql = campaignId
    ? `SELECT id, campaign_id as campaignId, title, angle, reason, source_type as sourceType, score, picked FROM xhs_campaign_topics WHERE campaign_id = ? ORDER BY score DESC, title ASC`
    : `SELECT id, campaign_id as campaignId, title, angle, reason, source_type as sourceType, score, picked FROM xhs_campaign_topics ORDER BY rowid DESC`;
  const rows = (campaignId ? db.prepare(sql).all(campaignId) : db.prepare(sql).all()) as Array<CampaignTopic & { picked: number | boolean }>;
  return rows.map((row) => ({ ...row, picked: Boolean(row.picked) }));
}

export function listGeneratedNotes(campaignId?: string): GeneratedNote[] {
  const sql = campaignId
    ? `SELECT id, campaign_id as campaignId, topic_id as topicId, title, hook, body, cover_text as coverText, hashtags_json as hashtagsJson, cards_json as cardsJson, status, created_at as createdAt FROM xhs_generated_notes WHERE campaign_id = ? ORDER BY created_at DESC`
    : `SELECT id, campaign_id as campaignId, topic_id as topicId, title, hook, body, cover_text as coverText, hashtags_json as hashtagsJson, cards_json as cardsJson, status, created_at as createdAt FROM xhs_generated_notes ORDER BY created_at DESC`;
  const rows = (campaignId ? db.prepare(sql).all(campaignId) : db.prepare(sql).all()) as Array<{
    id: string;
    campaignId: string;
    topicId: string;
    title: string;
    hook: string;
    body: string;
    coverText: string;
    hashtagsJson: string;
    cardsJson: string;
    status: "generated";
    createdAt: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    campaignId: row.campaignId,
    topicId: row.topicId,
    title: row.title,
    hook: row.hook,
    body: row.body,
    coverText: row.coverText,
    hashtags: JSON.parse(row.hashtagsJson),
    cards: JSON.parse(row.cardsJson),
    status: row.status,
    createdAt: row.createdAt,
  }));
}

export function listMaterialPackages(campaignId?: string): MaterialPackage[] {
  const sql = campaignId
    ? `SELECT id, campaign_id as campaignId, topic_id as topicId, name, output_dir as outputDir, summary, files_json as filesJson, created_at as createdAt FROM xhs_material_packages WHERE campaign_id = ? ORDER BY created_at DESC`
    : `SELECT id, campaign_id as campaignId, topic_id as topicId, name, output_dir as outputDir, summary, files_json as filesJson, created_at as createdAt FROM xhs_material_packages ORDER BY created_at DESC`;
  const rows = (campaignId ? db.prepare(sql).all(campaignId) : db.prepare(sql).all()) as Array<{
    id: string;
    campaignId: string;
    topicId: string;
    name: string;
    outputDir: string;
    summary: string;
    filesJson: string;
    createdAt: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    campaignId: row.campaignId,
    topicId: row.topicId,
    name: row.name,
    outputDir: row.outputDir,
    summary: row.summary,
    files: JSON.parse(row.filesJson),
    createdAt: row.createdAt,
  }));
}

export function getSingleAgentOverview() {
  const campaigns = listCampaigns();
  const topics = listCampaignTopics();
  const notes = listGeneratedNotes();
  const packages = listMaterialPackages();

  return {
    campaigns: campaigns.length,
    generatedTopics: topics.length,
    generatedNotes: notes.length,
    materialPackages: packages.length,
    latestCampaign: campaigns[0],
  };
}
