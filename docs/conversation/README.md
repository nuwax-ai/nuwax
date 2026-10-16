# 会话模块文档入口

日常维护从下列现行文档进入；已完成修复的过程与验收流水通过 Git 历史查询。

| 任务 | 文档 |
| --- | --- |
| 数据线 / 渲染线与接入 | [renderer-v2.md](renderer-v2.md) |
| 分组、折叠、可见性与最终回答 | [rendering-rules.md](rendering-rules.md) |
| 容器选择与 sandboxId | [agent-sandbox-selection-rules.md](agent-sandbox-selection-rules.md) |
| 架构边界、运行时与终态排障 | [维护指南](dual-track/conversation-maintenance-guide.md) |
| 活跃态状态机 | [conversation-active-state-machine.md](dual-track/conversation-active-state-machine.md) |
| 关键业务验收场景 | [业务清单](dual-track/conversation-business-logic-checklist.md) |
| 回归场景与影响范围 | [回归方案](dual-track/conversation-regression-test-plan.md) |
| Mock 供数与故障注入 | [mock-testing-plan.md](mock-testing-plan.md) |
| Mock E2E 与尚未关闭的问题 | [mock-optimization-plan.md](mock-optimization-plan.md) |
| 移动端待对齐项 | [mobile-parity-checklist.md](mobile-parity-checklist.md) |

按钮卡“会话中”时，分别检查连接生命周期、末条消息流式状态和后端 taskStatus；历史工具的 EXECUTING 仅影响工具展示。先按维护指南核对轮次 / 代际与终态收尾，再过滤 `[Conv:` 日志定位。

`fixes/` 中仍含未完成的移动端对齐或调查事项，不作为当前架构和默认值的事实源。
