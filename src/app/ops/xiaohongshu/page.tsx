import Link from "next/link";

import { XiaohongshuCampaignRunner } from "@/components/xiaohongshu-campaign-runner";
import {
  getSingleAgentOverview,
  listCampaignRuns,
  listCampaignTopics,
  listCampaigns,
  listGeneratedNotes,
  listMaterialPackages,
} from "@/data/xiaohongshu";

const modeLabel = {
  hotspot: "热点追踪",
  competitor: "竞品分析",
} as const;

export default function XiaohongshuOpsPage() {
  const overview = getSingleAgentOverview();
  const campaigns = listCampaigns();
  const latestCampaign = campaigns[0];
  const runs = listCampaignRuns(latestCampaign?.id);
  const topics = listCampaignTopics(latestCampaign?.id);
  const notes = listGeneratedNotes(latestCampaign?.id);
  const packages = listMaterialPackages(latestCampaign?.id);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">OpenClaw Demo</div>
            <h1 className="mt-2 text-3xl font-semibold">小红书单 Agent 内容流水线</h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-400">
              参考文章里的业务链路，但这里刻意收敛成一个 agent 串行执行，方便分享时稳定演示：
              collect → analyze → draft → package。
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <Link href="/ops" className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-zinc-200">
              返回控制台
            </Link>
            <Link href="/" className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-zinc-200">
              返回首页
            </Link>
          </div>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-zinc-400">Campaigns</div>
            <div className="mt-2 text-3xl font-semibold">{overview.campaigns}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-zinc-400">Generated Topics</div>
            <div className="mt-2 text-3xl font-semibold">{overview.generatedTopics}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-zinc-400">Generated Notes</div>
            <div className="mt-2 text-3xl font-semibold">{overview.generatedNotes}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-zinc-400">Material Packages</div>
            <div className="mt-2 text-3xl font-semibold">{overview.materialPackages}</div>
          </div>
        </section>

        <section className="mt-6">
          <XiaohongshuCampaignRunner />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white">最近 Campaign</h2>
                <p className="mt-1 text-xs text-zinc-400">每次运行都代表一次单 Agent 串行内容生产。</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {campaigns.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                  还没有运行记录。你可以先用关键词 openclaw 跑一轮 demo。
                </div>
              ) : (
                campaigns.slice(0, 6).map((campaign) => (
                  <div key={campaign.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium text-zinc-100">
                          {campaign.keyword} · {modeLabel[campaign.mode]}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {new Date(campaign.createdAt).toLocaleString("zh-CN")} · 输出 {campaign.noteCount} 篇
                        </div>
                      </div>
                      <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-200">
                        {campaign.status}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-zinc-300">{campaign.summary}</p>
                    <div className="mt-3 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
                      <div className="rounded-lg border border-white/10 bg-zinc-950/40 p-3">{campaign.collectSummary}</div>
                      <div className="rounded-lg border border-white/10 bg-zinc-950/40 p-3">{campaign.analyzeSummary}</div>
                      <div className="rounded-lg border border-white/10 bg-zinc-950/40 p-3">{campaign.draftSummary}</div>
                      <div className="rounded-lg border border-white/10 bg-zinc-950/40 p-3">{campaign.packageSummary}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-base font-semibold text-white">当前演示架构</h2>
            <div className="mt-4 space-y-3 text-sm text-zinc-300">
              <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-4">
                <div className="text-xs uppercase tracking-wide text-sky-200">单 Agent</div>
                <div className="mt-2 text-zinc-100">一个 agent 顺序串行执行 4 个阶段，不做角色拆分。</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="font-medium text-zinc-100">为什么这样做</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-400">
                  <li>今晚分享更需要稳定、可复现，而不是架构炫技。</li>
                  <li>单条流水线更容易讲清楚输入、过程和输出。</li>
                  <li>后续仍然可以把阶段替换成真实 skill 或外部 API。</li>
                </ul>
              </div>
              <Link href="https://github.com/comeonzhj/Auto-Redbook-Skills" className="text-xs text-sky-200 hover:underline">
                真实渲染技能可后续接入 Auto-Redbook-Skills →
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-base font-semibold text-white">阶段运行记录</h2>
            <div className="mt-4 space-y-3">
              {runs.length === 0 ? (
                <div className="text-sm text-zinc-400">运行后这里会展示 collect / analyze / draft / package 的结果。</div>
              ) : (
                runs.map((run) => (
                  <div key={run.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-zinc-100">{run.title}</div>
                      <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200">
                        {run.status}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-zinc-400">{run.detail}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-base font-semibold text-white">选题池 / Topics</h2>
            <div className="mt-4 space-y-3">
              {topics.length === 0 ? (
                <div className="text-sm text-zinc-400">暂无选题。</div>
              ) : (
                topics.map((topic) => (
                  <div key={topic.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-zinc-100">{topic.title}</div>
                      <div className={`rounded-full px-2 py-1 text-[11px] ${topic.picked ? "border border-violet-400/30 bg-violet-500/10 text-violet-200" : "border border-white/10 bg-white/5 text-zinc-400"}`}>
                        {topic.picked ? "已入选" : "候选"}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">{topic.sourceType} · score {topic.score}</div>
                    <p className="mt-2 text-sm text-zinc-300">{topic.angle}</p>
                    <p className="mt-2 text-xs text-zinc-400">{topic.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-base font-semibold text-white">生成的笔记 / Notes</h2>
            <div className="mt-4 space-y-3">
              {notes.length === 0 ? (
                <div className="text-sm text-zinc-400">暂无笔记草稿。</div>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-medium text-zinc-100">{note.title}</div>
                    <div className="mt-2 text-xs text-zinc-500">{note.coverText}</div>
                    <p className="mt-2 text-sm text-zinc-300">{note.hook}</p>
                    <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-white/10 bg-zinc-950/40 p-3 text-xs text-zinc-400">
                      {note.body}
                    </pre>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {note.hashtags.map((tag) => (
                        <span key={tag} className="rounded-full border border-sky-400/20 bg-sky-500/10 px-2 py-1 text-[11px] text-sky-200">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-base font-semibold text-white">物料包 / Package</h2>
            <div className="mt-4 space-y-3">
              {packages.length === 0 ? (
                <div className="text-sm text-zinc-400">暂无物料包。</div>
              ) : (
                packages.map((item) => (
                  <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-medium text-zinc-100">{item.name}</div>
                    <p className="mt-2 text-xs text-zinc-400">{item.summary}</p>
                    <div className="mt-2 rounded-lg border border-white/10 bg-zinc-950/40 p-3 text-xs text-zinc-500">
                      输出目录：{item.outputDir}
                    </div>
                    <ul className="mt-3 space-y-1 text-xs text-zinc-400">
                      {item.files.map((file) => (
                        <li key={file}>• {file}</li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
