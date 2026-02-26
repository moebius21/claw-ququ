# Claw蛐蛐 V1 架构（编排层 + 执行层）

## 目标
- 聚合 OpenClaw 经验帖（小红书/知乎/Reddit/Google）
- 对每条帖子进行结构化验证（可信度 + 证据 + 风险）

## 分层

### 1) 编排层（Orchestrator）
- 入库原始内容
- 创建验证任务（jobs）
- 调度执行层
- 汇总验证报告

对应代码：
- `src/data/orchestrator.ts`
- `POST /api/orchestrator/ingest`
- `POST /api/jobs`
- `POST /api/jobs/[id]/run`

### 2) 执行层（Workers，当前为模拟执行）
- 对帖子进行规则校验与复核
- 生成结构化验证报告：
  - status
  - trustScore
  - risks
  - claims
  - evidence

当前实现：
- `runVerifyJob()`（内存版）

## 数据模型（V1 内存版）
- `RawPost`：原始抓取内容
- `VerifyJob`：验证任务状态
- `VerificationReport`：验证报告
- `Claim`：可验证断言
- `Evidence`：证据链接

> 当前为内存存储，后续可替换为 SQLite/Postgres。

## API
- `GET /api/posts`：帖子列表
- `GET /api/posts/[id]`：帖子详情
- `GET /api/verifications/[postId]`：最新验证报告
- `GET /api/jobs`：任务列表
- `POST /api/jobs`：创建验证任务
- `POST /api/jobs/[id]/run`：执行任务
- `POST /api/orchestrator/ingest`：接收原始帖子

## 下一步
1. 把内存存储替换成 SQLite
2. 加定时任务自动 enqueue + run
3. 接入真实抓取器（先 Reddit / Google）
4. 执行层改为真实 agent 调用
