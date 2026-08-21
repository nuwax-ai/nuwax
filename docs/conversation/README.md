# 会话模块文档入口

> 会话模块相关文档集中在本目录。

```text
docs/conversation/
├── README.md                           ← 本入口
├── dual-track/                         ← 双轨重构相关
│   ├── conversation-dual-track-plan.md         双轨切换方案（R1-R6 实施与 flag）
│   ├── conversation-business-logic-checklist.md 业务逻辑验收清单（105+ 条 ID）
│   ├── conversation-regression-test-plan.md    测试回归方案
│   ├── conversation-maintenance-guide.md       维护指南
│   ├── agent-session-runtime-regression.md     运行加载逻辑回归
│   └── conversation-active-state-machine.md    会话活跃态状态机参考
├── fixes/                              ← 修复留存（按时间倒序）
│   ├── terminal-convergence-fix-summary.md             终态收敛修复总结（2026-08-20）
│   ├── conversation-complete-button-stuck-analysis.md  按钮卡死分析定案（2026-08-19）
│   ├── conversation-terminal-finalizer-fix.md          终态统一收敛修复（2026-08-18）
│   ├── conversation-error-taskstatus-stuck-fix.md      错误终态固化修复（早期）
│   ├── chat-terminal-polling-flash-qa-report.md        收尾闪烁 QA 报告
│   └── poll-send-race-stale-snapshot-fix.md           轮询竞态修复
├── adr/                                ← 架构决策记录
├── archive/                            ← 已过时文档
└── message-queue-design.md             消息队列设计（初版）
```

## 快速导航

### 验收 / 回归

| 要做什么 | 看哪篇 |
| --- | --- |
| 业务逻辑逐条验收 | [dual-track/conversation-business-logic-checklist.md](./dual-track/conversation-business-logic-checklist.md) |
| 测试回归跑什么 | [dual-track/conversation-regression-test-plan.md](./dual-track/conversation-regression-test-plan.md) |
| 日常维护 / 排查 | [dual-track/conversation-maintenance-guide.md](./dual-track/conversation-maintenance-guide.md) |
| Mock 故障注入验收（/mock-chat） | [mock-testing-plan.md](./mock-testing-plan.md)（含实施现状与热重载坑） |
| Mock 体系优化与 E2E 自动化 | [mock-optimization-plan.md](./mock-optimization-plan.md) |

### 排查按钮卡「会话中」

1. 看修复总结：[fixes/terminal-convergence-fix-summary.md](./fixes/terminal-convergence-fix-summary.md)
2. 看排查过程：[fixes/conversation-complete-button-stuck-analysis.md](./fixes/conversation-complete-button-stuck-analysis.md)
3. console 过滤 `[Conv:` 拉日志 → 按 origin/prev/next/isStale 字段定位

### 理解按钮状态架构

```
isSessionActive = isConversationActive（连接生命周期）
               || hasActiveStreamingInMessages（末条 Loading/Incomplete）
               || taskStatus === EXECUTING（后端权威）

工具状态 → 仅 RunOver UI 展示，与按钮无关
```

详见 [dual-track/conversation-active-state-machine.md](./dual-track/conversation-active-state-machine.md)

## 变更记录

- 2026-08-20 终态收敛体系修复合入 + 文档按 dual-track / fixes 分组
- 2026-08-17 基线 `cf5ab966c`（双轨重构初始文档）
