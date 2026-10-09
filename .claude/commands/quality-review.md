---
name: quality-review
description: 大量代码合并主干分支前质量自查——内聚/分层/可维护三问走查整个待合并批次
argument-hint: [可选：限定走查的文件/模块]
---

对本次待合并批次执行「合并主干前质量自查」。$ARGUMENTS 有值时只走查指定范围，否则走查整个待合并批次：`git diff <主干分支>...HEAD` 加工作区未提交改动。

本流程承接「先功能后重构」节奏：功能跑通 → 重构收敛（内聚/分层/可维护）→ 三问验收；改动仍处「先跑通」阶段时，先完成重构再走本流程。

流程照 skills `pre-commit-quality-review` 执行（正文见 `.agents/skills/pre-commit-quality-review/SKILL.md` 或 `.claude/skills/` 副本）：

1. 圈定待合并改动面（新增文件读全文），不逐行复读未改代码。
2. 三问各给带证据（文件:行号）的结论：**功能逻辑内聚 / 代码分层 / 便于维护**——细项按 SKILL.md 清单逐条过。
3. 按改动域跑质量门：有分域快速门先跑分域，再按需跑全量（`pnpm exec vitest run`），贴结论数字。
4. 回报结论：**可合并 / 需修改**（Important 必须先修再合并；Nit ≤5 条记录不阻塞）。日常小 commit（样式/文案/单点修复）不在本流程范围。

边界：不自动 commit/合并；不替代 PR 评审（`REVIEW.md` 五遍清单，writer 不自批）。
