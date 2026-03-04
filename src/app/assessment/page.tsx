import Link from "next/link";

import { DIMENSION_LABELS } from "@/data/relationship-assessment";

const dimensions = Object.values(DIMENSION_LABELS);

export default function AssessmentPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(900px_circle_at_20%_0%,rgba(56,189,248,0.14),transparent_60%),radial-gradient(700px_circle_at_80%_10%,rgba(167,139,250,0.12),transparent_55%)]" />
      <main className="mx-auto max-w-5xl px-6 py-14">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-7">
          <p className="text-xs tracking-wide text-sky-200">Relationship Role Assessment</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">关系角色 × 依恋模式测评</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
            这是一套 36 题的关系心理测评，用于帮助你识别在亲密关系中“自动化扮演的角色”。
            测评基于依恋相关维度（焦虑、回避）并加入照料、控制、防御与修复能力指标，生成单主型或双主型结果。
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/assessment/quiz"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
            >
              开始测评（约 6-10 分钟）
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm text-zinc-100 hover:bg-white/15"
            >
              返回首页
            </Link>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white">测评包含的六个维度</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              {dimensions.map((item) => (
                <li key={item} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white">结果会给你什么</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
              <li>主类型 / 双主类型（如：追爱确认者 + 情绪照料者）</li>
              <li>该类型常见痛点与关系触发点</li>
              <li>高共鸣描述，帮你快速理解“为什么会这样”</li>
              <li>可执行建议（沟通、边界、冲突修复）</li>
              <li>六维分数可视化，看到自身结构而非单一标签</li>
            </ul>
            <p className="mt-4 text-xs leading-5 text-zinc-400">
              提醒：测评用于自我觉察与关系成长，不替代心理咨询或医学诊断。
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
