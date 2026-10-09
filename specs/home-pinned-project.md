<!--
nuwa-sdlc-kit v1.0.0 · content — 播种一次，本地所有（升级不覆盖）
SDLC Stage 2 · Design 工件模板
用法：intent 接受后经 grill-with-docs 收敛为本规格；存 specs/<feature-slug>.md。
闸门：技术评审通过后才进 Build（plan mode → plans/YYYYMMDD-<slug>-plan.md）。
-->

# 规格：home-pinned-project

- 对应 intent：plans/20260910-home-pinned-project-intent.md
- 状态：技术评审通过（2026-09-10 用户会话内四决策确认 + 计划批准）

## 需求基线

继承 intent 全部结论（背景目标 / 本期做 / 本期不做见 intent，无修正）。关键交互决策（用户已确认）：

| # | 决策点 | 结论 |
| --- | --- | --- |
| 1 | 上框位置 | 输入卡底部 env-bar 槽位（复用「选择工作目录」灰底栏样式 + 变体类） |
| 2 | 常规项目未选智能体就发送 | 不拦截，`currentAgentId` 照现状 fallback，后端自行兜默认 |
| 3 | 全栈 devAgentId 缺失（当前必然） | 跳转首页先行，未命中 toast 报错提示，用户在全栈类里手选 |
| 4 | 全栈会话创建成功跳转 | 直接跳全栈 IDE `/space/{spaceId}/app-pro?appId&conversationId`（route state 带消息，AppDevPro 既有自动发链路消费） |

本期不做：PageApp「+」放开、专家/智能体弹窗接线、会话列表路由改动（`devTargetType` 路由由后端绑定产生）。

## 方案设计

### 架构落点

三层抽取 + 薄接入（分层红线：策略/纯函数在非页面层，可被 layouts/pages/components/hooks 共用）：

```
策略层(纯函数)                     流程计划层(纯函数)                接入层(薄)
src/constants/                    src/utils/                       src/pages/Home（build→execute）
recommendAgentPolicy    ──►       homeSendPlan       ◄──           src/layouts/.../ProjectPanel（「+」入口）
  · 收编 Home 三个内联映射            · 双分支决策+参数拼装           src/components/ChatInputHome（上框栏）
  · 可选范围/默认命中策略            · workspaceDir 条件去重        src/hooks/useConversation（attach 扩展）
    (弹窗复用预留)                  · 上框优先级/全栈 redirectUrl    src/hooks/useHomePinnedProjectHandoff
```

1. **`src/constants/recommendAgentPolicy.constants.ts`**（照 `workspaceDirPolicy.constants.ts` 先例）：
   - 收编：`getProjectTypeByFunctionType`（原 Home `PROJECT_FUNCTION_TYPE_MAP`）、`isTaskAgentFunctionType`（原 `TASK_AGENT_FUNCTION_TYPES`）、`showSpaceSelectorForFunctionType`（原 `SPACE_SELECTOR_FUNCTION_TYPES`）——行为不变，Home 改 import。
   - 新增：`AgentSelectableContext { projectType?; devAgentId? }`（undefined=不受限）+ `getAllowedFunctionType` / `isAgentSelectable` / `filterSelectableAgents` / `findDefaultAgent`。映射：UserApp→`UserAppDev`、NormalProject→`NormalProjectDev`；`findDefaultAgent` 仅在 UserApp 且有 `devAgentId` 时按 `targetId===devAgentId` 命中，常规/缺失返回 undefined。
2. **`src/utils/homeSendPlan.ts`**：`buildHomeSendPlan(input) → {kind:'createProject',payload,spaceId} | {kind:'createConversation',agentId,attach}`。优先级：上框（带 `projectId`/`devAgentId(全栈=currentAgentId)`/`sandboxId(项目优先)`/`redirectUrl(全栈 app-pro 前缀)`，不带 workspaceDir）＞ 项目类推荐（原 `createProjectAndNavigate` payload 拼装整体移入）＞ 纯对话。`workspaceDir 仅个人电脑生效` 三处重复口径收敛为内部 helper；space 选择（`fallbackSpaceId`/`selectedSpaceId`）收编。纯函数无 umi 依赖。
3. **类型与 handoff**：`PinnedProjectInfo` 落 `src/types/interfaces/userProject.ts`（types 层供跨层共用）；`useHomePinnedProjectHandoff`（scope `'homePinnedProject'`，`pin()`=setContext+`history.push('/home')`，`consume()` 读取即清）。Home 消费用 `useEffect` 依赖 `pageHandoffContext.contextMap`——覆盖「已在 /home 未重挂载」场景（首页侧栏与 /home 同显）。

