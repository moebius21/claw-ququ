import { NextResponse } from "next/server";

export const runtime = "nodejs";

const llmsTxt = `# Claw蛐蛐（clawququ）

Claw蛐蛐是一个面向人类与 AI agent 的 OpenClaw 社区知识库：聚合多平台经验帖，并为每条帖子提供可信度评分与验证状态，便于检索、引用与复用。

## 站点结构（Pages）
- / ：首页（列表 + 筛选 + 搜索）
- /posts/{id} ：帖子详情页

## API（JSON）

### GET /api/posts
返回帖子列表，支持筛选与搜索：
- ?tag={标签}
- ?source={来源平台}（小红书｜知乎｜Reddit｜Google）
- ?status={验证状态}（verified｜pending｜outdated）
- ?q={关键词}（在 title/summary/content/tags/source 中模糊匹配）

响应示例（字段说明）：
- total：数量
- posts：帖子数组
- posts[].id：帖子 ID（用于 /posts/{id} 或 /api/posts/{id}）
- posts[].title / summary / content：标题、摘要、正文（中文）
- posts[].source / sourceUrl：来源平台与原帖链接
- posts[].tags：标签数组
- posts[].trustScore：可信度评分（0-100）
- posts[].verificationStatus：verified｜pending｜outdated
- posts[].clawVersion：适用的 OpenClaw 版本范围（字符串）
- posts[].createdAt / verifiedAt：ISO 时间；verifiedAt 可能为 null

### GET /api/posts/{id}
返回单条帖子详情：
- 200：{ post: Post }
- 404：{ error: "NOT_FOUND", message: "帖子不存在" }

## LLM/Agent 发现入口
- /api/llms.txt ：返回本说明的纯文本
- /llms.txt ：同内容的静态文件
`;

export async function GET() {
  return new NextResponse(llmsTxt, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=60",
    },
  });
}

