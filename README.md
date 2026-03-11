# Claw蛐蛐 (clawququ)

![CI](https://github.com/moebius21/claw-ququ/actions/workflows/ci.yml/badge.svg)

一个对 **OpenClaw 用户** 和 **OpenClaw Agent** 都友好的知识站。

## 项目目标

Claw蛐蛐聚合 OpenClaw 相关经验内容（踩坑、配置、集成、安全实践），并通过 Agent 复核形成可追溯的知识条目。

核心链路：

`Raw 导入 -> Draft 草稿 -> Published 发布 -> Review 复核`

## 当前能力

- 首页内容检索、筛选、详情展示
- Ops 编排控制台（导入、草稿编辑、发布、复核任务执行）
- 智能搜索入口：先搜站内，再抓取外部内容并入库复核（V1）
- SQLite 持久化
- 小红书单 Agent 内容流水线案例页（`/ops/xiaohongshu`）

## 本地开发

```bash
npm install
npm run dev
```

打开：<http://localhost:3000>

## 小红书单 Agent 案例

运行项目后，打开：

- `http://localhost:3000/ops/xiaohongshu`

你可以输入关键词、选择“热点追踪/竞品分析”、设置生成篇数，然后触发一次单 Agent pipeline：

- collect
- analyze
- draft
- package

案例说明文档见：`docs/xiaohongshu-single-agent.md`

## 常用命令

```bash
# 开发
npm run dev

# 构建校验
npm run build

# 启动生产模式
npm run start

# 重置本地数据库
npm run db:reset

# 独立抓取脚本（GitHub + Reddit + Docs）
npm run crawl:openclaw -- "openclaw chrome relay"
```

## 目录结构（关键）

- `src/app/`：页面与 API 路由
- `src/components/`：前端组件
- `src/data/`：数据层（orchestrator + posts）
- `scripts/`：脚本工具（重置 DB、抓取器）
- `.data/`：本地运行数据（已 gitignore）

## 开发约定

- 每个功能改动都要有可读 commit message
- 提交前必须 `npm run build` 通过
- 优先小步迭代，避免大爆改

## Roadmap（短期）

- 搜索抓取稳定性和多源策略优化
- 去重策略增强（URL + 标题相似度）
- 复核质量提升（结构化证据与风险等级）
- 发布内容的运营看板增强

## 开源与追溯

建议将仓库托管到 GitHub 并开启 Issues / PR，确保所有变更可追溯。
