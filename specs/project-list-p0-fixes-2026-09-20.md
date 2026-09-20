# 规格：首页项目列表 P0 两卡（列表不刷新 2407/2413 + 泄漏协作者会话 2465）

- 对应 intent：plans/20260920-project-list-p0-fixes-plan.md（无独立 intent 工件，用户口头派单）
- 状态：已实现（2026-09-20；真机 ego 实测待用户在 testagent 验证）
- 分支：`feat-dong.0930`

## 需求基线

来源：zt.nuwax.com 我的（罗东）两张 P0 单。

### 卡 1 —— 2407 / 2413

- 现象：首页输入框建常规项目 → 发送跳 `/home/chat/{cid}/{agentId}` → 会话结束后左侧栏「项目」分组不出现新项目、项目名不更新，只有浏览器手动刷新才出现。
- 验收：创建后左列表**无需手动刷新**即出现新项目；ego 实测。
- 范围：`src/pages/Home`、`projectCreateStrategy`、`ProjectPanel`。
- 用户明示：**名联动部分勿擅修**（= 后端行为 + `nameDefined` 待接入，单独汇报）。

### 卡 2 —— 2465

- 现象：左侧栏展开某个全栈/常规项目后，把协作者（其他参与者）的会话也加载出来。
- 验收：他人会话不再出现在我的项目行下；自己会话不丢。
- 范围：`ProjectPanel` / services 用户项目接口层。用户追加拍板：**三处全修**（含侧栏全局搜索）。

## 方案设计

### 架构落点

两卡都只动既有模块，不新增层、不改依赖方向：

| 层 | 文件 | 动作 |
| --- | --- | --- |
| utils（纯函数） | `src/utils/projectConversationOwnership.ts` | 增 |
| services | `src/services/userProjectApp.ts` | 改（`apiUserProjectConversations` 加归属过滤） |
| layouts | `src/layouts/DynamicMenusLayout/NewHomeSection/components/ProjectPanel/index.tsx` | 改（`fetchPage` 增加 `awaitKey`；新增 `settleCreatedProject`） |

分层校验：utils 模块只依赖 types（不 import services，符合 engineering-conventions §4 规则 5）；services 内 `userProjectApp → userService` 属同层引用，须过 `npm run lint:arch` 的 `no-circular` 校验。

### 数据与契约

**已核实的后端契约（本次沉淀，此前 docs/plans/specs 零记载）**

| 接口 | 方法 | 语义 | 前端落点 |
| --- | --- | --- | --- |
| `/api/user-project/page-query` | POST | 项目列表（`projectId` 主键 + pinned/archived/collected/owner 打标），不附带 conversations | `src/services/userProjectApp.ts:33` |
| `/api/user-project/conversations/{projectId}` | GET | **按项目维度回该项目下所有用户的会话**，行带 `userId` / `userName` | `src/services/userProjectApp.ts:48` |

- 两个项目管理详情页（`SpaceProjectManage/NormalProjectDetail:153`、`AppProjectDetail:204`）走**页面自己的接口副本** `src/pages/SpaceProjectManage/services/index.ts:34`（注释即「返回所有用户在该项目的会话，附带会话所属用户名」），语义上要看全员、靠 `ConversationPanel` 置灰区分。**本次不过滤，明确排除。**
- 需双同步的位置：`src/types/interfaces/userProject.ts` 的 `UserProjectConversationInfo` 注释；`src/pages/SpaceProjectManage/services/index.ts:33` 保持不动（它是「看全员」的凭证）。
- 后端待办：给 `/api/user-project/conversations` 加 `onlyMine`（或 `userId`）查询参数，就绪后删除前端过滤。

**已知后端行为（卡 1 的前提）**

`docs/project-conversation-sync.md:283`：后端列表接口对新会话有秒级可见性延迟。任务列表靠 `RefreshConversationList` 兜底补拉（`useHomeSectionData.ts:508-517`）才最终一致，项目面板此前无对应物。

### 卡 1 设计

`ProjectPanel` 对 `project.created` 只有一次「与创建同 tick 的立即重拉」。若回包尚未包含新项目行，`append:false` 分支（`index.tsx:321-330`）会用旧回包整表替换，而 60s 事件重放走 `applyProjectChangedToList`（`utils/directorySyncEvents.ts:145-148`）——`targetIndex < 0` 直接返回、created 事件又不带 `patch`，**插不进新行**。行从此永久缺失，只能 F5 重挂载恢复。

