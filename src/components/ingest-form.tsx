"use client";

import { useState, useTransition } from "react";

type Source = "小红书" | "知乎" | "Reddit" | "Google";

export function IngestForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [source, setSource] = useState<Source>("知乎");
  const [sourceUrl, setSourceUrl] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const submit = () => {
    startTransition(async () => {
      setMessage("正在导入...");
      const res = await fetch("/api/orchestrator/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, sourceUrl, title, content }),
      });

      if (!res.ok) {
        setMessage("导入失败，请检查字段");
        return;
      }

      setMessage("导入成功，已进入 Raw Posts");
      setSourceUrl("");
      setTitle("");
      setContent("");
    });
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h2 className="text-sm font-medium text-white">手动导入原帖</h2>
      <p className="mt-1 text-xs text-zinc-400">先导入样本，再手动发起复核，控制资源消耗。</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-zinc-300">
          来源
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as Source)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm"
          >
            <option value="知乎">知乎</option>
            <option value="小红书">小红书</option>
            <option value="Reddit">Reddit</option>
            <option value="Google">Google</option>
          </select>
        </label>
        <label className="text-xs text-zinc-300">
          原文链接
          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm"
            placeholder="https://..."
          />
        </label>
      </div>

      <label className="mt-3 block text-xs text-zinc-300">
        标题
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm"
          placeholder="帖子标题"
        />
      </label>

      <label className="mt-3 block text-xs text-zinc-300">
        内容
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mt-1 min-h-36 w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm"
          placeholder="粘贴原帖正文或摘要"
        />
      </label>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 disabled:opacity-60"
        >
          {isPending ? "提交中..." : "导入到 Raw Posts"}
        </button>
        {message ? <span className="text-xs text-zinc-400">{message}</span> : null}
      </div>
    </div>
  );
}
