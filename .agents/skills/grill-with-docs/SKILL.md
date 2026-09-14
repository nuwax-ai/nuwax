---
name: grill-with-docs
description: 拷问需求、方案和文档，逐步确认术语、边界、异常、风险和待确认问题；当用户要求拷问需求、挑战方案、检查边界、基于文档追问细节，或要把 intent 细化成规格时使用。
---

# Grill With Docs（Design 阶段）

## 目标

不要急着接受现有需求或方案。逐个问题追问，直到边界、术语、风险和不做项足够清楚。产出收敛为 `specs/<feature-slug>.md`（模板见 `templates/spec.md`）。

## 工作方式

1. 先阅读用户提供的需求、技术说明或相关文档。
2. 每次只问一个关键问题，避免一次抛出太多问题。
3. 每个问题都给出推荐答案，方便用户确认或纠正。
4. 问题能通过现有文档或代码确认的，先自行查证，不要直接问用户。
5. 已确认的术语、规则和边界，建议同步回需求或文档。

## 拷问方向（通用）

- 这个需求解决的核心问题是什么？哪些场景本期不做？
- 异常、空数据、依赖失败如何处理？
- 是否和现有业务模型或页面习惯冲突？
- 哪些问题必须找产品、测试或负责人确认？

## 本仓特有拷问项

- 改路由/菜单先看 config/config.ts 与 config/routes 约定，UMI_ENV 区分 dev/prod 构建
- mock/ 与真实接口切换的影响面要在规格里写明
- tests/ 目录按域分子目录（conversation/ snapshot/ messageQueue...），新测试跟域走
- types 补字段要跟后端契约（参考 2b18d6dc6：Page.docname 教训）
- 移动端构建走 build:m 下载产物流程，别绕过 scripts/download-mobile-build.js

## 参考

- 术语沉淀格式：`references/context-format.md`
- 架构决策格式：`references/adr-format.md`
