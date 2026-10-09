<!--
nuwa-sdlc-kit v1.0.0 · content — 播种一次，本地所有（升级不覆盖）
SDLC Stage 3 · Build 工件模板
用法：spec 通过后在 plan mode 访谈产出，存 plans/YYYYMMDD-<slug>-plan.md。
闸门：接受本计划才允许动 src；实现偏离计划时同一 commit 更新本文件（plan-gate 会提醒）。
-->

# 实施计划：{功能 slug}

- 对应 spec：specs/{feature-slug}.md
- 状态：待接受 / 已接受 / 已完成（含偏离记录）

## 改动文件清单

| #   | 文件 | 动作(增/改/删) | 说明 |
| --- | ---- | -------------- | ---- |

## 实施顺序

1. （无依赖的步骤才能并行 worktree；特殊验证步骤注明方式）

## 证明成立的测试

- 新增测试：（失败测试先行的，先提交测试再修码）
- 回归范围：pnpm exec vitest run

## 风险与回退

| 风险 | 缓解 | 回退方式 |
| ---- | ---- | -------- |

## 偏离记录

（实现中偏离原计划的逐条补记：原因 + 同步的 commit）