改为**有界重试**：`fetchPage(1, { append: false, awaitKey })` 返回「回包里有没有这行」，没出现就按 `[300, 700, 1500]ms` 补偿 3 轮（总窗 ≈ 2.5s）。`ProjectChanged` 与 `ConversationChanged` 双事件都会触发，用 in-flight 集合按复合键去重，避免两条并行重试链。

### 卡 2 设计

共享层 `apiUserProjectConversations` 内按 `userId === 当前用户 id` 过滤。三处泄漏点（`ProjectPanel:402`、`HistoryConversationList/ProjectList:309`、`SidebarSearchModal/sources.ts:198`）全部 import 自该共享函数，一处收口即三处全修。当前用户 id 取 `UserService.getUserInfoFromStorage()?.id`（`src/models/menuModel.ts:144` 已有同款用法先例）；取不到时**不过滤**（防御式降级，避免把列表清空，与 `ConversationPanel:60` 的 `currentUser?.id != null` 判据同口径）。

### 平台/引擎矩阵

| 行为点 | 单栏 style3（QA 环境，已锁） | 经典 style1/2 |
| --- | --- | --- |
| `ProjectPanel` 是否常挂 | 常挂（`SidebarNavHomeSection:196`，仅 `hidden`） | **条件渲染**（`ClassicHomeSection:165-172` tab 一切就卸载；`ClassicLayout:272-278` activeTab 门控）→ 事件必丢，本次不修 |
| created 重试是否生效 | 生效 | 面板没挂时不生效 |
| 归属过滤 | 生效 | 生效 |

## 异常与失败场景

| 场景 | 行为 |
| --- | --- |
| 后端列表接口在 2.5s 窗口内始终不回新项目行 | 重试有界结束（最多 4 次 page-query POST），列表维持现状；下次任一重拉/路由回流收敛 |
| `localStorage` 无用户信息 | `pickMineConversations` 原样返回，行为与修复前一致（不清空列表） |
| 回包行缺 `userId` | 不过滤也不误杀（`item.userId != null` 才比对） |
| `fetchPage` 被更新的分页请求顶掉 | 返回 `false`，交由重试下一轮收敛 |
| 组件已卸载 | `unmountedRef` 短路，不再 setState |
| 同项目短时间内重复 created | in-flight 集合按复合键去重；已收敛则第 0 轮即返回 |

## 测试计划

- 新增（失败先行）：`src/layouts/.../ProjectPanel/index.selection.test.tsx` 3 例（重试到行出现 / 重试有界 / 双事件不并行重试）；`src/utils/projectConversationOwnership.test.ts` 5 例；`tests/userProjectApp.service.test.ts` 3 例；`src/pages/SpaceCreateProject/utils/projectCreateStrategy.test.ts` emit 断言补全。
- 回归：`npm run test:conversation`（当前基线 93 文件 / 826 用例全绿，必须保持）；`npm run lint:arch` 零新增违规。
- 真环境集成验证：**由用户在 testagent 后端跑 ego 实测**（本会话无 testagent 登录态）。首页输入框 → 建常规项目 → 发送 → 会话结束，不切 tab、不 F5，确认左列表即出现新项目；再展开一个多人项目确认只剩自己的会话。

## 已否决的备选方案

- **插占位行（乐观插入「未命名项目」）**：用户拍板不做——避免与「名联动勿擅修」的口径混淆，也避免后端始终不回该行时出现幻影行。
- **改共享 `applyProjectChangedToList` 让它能插入**：该函数被 `SpaceProjectManage` / `AppDevPro` / `HistoryConversationList` 等多方按「只打补丁」的语义消费，插入语义会泄漏到列表形态各异的调用方。
- **三个调用方各自过滤**：需各自 import `UserService`（三份重复），且其传递依赖（`account` / `router` / `antd`）进 `ProjectPanel` 有触发 vitest 顶层 import 崩的风险。
- **复用 `PC.Pages.AppDevIndex.unnamedProject` 作占位名**：随占位行方案一并否决。
- **本轮一并修 `SidebarNavHomeSection.tsx:56-58`（延后调用硬编码 `'visibility'`，把路由同步降级成受门控的可见性同步）**：确是真缺陷，但会放宽 `155a4b4f2` 有意收敛的「静止切回零请求」，且重试窗口已覆盖本 bug；改它超出本卡范围，改留工单。
- **本轮一并修经典布局 `ProjectPanel` 条件渲染**：超出卡上范围且 QA 环境是 style3 锁定，改留工单。
