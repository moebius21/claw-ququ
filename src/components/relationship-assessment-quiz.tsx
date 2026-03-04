"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  DIMENSION_LABELS,
  QUESTIONS,
  ROLE_PROFILES,
  scoreAssessment,
  type DimensionKey,
} from "@/data/relationship-assessment";

const options = [1, 2, 3, 4, 5];

const optionText: Record<number, string> = {
  1: "非常不同意",
  2: "比较不同意",
  3: "一般/不确定",
  4: "比较同意",
  5: "非常同意",
};

const getLevel = (score: number) => {
  if (score >= 24) return "高";
  if (score >= 18) return "中";
  return "低";
};

export function RelationshipAssessmentQuiz() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const totalAnswered = Object.keys(answers).length;
  const complete = totalAnswered === QUESTIONS.length;

  const result = useMemo(() => (submitted && complete ? scoreAssessment(answers) : null), [answers, complete, submitted]);

  const handleSelect = (id: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (!complete) {
      const firstMissing = QUESTIONS.find((q) => !answers[q.id]);
      if (firstMissing) {
        document.getElementById(`q-${firstMissing.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const primaryRole = result ? ROLE_PROFILES[result.primary] : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(900px_circle_at_20%_0%,rgba(56,189,248,0.14),transparent_60%),radial-gradient(700px_circle_at_80%_10%,rgba(167,139,250,0.12),transparent_55%)]" />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs tracking-wide text-sky-200">关系角色测评（36题）</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">你在亲密关系里会不自觉扮演什么角色？</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">
            参考近 12 个月最重要的一段关系作答。1 = 非常不同意，5 = 非常同意。该测评用于自我觉察，不作为临床诊断。
          </p>
          <div className="mt-4 flex items-center justify-between text-sm text-zinc-300">
            <span>已完成：{totalAnswered} / {QUESTIONS.length}</span>
            <Link href="/assessment" className="text-sky-200 hover:underline">返回测评介绍</Link>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-sky-400 transition-all" style={{ width: `${(totalAnswered / QUESTIONS.length) * 100}%` }} />
          </div>
        </header>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {QUESTIONS.map((q) => {
            const picked = answers[q.id];
            const missing = submitted && !picked;
            return (
              <section
                id={`q-${q.id}`}
                key={q.id}
                className={`rounded-2xl border p-5 ${missing ? "border-rose-300/40 bg-rose-500/10" : "border-white/10 bg-white/5"}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-base leading-7 text-zinc-100">{q.id}. {q.text}</p>
                  <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-zinc-300">
                    {DIMENSION_LABELS[q.dimension]}{q.reverse ? "（反向）" : ""}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-5">
                  {options.map((n) => (
                    <label
                      key={n}
                      className={`cursor-pointer rounded-xl border px-3 py-2 text-center text-xs transition ${picked === n ? "border-sky-300/60 bg-sky-500/20 text-sky-100" : "border-white/10 bg-black/20 text-zinc-300 hover:border-white/20"}`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name={`q-${q.id}`}
                        value={n}
                        checked={picked === n}
                        onChange={() => handleSelect(q.id, n)}
                      />
                      <div>{n}</div>
                      <div className="mt-1 text-[11px] opacity-80">{optionText[n]}</div>
                    </label>
                  ))}
                </div>
              </section>
            );
          })}

          <div className="sticky bottom-4 z-10 rounded-2xl border border-white/15 bg-zinc-900/90 p-4 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-zinc-300">完成所有题目后可生成结果（支持双主型）。</p>
              <button
                type="submit"
                className="rounded-xl bg-white px-5 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
              >
                生成我的测评结果
              </button>
            </div>
            {submitted && !complete ? (
              <p className="mt-2 text-xs text-rose-200">还有 {QUESTIONS.length - totalAnswered} 题未作答，请补全后再生成结果。</p>
            ) : null}
          </div>
        </form>

        {result && primaryRole ? (
          <section className="mt-8 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-6">
            <p className="text-xs tracking-wide text-emerald-200">测评结果</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">你的主类型：{primaryRole.name}</h2>
            <p className="mt-1 text-sm text-emerald-100">{primaryRole.subtitle}</p>
            {result.dualType.length === 2 ? (
              <p className="mt-3 text-sm text-zinc-200">
                你呈现“双主型”：{ROLE_PROFILES[result.dualType[0]].name} + {ROLE_PROFILES[result.dualType[1]].name}
              </p>
            ) : null}
            <p className="mt-3 text-sm leading-6 text-zinc-100">{primaryRole.summary}</p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-sm font-medium text-white">痛点</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-300">
                  {primaryRole.painPoints.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-sm font-medium text-white">共鸣句</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-300">
                  {primaryRole.resonance.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-sm font-medium text-white">建议</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-300">
                  {primaryRole.advice.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-zinc-950/50 p-4">
              <h3 className="text-sm font-medium text-white">六维得分（6-30）</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {result.sorted.map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-zinc-200">
                    <div className="flex items-center justify-between">
                      <span>{DIMENSION_LABELS[key as DimensionKey]}</span>
                      <span>{value} · {getLevel(value)}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-violet-400" style={{ width: `${(value / 30) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-zinc-400">说明：该工具用于自我理解与沟通练习，不替代心理咨询或医疗诊断。</p>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
