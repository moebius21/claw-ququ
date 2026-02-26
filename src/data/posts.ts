export type PostSource = "小红书" | "知乎" | "Reddit" | "Google";

export type VerificationStatus = "verified" | "pending" | "outdated";

export type Post = {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: PostSource;
  sourceUrl: string;
  tags: string[];
  trustScore: number; // 0-100
  verificationStatus: VerificationStatus;
  clawVersion: string;
  createdAt: string; // ISO
  verifiedAt: string | null; // ISO | null
};

const normalize = (value: string) => value.trim().toLowerCase();

export const queryPosts = (input?: {
  tag?: string | null;
  source?: string | null;
  status?: string | null;
  q?: string | null;
}): Post[] => {
  const tag = input?.tag ? normalize(input.tag) : null;
  const source = input?.source ? normalize(input.source) : null;
  const status = input?.status ? normalize(input.status) : null;
  const q = input?.q ? normalize(input.q) : null;

  return posts
    .filter((post) => {
      if (tag && !post.tags.some((t) => normalize(t) === tag)) return false;
      if (source && normalize(post.source) !== source) return false;
      if (status && normalize(post.verificationStatus) !== status) return false;
      return true;
    })
    .filter((post) => {
      if (!q) return true;
      const haystack = normalize(
        [post.title, post.summary, post.content, post.source, ...post.tags].join(
          "\n",
        ),
      );
      return haystack.includes(q);
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
};

export const getPostById = (id: string): Post | undefined =>
  posts.find((p) => p.id === id);

export const posts: Post[] = [
  {
    id: "claw-001",
    title: "Windows 下 OpenClaw 首次启动卡在权限：一招解决（避免全局管理员）",
    summary:
      "首次启动时日志提示无法写入缓存/配置目录，实际是工作目录与 UAC 权限冲突。用用户目录 + 环境变量重定向即可。",
    content:
      "背景：Win11 + PowerShell，跟着文档装完 OpenClaw，第一次运行看似启动了，但 UI 一直转圈。\n\n现象：日志里出现类似“无法写入 cache / config”“permission denied”，重试会把同一个任务重复创建。\n\n原因：我把项目放在 C:\\Program Files\\...（习惯手欠），OpenClaw 默认会在工作目录附近创建缓存与临时文件，UAC 直接拦了。\n\n解决：\n1) 把 workspace 移到用户目录（例如 C:\\Users\\<you>\\Documents\\openclaw-workspace）。\n2) 明确设置缓存/配置目录到用户路径（我用环境变量指向 %LOCALAPPDATA%）。\n3) 重新启动后立刻正常；并且不需要以管理员身份运行。\n\n补充：如果你在公司设备上，组策略可能会限制写入某些盘符；优先用用户目录最省心。",
    source: "知乎",
    sourceUrl: "https://www.zhihu.com/question/00000001",
    tags: ["Windows", "权限", "缓存", "启动排障"],
    trustScore: 86,
    verificationStatus: "verified",
    clawVersion: ">=0.9.0",
    createdAt: "2025-11-02T09:12:00.000Z",
    verifiedAt: "2025-11-05T03:20:00.000Z",
  },
  {
    id: "claw-002",
    title: "Agent 一直重复调用同一个工具？检查 tool 结果的 schema（踩坑记录）",
    summary:
      "看起来像模型“抽风”，其实是工具返回字段名和文档不一致，导致 agent 判断失败反复重试。",
    content:
      "我遇到的坑：一个“搜索-总结”的 agent 流程，总是重复调用 search 工具，像进入死循环。\n\n排查步骤：\n- 打开 trace 看每一步的 tool output。\n- 发现工具返回的是 { items: [...] }，但我在 prompt/代码里要求 agent 读取 { results: [...] }。\n\n结果：agent 每次拿不到 results，就认为“没搜到”，继续搜。\n\n修复：统一 schema（要么改工具，要么改 agent 的解析逻辑）。我这里选择工具层兼容：同时返回 items 和 results，后续再逐步迁移。\n\n建议：\n1) 工具返回结构要稳定，最好加版本号。\n2) 对关键字段做非空断言并在日志里打出“解析失败原因”，否则非常难查。",
    source: "Reddit",
    sourceUrl: "https://www.reddit.com/r/openclaw/comments/0000002/",
    tags: ["Agent", "工具调用", "Schema", "排障"],
    trustScore: 90,
    verificationStatus: "verified",
    clawVersion: "0.10.x",
    createdAt: "2025-10-10T15:40:00.000Z",
    verifiedAt: "2025-10-12T10:05:00.000Z",
  },
  {
    id: "claw-003",
    title: "OpenClaw + Next.js：在 API Route 里做“轻量代理”别忘了流式转发",
    summary:
      "直接 await 全量响应会导致超时/内存暴涨；用 streaming 把上游逐块转发，前端体验更稳。",
    content:
      "场景：我想把 OpenClaw 作为内部工具，前端是 Next.js，后端用 API Route 代理到 OpenClaw 的本地服务。\n\n一开始写法很朴素：fetch 上游 -> await text() -> return。结果：\n- 大模型输出长一点就容易超时；\n- 服务端内存飙升（一次性读全量）；\n- 前端“等很久才出字”。\n\n改进：用 ReadableStream 把上游 response.body 直接 pipe 到客户端，让前端边收边渲染。\n\n额外注意：\n- 需要把 content-type 保留/透传（尤其是 event-stream）。\n- 代理层不要做 JSON.parse(text) 这种全量读取操作。\n\n适合做 MVP，后续再上更严格的鉴权与限流。",
    source: "Google",
    sourceUrl: "https://developers.google.com/search?q=openclaw+nextjs+streaming",
    tags: ["Next.js", "集成", "Streaming", "API"],
    trustScore: 78,
    verificationStatus: "pending",
    clawVersion: ">=0.10.0",
    createdAt: "2025-12-01T02:10:00.000Z",
    verifiedAt: null,
  },
  {
    id: "claw-004",
    title: "配置技巧：把“长上下文”拆成可复用的知识片段，检索命中率提升明显",
    summary:
      "不要把所有说明塞进一个大 prompt；拆成片段 + 标签，再用检索/路由按需拼装。",
    content:
      "很多人第一次用 OpenClaw 会把“项目背景 + 规范 + 例子”全塞进一个系统提示词，然后抱怨模型忽略规则。\n\n我的做法：\n1) 把规范拆成 10~20 条“知识片段”，每条 3~6 行，附上 tags（例如：命名、测试、接口风格）。\n2) 运行时根据任务类型做路由：写代码就注入“风格/测试”片段；写文案就注入“语气/品牌”片段。\n3) 对每条片段做版本控制（例如 clawVersion 或 internalVersion），变更可追踪。\n\n效果：检索命中率和一致性都更好，尤其是多人协作时不容易把 prompt 写成“垃圾场”。",
    source: "小红书",
    sourceUrl: "https://www.xiaohongshu.com/explore/00000004",
    tags: ["配置", "Prompt", "知识库", "检索"],
    trustScore: 82,
    verificationStatus: "verified",
    clawVersion: "0.10.x",
    createdAt: "2025-09-18T08:00:00.000Z",
    verifiedAt: "2025-09-21T11:30:00.000Z",
  },
  {
    id: "claw-005",
    title: "踩坑：并发开太大反而变慢——从 32 降到 8 任务吞吐更高",
    summary:
      "CPU/网络/工具端限额会成为瓶颈；并发不是越高越好，建议按“工具耗时 + 限额”调参。",
    content:
      "我一开始把并发调到 32，想着“多线程更快”。结果：\n- 工具端（尤其是外部 API）开始 429；\n- 本地 CPU 飙到 100%，上下文切换严重；\n- 失败重试导致整体时间更长。\n\n后来用一个很土的方法：\n1) 先测单任务平均耗时（含工具调用）。\n2) 查清楚每个工具的 QPS/并发限制。\n3) 把并发设成“不会触发限额 + CPU 不打满”的甜点区。\n\n我这里 8 是最稳的（同样的任务集，平均耗时反而更短）。如果你做批处理，建议把失败重试做指数退避，不然会雪崩。",
    source: "知乎",
    sourceUrl: "https://zhuanlan.zhihu.com/p/00000005",
    tags: ["并发", "性能", "限流", "重试"],
    trustScore: 88,
    verificationStatus: "verified",
    clawVersion: ">=0.9.5",
    createdAt: "2025-08-22T06:45:00.000Z",
    verifiedAt: "2025-08-23T04:10:00.000Z",
  },
  {
    id: "claw-006",
    title: "集成方案：用 GitHub Actions 跑 OpenClaw 做 PR 自动审查（最小可用）",
    summary:
      "把 OpenClaw 当成“可配置的审查员”，在 PR 上自动给出风险点、测试建议和变更摘要。",
    content:
      "目标：每次 PR 自动产出：\n- 变更摘要（面向人类）；\n- 潜在风险（破坏性变更、边界条件）；\n- 建议补充的测试用例。\n\n实现要点（MVP）：\n1) Action 里拉取 diff（限制大小，避免超长）。\n2) 把仓库的工程约束（例如 lint/test 命令、目录结构）作为规则片段注入。\n3) 让 agent 输出结构化 JSON（字段固定），再由脚本把评论发到 PR。\n\n注意：\n- 一定要加“最大 token / 最大文件数”限制，否则容易爆成本。\n- 失败时降级：只输出摘要，不要直接失败整个 CI。",
    source: "Reddit",
    sourceUrl: "https://www.reddit.com/r/openclaw/comments/0000006/",
    tags: ["CI", "GitHub Actions", "集成", "代码审查"],
    trustScore: 74,
    verificationStatus: "pending",
    clawVersion: ">=0.10.0",
    createdAt: "2025-12-20T19:05:00.000Z",
    verifiedAt: null,
  },
  {
    id: "claw-007",
    title: "Outdated：旧版配置项 migration 后不生效？检查 profile 覆盖优先级",
    summary:
      "文档里的旧字段在新版本里被迁移/弃用；同时 profile 会覆盖全局配置，导致“改了没用”。",
    content:
      "我从 0.8.x 升到 0.10.x 后，发现某个“工具超时”配置怎么改都没用。\n\n最后定位到两个点：\n1) 旧字段已经被迁移，新的字段名不同（旧的仍能解析但被忽略）。\n2) 我项目里有 profile 配置（例如 dev/prod），它会覆盖全局默认值。\n\n做法：\n- 用 OpenClaw 自带的 config dump（或 debug 输出）打印最终生效配置。\n- 把 profile 合并策略写清楚：哪些字段允许覆盖，哪些必须全局统一。\n\n这条经验对团队协作很关键：否则每个人都以为“我改了”，其实没生效。",
    source: "小红书",
    sourceUrl: "https://www.xiaohongshu.com/explore/00000007",
    tags: ["升级", "配置", "Profile", "排障"],
    trustScore: 67,
    verificationStatus: "outdated",
    clawVersion: "0.8.x -> 0.10.x",
    createdAt: "2025-07-14T12:30:00.000Z",
    verifiedAt: "2025-08-01T01:00:00.000Z",
  },
  {
    id: "claw-008",
    title: "检索增强：标签别太泛，给“失败模式”单独建 tag（效果很直接）",
    summary:
      "把常见失败模式（超时/429/schema mismatch/权限）变成一等公民标签，用户和 agent 都更容易定位。",
    content:
      "做知识库时我一开始只用大类标签（配置/集成/性能），结果用户搜索“429”找不到。\n\n后来把失败模式做成细标签：\n- 429\n- 超时\n- schema-mismatch\n- 权限\n\n然后首页支持按 tag 筛选，命中率一下子上来了。对 agent 也友好：它能先按失败模式收敛候选，再读正文。\n\n经验：标签体系宁可小而清晰，也不要堆一堆泛词。",
    source: "知乎",
    sourceUrl: "https://www.zhihu.com/question/00000008",
    tags: ["知识库", "标签", "检索", "信息架构"],
    trustScore: 80,
    verificationStatus: "verified",
    clawVersion: ">=0.9.0",
    createdAt: "2025-11-28T10:22:00.000Z",
    verifiedAt: "2025-11-30T09:10:00.000Z",
  },
  {
    id: "claw-009",
    title: "最小安全实践：本地 OpenClaw 暴露端口前先加一层反向代理和 Basic Auth",
    summary:
      "不要直接把本地服务暴露到公网；用反向代理做鉴权、IP 白名单、请求大小限制。",
    content:
      "很多教程为了省事会把 OpenClaw 监听到 0.0.0.0，然后映射到公网。这样非常危险。\n\n我的最小做法：\n1) OpenClaw 仍然只监听 127.0.0.1。\n2) 用反向代理（Nginx/Caddy 任一）监听公网端口，开启 Basic Auth。\n3) 限制请求体大小、超时、并发，并做简单的访问日志。\n\n如果是团队内网环境，也建议加 IP 白名单。MVP 阶段先守住“别裸奔”这条底线。",
    source: "Google",
    sourceUrl: "https://www.google.com/search?q=openclaw+reverse+proxy+basic+auth",
    tags: ["安全", "反向代理", "鉴权", "部署"],
    trustScore: 76,
    verificationStatus: "pending",
    clawVersion: ">=0.10.0",
    createdAt: "2025-12-24T06:00:00.000Z",
    verifiedAt: null,
  },
  {
    id: "claw-010",
    title: "官方文档实测：Chrome 扩展接管的关键是 Port=18792 + Gateway Token",
    summary:
      "扩展并不是直接接管当前浏览器，会话需要显式附加。常见失败来自 relay 端口或 token 配置错误。",
    content:
      "根据 OpenClaw 官方 Chrome Extension 文档，浏览器接管涉及三层：Gateway 浏览器控制服务、本地 relay（默认 18792）、Chrome 扩展。\n\n高频坑位：\n1) 没有在扩展 Options 填对 Port（默认 18792）\n2) Gateway token 不匹配 gateway.auth.token\n3) 没有在目标 tab 点扩展图标附加（ON）\n\n建议：先用 openclaw browser extension install 安装，确认 Options 状态是 authenticated，再在具体标签页附加。",
    source: "Google",
    sourceUrl: "https://docs.openclaw.ai/tools/chrome-extension",
    tags: ["浏览器", "扩展中继", "调试", "token"],
    trustScore: 92,
    verificationStatus: "verified",
    clawVersion: ">=0.10.0",
    createdAt: "2026-02-26T04:30:00.000Z",
    verifiedAt: "2026-02-26T05:45:00.000Z",
  },
  {
    id: "claw-011",
    title: "生产建议：personal assistant 模型下，一台 Gateway 不要混多个不可信用户",
    summary:
      "官方安全文档明确：OpenClaw 推荐单信任边界。多租户对抗场景应拆分 Gateway/主机。",
    content:
      "OpenClaw 安全文档强调：它是 personal assistant trust model，不是对抗型多租户隔离系统。\n\n可执行建议：\n1) 一人一套 Gateway（至少一人一套凭据/实例）\n2) 不要把多个互不信任用户挂在同一个工具型 agent 上\n3) 对外暴露前先跑 openclaw security audit（含 deep/fix）\n\n这条对团队部署非常关键，能避免权限越界和会话信息误暴露。",
    source: "Google",
    sourceUrl: "https://docs.openclaw.ai/gateway/security",
    tags: ["安全", "部署架构", "多用户", "最佳实践"],
    trustScore: 94,
    verificationStatus: "verified",
    clawVersion: ">=0.10.0",
    createdAt: "2026-02-26T04:40:00.000Z",
    verifiedAt: "2026-02-26T05:45:00.000Z",
  },
  {
    id: "claw-012",
    title: "远程访问实战：Tailscale Serve 比直接公网暴露更稳妥",
    summary:
      "Gateway 保持 loopback，通过 Tailscale Serve/Funnel 暴露，认证和网络边界更清晰。",
    content:
      "官方 Tailscale 文档给了一个非常实用的安全路径：Gateway 仍绑定 127.0.0.1，通过 tailscale serve 做 tailnet 内访问。\n\n落地建议：\n1) 日常远程管理优先 tailscale.mode=serve\n2) 如需公网 funnel，必须配 password auth\n3) 浏览器控制跨机时，用 node host 代理，不要硬开公网端口\n\n这套方案兼顾可用性和安全性，适合个人/小团队。",
    source: "Google",
    sourceUrl: "https://docs.openclaw.ai/gateway/tailscale",
    tags: ["Tailscale", "远程访问", "安全", "Gateway"],
    trustScore: 90,
    verificationStatus: "verified",
    clawVersion: ">=0.10.0",
    createdAt: "2026-02-26T04:50:00.000Z",
    verifiedAt: "2026-02-26T05:45:00.000Z",
  },
  {
    id: "claw-013",
    title: "官方仓库信息整合：onboard 向导是新手最省坑的起点",
    summary:
      "GitHub README 明确推荐 openclaw onboard --install-daemon，先把 daemon 和基础配置跑通。",
    content:
      "从 GitHub README 看，OpenClaw 的推荐起手势不是手搓配置，而是先跑 onboard 向导。\n\n原因：\n1) 一次性配置 gateway/workspace/channels\n2) 安装 daemon 保持常驻\n3) 后续用 doctor/security audit 迭代修正\n\n对内容站来说，这类“官方推荐流程”应当优先置顶，能显著减少新手踩坑。",
    source: "Reddit",
    sourceUrl: "https://github.com/openclaw/openclaw",
    tags: ["入门", "onboard", "daemon", "官方流程"],
    trustScore: 88,
    verificationStatus: "verified",
    clawVersion: ">=0.10.0",
    createdAt: "2026-02-26T05:00:00.000Z",
    verifiedAt: "2026-02-26T05:45:00.000Z",
  },
];

