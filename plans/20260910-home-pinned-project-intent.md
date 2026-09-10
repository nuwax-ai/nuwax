<!--
nuwa-sdlc-kit v1.0.0 · content — 播种一次，本地所有（升级不覆盖）
SDLC Stage 1 · Plan 工件模板
用法：cp 为 plans/YYYYMMDD-<slug>-intent.md；由 .claude/skills/requirement-analysis 驱动生成。
闸门：负责人确认接受后才进 Design（grill-with-docs → specs/<slug>.md）。
-->

# 意图：项目列表「+」一键新建会话——首页项目上框（常规/全栈区分）

- 日期：2026-09-10 　发起人：用户（feat-dong.0930 会话）
- 状态：已接受（用户 2026-09-10 会话内确认四个交互决策；决定人：用户）

## 问题

首页侧栏「项目」分组（ProjectPanel）项目行 hover 的「+（添加对话）」按钮当前只弹 toast「项目添加对话暂未接入」，无法从项目直接发起新会话；用户只能先打开项目再进 IDE 内新建，链路割裂。

同时，首页输入框的发送链路（建项目/建会话双分支、workspaceDir 条件、推荐位功能类型映射）经多个需求累积后内联在 `src/pages/Home/index.tsx`，后续「弹窗选择（专家）/弹窗选择（专家+智能体）」等场景需要复用同一套「智能体可选范围」判断，缺少单源。

## 预期结果

1. 项目行/子会话行 hover「+」→ 跳 `/home`，输入卡底部 env-bar 槽位（复用「选择工作目录」灰底栏样式）展示**项目上框**（项目名+类型徽标+✕ 可删除）。
2. 按 `projectType` 区分：
   - **全栈（UserApp）**：上框携带 `devAgentId`（契约先行）/`sandboxId`/`projectId`；默认命中推荐位 `targetId === devAgentId` 的智能体；列表只保留 `UserAppDev` 类（只能同类切换）；命中失败（接口暂无 devAgentId）→ 首页先跳转、上框照常展示、toast 提示手动选择；发送不走 `/api/project/create`，直接会话创建带三参，成功后跳全栈 IDE `/space/{spaceId}/app-pro?appId={projectId}&conversationId={id}`。
   - **常规（NormalProject）**：不默认命中；列表只保留 `NormalProjectDev` 类；未选就发送不拦截（后端自行兜默认）；会话创建带 `projectId`（+项目 `sandboxId` 如有），成功后维持 `/home/chat/{id}/{agentId}`。
3. 上框存在期间隐藏工作目录栏/电脑选择器/空间选择器/任务智能体开关；删除上框恢复首页默认形态。
4. 可复用抽取（含历史流程逻辑收编）：推荐位策略单源 + 首页发送计划纯函数，供后续弹窗与维护复用。

## 受影响的能力面

- `src/layouts/DynamicMenusLayout/NewHomeSection/components/ProjectPanel`（入口按钮 + 项目字段映射）
- `src/pages/Home`（上框消费、智能体过滤/命中、发送分支瘦身）
- `src/components/ChatInputHome`（env-bar 上框栏、门控）
- `src/hooks/useConversation.ts`、`src/types/interfaces/conversationInfo.ts`（会话创建契约：+`projectId`/`devAgentId`）
- `src/types/interfaces/userProject.ts`（tab 条目 +`devAgentId` 契约、`PinnedProjectInfo`）
- 后端依赖（未 ready，契约先行）：`/api/agent/conversation/create` 接收 `projectId`/`devAgentId` 并绑定会话与项目；`/api/user-project/tab/page-query` 返回 `devAgentId`。

## 约束

- 后端两接口未 ready：前端契约先行照发，字段缺失走降级路径（全栈命中失败提示手选）。
- 会话路径质量门：`npm run test:conversation` 必须全绿；tsc 触达文件零新增（全库 515 预存不作门）。
- 分层红线：策略/纯函数落 `src/constants`、`src/utils`、`src/types`、`src/hooks`（非页面层），供 layouts/pages/components/hooks 共用，禁止反向依赖 pages。
- i18n 五语言；并行会话共用语言文件，Edit 前重读锚点。

## 开放问题

1. `UserProjectTabItem.devAgentId` 与 `conversation/create` 的 `projectId/devAgentId` 契约何时 ready —— 待后端确认（缺失期间走降级路径，不阻塞前端）。
2. 专家/专家+智能体选择弹窗接入策略单源的时间点 —— 另行立项（本次只抽单源不接弹窗）。
3. PageApp（存量网页应用）「+」按钮维持「暂未接入」toast，后续是否放开 —— 待产品定调。
