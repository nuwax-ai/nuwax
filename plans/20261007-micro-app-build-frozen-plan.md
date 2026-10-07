# 2026-10-07 微应用固定版本构建修复

## 问题与范围

今天的客户端 beta 前端构建被微应用适配阻塞。宿主 prebuild 自动升级远程 main，使已审查候选在构建时再次变化；消息 chat.ts 补丁随后因上游 DEV-347 插入代码而失配。资料库既有重制补丁还暴露浮出编辑器锚点缺少 width/height 的新增类型错误。

改动集中在构建入口、消息 adapter/gitlink、资料库坐标 helper 和相关契约文档；保留业务功能、显式升级入口与既有类型门。按已授权的 beta 交付流程在隔离候选提交并非强推源码分支；源码 SHA 与 dist 必须一致，发布标签和资产由外层流程处理，保留客户端原工作区 WIP。

## 实施与验收

- [x] 冻结资料库 `18ae973c890c699c678b086ad1da3b95275a3c86` 与消息 `f3a568275c0b3ed21537df98a7eedd6bdbf6b070`。
- [x] 重制消息适配，保留续拉和批量删除；新增单飞任务随挂载创建，卸载后停止旧续拉与 tail 补拉。
- [x] dev/prod prebuild 仅构建已记录 gitlink/pin，版本升级通过显式 upgrade 入口执行。
- [x] 资料库矩形转换补齐宽高；坐标按现有 translateZ(0) 包含块平移，尺寸保留 CSS 像素。
- [x] 同步微应用构建与升级文档，并新增内嵌偏移/边框及独立页锚点尺寸回归。
- [x] 构建/升级管线 60 项、宿主微应用 70 项、矩形回归 2 项通过。
- [x] 冻结消息 store 的异步生命周期诊断 3 项通过；消息上游前端 1438 项通过。
- [x] 完整生产构建通过，资料库类型基线 72/72、新增 0，消息类型构建通过，public/dist manifest 字节一致。
- [x] 初版修复提交后通过壳 buildFrontend 入口重建，源码 SHA 与 dist 版本印记一致，并记录产物摘要。
- [x] 外层 CI 复核发现整包 revert 误撤既有 host/type 门，纯契约已恢复；完整 source gate 修复与验收见 [恢复计划](20261007-frontend-source-gates-plan.md)。
- [ ] source gate 最终提交后，由外层交付流程重新构建 dist 并更新最终双 pin。

初次构建失败与最终构建日志保存在 `/private/tmp/nuwax-micro-frozen-build-20261007*.log`；旧消息补丁保存在 `/private/tmp/nuwax-message-adapter-before-20261007.patch`。
