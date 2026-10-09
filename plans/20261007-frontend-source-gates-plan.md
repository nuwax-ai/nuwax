# 2026-10-07 前端 source gate 恢复

## 问题与范围

`dd43c1730` 为解除当天构建阻塞而整包回退 feature-extensibility merge，也撤掉了外层 CI 已消费的 TypeScript 分域门、纯宿主契约和已修复的测试类型债务。候选虽然能构建，CI 的 `test:typecheck`、`typecheck` 入口却不存在。严格恢复原门后，现有节点/会话测试及少量既有 X6 调用暴露真实诊断。

恢复原检查实现、自测、空历史基线、入口和前端自身 workflow。保留全部现有生产目录与 workflow 测试前缀；两个撤销功能的已删除测试路径改为当前存在的 AgentFlow 行为测试、AppDev 生命周期测试。基线继续为空，新诊断在源码或夹具中修复。

生产源码调整限于既有接口兼容：X6 元数据/边的实际类型，枚举默认值，opaque NodeConfig 到 AntD 表单的单次原样透传，`getGraphRef` 正确方法与 X6 实际 keyframes 动画。页面通过会话 React 公共边界消费桌面策略。原 feature-extensibility 的节点扩展运行时与 AppDev workspace 重构保持撤销状态；冻结微应用 pin 和构建修复保留。

## 执行与验收

- [x] 恢复原 `check-types.mjs`、19 条自测、4 域范围及空 baseline；现存 tsconfig 与撤销前一致。
- [x] 恢复 7 个 package 入口和前端 typecheck workflow；node:test 自测由独立入口执行，Vitest 不重复收集该脚本。
- [x] 保留节点、会话、工作台、桥契约实际生产目录和 workflow 前缀，补入当前有效集成测试。
- [x] 完整 typed fixtures 替换残缺 DTO、隐式窄推断、只读 Ref 和未匹配 mock；保留原行为断言与时序。
- [x] 上传失效回归跟随消息固定 pin 的真实 XHR 上传链，旧代/当前代 401 断言保留；portal 矩形断言包括已补齐宽高。
- [x] 终端文件树集成断言跟随 `9f2a2120c` 的现有策略，只按显式写入/编辑/diff 刷新，不从任意 shell 字符串推断变更。
- [x] `pnpm install --frozen-lockfile` 通过。
- [x] 节点/微应用专项 13 文件、179 条；会话/AppDev fixture 专项 9 文件、54 条通过。
- [x] `pnpm lint:arch` 无新增违规，原 97 条历史豁免保持。
- [x] `pnpm test:typecheck` 19/19；`pnpm typecheck` 318 个文件、四域 0 诊断（节点 136、会话 117、工作台 62、契约 3），域外 284 条仍如实报告且不纳入基线。
- [x] 按外层 CI 完整执行 Vitest（仅沿用 paymentSettlement 专项排除和 15000ms 超时）：354 文件通过，3284 条通过、6 条跳过。
- [x] 首次独立静态审查确认：门实现/19 自测/空 baseline 与撤销前逐字相同；原目录/prefix 完整保留；撤销的扩展/workspace 运行时未回流；冻结 pin/adapter/portal 修复保留。源码交付沿用现有分支、非强推。

最终验收日志在 `/private/tmp/nuwax-frontend-ci-*-20261007*.log`。前端源码提交完成后，由客户端交付流程重建 dist、更新双 pin；发布标签和资产由外层流程处理。

## 质量三问

- 内聚：一批恢复现有 CI 门，并修复该门揭示的源码/夹具问题；原构建冻结与微应用版本输入保留。
- 分层：桌面事件策略经过 conversation/react 公共边界；不透明表单配置只在单一窄适配入口透传，X6 调用使用已安装 API。
- 可维护：原检查器、负向门禁测试与空基线完整恢复；现存测试范围与陈旧 fixture 迁移有明确证据，新增 X6/AntD 回归使用真实实现。

## 独立复验发现的回调持久化补修

独立复验确认，正确使用 `getGraphRef` 后，既有自动排列回调可执行 X6 `setPosition`，但该 API 只发位置变化事件，不发原保存链消费的拖拽结束 `node:moved`。单独调用回调会改变图坐标，却没有同步 proxy、标脏或安排保存。当前 `WorkflowLayout` 对 AgentFlow 隐藏 Header，自动排列按钮并不是当前用户可见入口；此处修复潜在回调契约，不恢复被撤销的 Header/工作台运行时。

补修仅在坐标确实变化时同步 proxy 的坐标，保留 proxy 中最新节点配置；整批结束后一次标脏，并使用原 1500ms 防抖保存及离开保护。同坐标重复调用不重新标脏或延后保存。BFS、循环边、断连分量及无 Start 的既有排列规则不变。

`tests/workflowAutoArrange.test.tsx` 通过测试专用按钮调用真实 Workflow 传给 Layout 的 `onAutoArrange`，真实 Layout/ControlPanel、X6 Model/Node/Edge、proxy、保存与离开 hooks 均保留。该测试不声称验收了当前隐藏的用户按钮。10 条覆盖最新坐标、成功清脏、失败保脏、离开保护、SPA 提前离开保存、重复调用及图的边界。

- [x] 契约测试修正入口后，生产修复前实跑 5 失败、5 通过；失败为未标脏、未保存及未触发离开保护。
- [x] 修复后 10/10 通过；既有功能运行时未回流。
- [x] 复跑 `test:typecheck` 19/19、`typecheck` 319 文件四域 0 诊断（节点 137、会话 117、工作台 62、契约 3）、`lint:arch` 0 新违规；空 baseline 未改，域外仍为 284 条。
- [x] 按相同外层 CI 命令复跑完整 Vitest：355 文件通过、3294 条通过、6 条跳过。

补修验收日志在 `/private/tmp/nuwax-auto-arrange-*-20261007.log`；提交后再次独立复验，再由客户端流程重建匹配的前端 dist。