### 数据与契约

| 契约点 | 变更 | 同步位置 | 状态 |
| --- | --- | --- | --- |
| `ConversationCreateParams`（/api/agent/conversation/create） | +`projectId?: number`、`devAgentId?: number` | `src/types/interfaces/conversationInfo.ts` + `useConversation` 透传 | 契约先行（后端未 ready，2026-09-10） |
| `UserProjectTabItem`（/api/user-project/tab/page-query） | +`devAgentId?: number` | `src/types/interfaces/userProject.ts` + ProjectPanel 映射补带 | 契约先行（后端未 ready） |
| `PinnedProjectInfo`（前端透传协议） | 新增 | `src/types/interfaces/userProject.ts`，handoff hook 再导出 | 前端自有 |

上框期间发送**不走** `/api/project/create`；`sandboxId` 取项目值优先于个人电脑选择；不携带 `workspaceDir`（项目工作区由 projectId 隐含）。

### 平台/引擎矩阵

| 行为点 | 浏览器 | Electron 壳 | 备注 |
| --- | --- | --- | --- |
| `+` 入口跳 /home | `history.push` | 同左（/home 非 SHELL_NEW_WINDOW_ROUTES，不拆独立窗） | 与 handleNewConversation 同款 |
| 上框 handoff | pageHandoffContext（SPA 内存，刷新失效可接受） | 同左 | 刷新后上框消失=预期降级 |
| 全栈成功跳转 app-pro | query + route state | 同左 | AppDevPro 既有消费链路 |

## 异常与失败场景

- **全栈命中失败**（devAgentId 缺失或推荐位无对应项）：跳转/上框照常，toast 提示手动选择；列表仍过滤为全栈类，手选后可正常发送。
- **常规项目未选智能体就发送**：不拦截，按现状 fallback `defaultAgentId`，后端兜默认（用户定调）。
- **PageApp**：`+` 维持「暂未接入」toast（范围外）。
- **项目无 projectType**：按常规项目兜底处理。
- **上框删除**：清 `pinnedProject`/`selectedRecommend`/`workspaceDir`，电脑复位 `'-1'`，恢复全量推荐与默认门控。
- **会话创建失败**：沿用现有 `useConversation` 错误 toast，不跳转。
- **上框防呆**：UserApp 上框时已选中 pill 再点不取消、切分类不清选中（避免 fallback 出范围）；`showSpaceSelector`/`showTaskAgentToggle` 上框时强制 false。

## 测试计划

- 新增纯函数单测（无 umi 依赖，vitest 可跑）：
  - `src/constants/recommendAgentPolicy.constants.test.ts`：无上下文全量 / 两类过滤 / 六开发类+对话型排除 / 命中矩阵（有 devAgentId 命中、缺失不命中、常规不命中）。
  - `src/utils/homeSendPlan.test.ts`：纯对话分支 / 项目类推荐分支（payload 字段、space 选择）/ 上框优先级（常规、全栈 redirectUrl+devAgentId）/ workspaceDir 仅个人电脑生效。
- 回归：`npm run test:conversation` 全绿（基线对照）；`npx tsc --noEmit` 触达文件零新增；prettier。
- 手动走查（dev server，用户验收）：项目「+」跳首页上框、删除恢复、全栈命中失败提示、发送跳 IDE。

## 已否决的备选方案

- **点击「+」时现查 `/api/userapp/get/{id}` 取 devAgentId**：已实证 `UserAppInfo` 无该字段，查了也拿不到，纯增延迟。
- **全栈 devAgentId 缺失回退命中全栈类第一个智能体**：用户定调改为「提示报错+手选」，避免隐性命中错误智能体。
- **常规项目未选智能体前端拦截发送**：用户定调后端自行兜默认，不加前端拦截。
- **上框数据走 URL query 携带**：项目信息含多字段，URL 冗长且刷新语义不清；选 pageHandoffContext（与专家召唤先例一致，刷新即失效=可接受降级）。
- **发送流程编排抽成 hooks 层 hook**：`createProjectAndNavigate` 在 pages 层（分层红线 hooks 禁止依赖 pages），故编排留在 Home 页、只抽纯函数计划层。
