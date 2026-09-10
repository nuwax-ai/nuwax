# 全栈应用任务及接口清单 · 前端接入同步状态

> **源文档**：[飞书 wiki「全栈应用任务及接口清单」](https://xspaceagi.feishu.cn/wiki/IGqqw91uWiIXFTkigruclnSFnHb)（后端同学维护，wiki 内「状态」列为**后端交付状态**，2026-09-08 全部标已完成） **契约版本**：2026-09-08 16:31 CSV 导出版（ego-browser「菜单 → 表格 → 下载为 CSV」路线，全量 32 行契约） **前端核查基线**：2026-09-08 · feat-2026.9.30 系分支快照（核查期间工作区 HEAD 在 feat-2026.9.30 / test(e2a2aa8b0) / feat-dong.0930 间被并行会话切换，行号以当日代码为准） **同步规则**：后端 wiki 更新 → 重导 CSV 对照更新本文；前端接线/下线 → 更新对应行状态与证据。**全部 ✅ 后才在标题加 ✅**（沿用 8 月任务板惯例）。

**状态图例**

| 标记 | 含义                                         |
| ---- | -------------------------------------------- |
| ✅   | 已接入：service 层有定义 + 页面真实消费      |
| 🟡   | 部分接入：行内个别接口未闭环（见备注）       |
| 🔵   | 已定义未消费：service 层有定义，但无页面调用 |
| ❌   | 未接入：service 层与页面均无                 |
| ➖   | 前端不关心：后端内部改造，前端无感           |

---

## 一、java 后端 模块（按 wiki 原行序）

### 1. 项目 / 应用基础

| # | 功能 | 接口 | 后端 | 前端 | 证据（file:line） | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 用户项目分页查询（常规/全栈/网页应用） | `POST /api/user-project/page-query`<br>`POST /api/user-project/tab/page-query`（2026-09-08 新接口，附带各项目会话列表） | 已完成 | ✅ | service `src/pages/AppDevPro/services/appDevPro.ts`（page-query `:32` / tab 再导出 `:27`）；消费 `src/layouts/DynamicMenusLayout/NewHomeSection/components/ProjectPanel/index.tsx`（tab+children=conversations）；**SpaceProjectManage 亦已切 tab**（2026-09-10：实测 page-query 真实行主键为 `projectId` 无 `id` 字段、与 tab 同构，列表/打开/改名/删除/导出全量消费 tab 行） | mock：`mock/userProjectAPI.ts:68`（dev 供数，仅 page-query）；两接口实测行结构一致：主键 `projectId`、附 `conversationId/sandboxId/conversations[]` |
| 2 | 常规项目 CRUD | `POST /api/user-project/create`<br>`GET /api/user-project/get/{id}`<br>`POST /api/user-project/update`<br>`POST /api/user-project/delete/{id}` | 已完成 | 🟡 | service 全族已定义（`appDevPro.ts` `apiUserProjectCreate/GetById/Update/Delete`）；**update/delete 已消费**：SpaceProjectManage ⋯ 菜单 + ProjectPanel 菜单（1472047c7） | **create/get 已定义未消费**：新建仍走 `/api/project/create`（返回 conversationId 支撑「创建即进 IDE」，是否切换待与后端确认响应结构）；置顶/归档/收藏后端无契约仍本地态 |
| 3 | 全栈应用 CRUD（管理端创建） | `POST /api/userapp/create`<br>`GET /api/userapp/get/{id}`<br>`POST /api/userapp/update`<br>`POST /api/userapp/delete/{id}` | 已完成 | ✅ | create `appDevPro.ts:27` / update `:46`，消费 `src/pages/AppDevPro/components/CreateUserApp/index.tsx:93,111`（SpaceProjectManage 复用）；get `:37`，消费 `src/pages/AppDevPro/index.tsx:477`；delete `:56`，消费 SpaceProjectManage ⋯ 菜单 + ProjectPanel 删除菜单（1472047c7） | 2026-09-10：CreateUserApp 创建参数对齐首页口径，create 带 `sandboxId=-1`（全栈仅云端）+ `devAgentId=租户默认任务智能体`（契约先行） |
| 4 | 首页对话框创建全栈应用、常规项目（老接口改造） | `POST /api/project/create`（加 `sandboxId` 要传 + `devAgentId`） | 已完成 | ✅ | service `src/services/appDev.ts:655`（入参类型两字段均在）；策略层 `src/pages/SpaceCreateProject/utils/projectCreateStrategy.ts:81-87`；Home 链路 `src/pages/Home/index.tsx:225-237` 双参都传（commit 115cdd6d2） | ⚠️ 覆盖面：devAgentId **仅 Home 首页入口传**；`SpaceCreateProject/index.tsx:31-45` 不传 devAgentId；SpaceProjectManage 的 CreateNormalProjectModal（`:44-49`）两参均不传——是否需要覆盖待与后端确认（见三-待确认 ①） |
| 5 | 全栈应用：获取当前用户最新会话 | `GET /api/userapp/conversation/{id}` | **未实装**（2026-09-10 实测 4040 No static resource） | 🔵 | service `appDevPro.ts` `apiUserAppLatestConversation` 已定义；前端消费已移除——打开项目改用 tab/page-query 行自带 `conversationId`（与 ProjectPanel 同源） | wiki 标已完成与实测不符；待后端实装后可恢复接线 |
| 6 | 常规项目：获取当前用户最新会话 | `GET /api/user-project/conversation/{id}` | **未实装**（2026-09-10 实测 4040 No static resource） | 🔵 | service `apiUserProjectLatestConversation` 已定义；前端消费已移除——常规项目打开跳 home/chat 会话详情改用 tab 行 `conversationId` + `conversations[].agentId` | wiki 标已完成与实测不符；与 #5 同族待后端实装 |
| 7 | 创建工作空间、推送技能 header 改造 + appId、git 初始化 | — | 已完成 | ➖ | — | wiki 标注前端不关心 |
| 8 | 所有文件操作走 file server，header 改造 + appId | — | 已完成 | ➖ | — | wiki 标注前端不关心 |

### 2. 云电脑 / 环境参数

| # | 功能 | 接口 | 后端 | 前端 | 证据（file:line） | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 9 | pod 系列加参数（wiki 原文：加 service_type、app_stage、app_id；**前端侧只需 appStage(dev/prod)**） | `POST /api/computer/pod/ensure`<br>`POST /api/computer/pod/restart`<br>`POST /api/computer/pod/keepalive`<br>`GET /api/computer/pod/vnc-status`<br>`POST /api/computer/agent/stop/{conversationId}`<br>`GET /api/computer/pod/status` | 已完成 | 🟡 | 统一组装 `src/services/vncDesktop.ts:191-194 buildPodRequestParams`（`{cId}` + 可选 `appStage`）；ensure `:209`、restart `:249`、agent/stop `:260`、keepalive `:271`、vnc-status `:293`；注入链 `src/models/conversationInfo.ts:337-358`（podAppStageRef/setPodAppStage），仅 AppDevPro 设置：`src/pages/AppDevPro/index.tsx:233 setPodAppStage(dbEnv)`，卸载清空保证老页面不带该字段 | ① appStage 前端已满足；② **pod/status 前端无任何调用**（历史上也没接过），是否需新增消费待确认（见三-待确认 ②）；③ 五接口均在 `src/services/common.ts:89-91` 静默/降级名单 |

### 3. 全栈应用生命周期（宿主页面：AppDevPro `/space/:spaceId/app-pro`）

| # | 功能 | 接口 | 后端 | 前端 | 证据（file:line） | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 10 | 开发启停 | `POST /api/userapp/dev/start`<br>`POST /api/userapp/dev/restart`<br>`POST /api/userapp/dev/stop` | 已完成 | ✅ | `appDevPro.ts:65/75/85`；消费 `src/pages/AppDevPro/hooks/useUserAppRuntime.ts:184-191`（按 env 分流），挂载于 `AppDevPro/index.tsx:498` |  |
| 11 | 构建应用（发布阶段） | `POST /api/userapp/build` | 已完成 | ✅ | `appDevPro.ts:95`；消费 `src/pages/AppDevPro/hooks/useUserAppPublish.ts:174`（startPublish 第一步） |  |
| 12 | 取消任务（dev 启动/重启、构建） | `POST /api/userapp/tasks/{taskId}/cancel` | 已完成 | ✅ | `appDevPro.ts:105`；消费 `useUserAppPublish.ts:186,249`、`useUserAppRuntime.ts:206,342` |  |
| 13 | 任务执行详情 SSE（dev/start、dev/restart、build） | `GET /api/userapp/tasks/{taskId}/logs/stream` | 已完成 | ✅ | `src/pages/AppDevPro/utils/userAppTaskStream.ts:88 listenUserAppTaskStream`（`@microsoft/fetch-event-source`，带 Authorization + `fromSeq` 断点续传）；渲染 `src/pages/AppDevPro/components/AppDevPublishProgressModal/index.tsx` | ⚠️ `appDevPro.ts:114 apiUserAppBuildLogsStream`（umi request 版）为**死代码**无消费，实际走 URL 拼接 `:133` + fetch-event-source；接线路径勿再走 umi request |
| 14 | 发布申请（老接口改造，新类型 UserApp） | `POST /api/publish/apply` | 已完成 | ✅ | `src/services/publish.ts:53 apiPublishApply`；消费 `useUserAppPublish.ts:131-142` 显式 `targetType: AgentComponentTypeEnum.UserApp`（`src/types/enums/agent.ts:25`） | 通用弹窗 `src/components/PublishComponentModal/index.tsx:234` 服务 Agent/Plugin/Workflow/Skill，UserApp 不走它 |
| 15 | 生产环境启停 | `POST /api/userapp/prod/start`<br>`POST /api/userapp/prod/restart`<br>`POST /api/userapp/prod/stop` | 已完成 | ✅ | `appDevPro.ts:144/154/164`；消费 `useUserAppRuntime.ts:184-191`（启停按 env 分流）、`:308`（prod stop） | prod 启动需已有发布版本（`:162-168` 校验，启动参数带 releaseId `:140-148`） |
| 16 | 查询应用日志源 | `POST /api/userapp/logs/sources/query` | 已完成 | ✅ | `appDevPro.ts:184`；消费 `src/pages/AppDevPro/hooks/useConversationAgentDevLogs.ts:200-211`（useRequest 5s 轮询，env 固定 Dev），挂载 `AppDevPro/index.tsx:325` |  |
| 17 | 应用日志查询 | `POST /api/userapp/logs/query` | 已完成 | 🔵 | `appDevPro.ts:174` 已定义（`src/services/common.ts:88` 列入静默白名单），**无消费方** | 日志 Tab 实际轮询的是 #16 sources/query；本接口是备用/未接线（见三-待确认 ③） |

### 4. 代理通道（userapp/proxy/\*）

| # | 功能 | 接口 | 后端 | 前端 | 证据（file:line） | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 18 | 开发阶段应用 url 代理 | `/api/userapp/proxy/app/dev/{appId}/{*path}` | 已完成 | ❌ | 全仓无引用 | 应用预览走**域名直连**：`appDomain.ts:69`（按 Dev/Prod 拼默认域名）+ `AppDevPro/index.tsx:1376` iframe。代理通道与域名直连的分工待确认（三-待确认 ④） |
| 19 | 发布阶段应用 url 代理 | `/api/userapp/proxy/app/prod/{appId}/{*path}` | 已完成 | ❌ | 同上 | 同上 |
| 20 | pg 开发数据库代理 | `/api/userapp/proxy/dbx/dev/{appId}/{*path}` | 已完成 | ✅ | `src/pages/AppDevPro/services/appDb.ts:74 getUserAppDbProxyUrl`（dev/prod 两态）；消费 `src/pages/AppDevPro/components/AppDevDatabasePanel/index.tsx:32` iframe（`AppDevPro/index.tsx:1382` 渲染） |  |
| 21 | pg 线上数据库代理 | `/api/userapp/proxy/dbx/prod/{appId}/{*path}` | 已完成 | ✅ | 同 #20（同一 helper 按 env 切换） |  |
| 22 | Web 终端代理（开发） | `/api/userapp/proxy/ttyd/dev/{appId}/{*path}` | 已完成 | ❌ | 全仓无引用 | 仓内现有终端是**另一通道**：`src/utils/terminalWsUrl.ts:34` → `/computer/terminal/{conversationId}/ws`（会话智能体终端，组件 `src/components/business-component/Terminal/`）。两通道关系待确认（三-待确认 ⑤） |
| 23 | Web 终端代理（线上） | `/api/userapp/proxy/ttyd/prod/{appId}/{*path}` | 已完成 | ❌ | 同上 | 同上 |
| 24 | vnc 代理（开发） | `/api/userapp/proxy/vnc/dev/{appId}/{*path}` | 已完成 | ✅ | `appDevPro.ts:200 getUserAppVncProxyUrl`（**仅 dev 版**）；消费 `src/pages/AppDevPro/components/AppDevRemoteDesktopPanel/index.tsx:28` iframe（`AppDevPro/index.tsx:1399` 渲染） | wiki 只列了 dev 一条，无 prod 诉求 |
| 25 | 语音代理（开发） | `/api/userapp/proxy/audio/dev/{appId}/{*path}` | 已完成 | ❌ | 全仓无引用 | 消费场景（云电脑语音）未在 AppDevPro 出现，待产品明确 |
| 26 | 输入法代理（开发） | `/api/userapp/proxy/ime/dev/{appId}/{*path}` | 已完成 | ❌ | 全仓无引用 | 同上 |
| 27 | 登录信息透传给应用 | — | 已完成 | ➖ | — | wiki 标注前端不关心 |

### 5. 域名 / 数据库凭据 / 导入导出 / 下架

| # | 功能 | 接口 | 后端 | 前端 | 证据（file:line） | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 28 | 域名绑定 | `POST /api/userapp/domain/list`<br>`POST /api/userapp/domain/create`<br>`POST /api/userapp/domain/update`<br>`POST /api/userapp/domain/delete` | 已完成 | 🟡 | list `appDomain.ts:82` + `AppDevPro/index.tsx:534`；create `:94` + `AppDevSettingsModal/index.tsx:118`；delete `:114` + `AppDevSettingsModal:132` | **update（换绑）已定义无消费**：`appDomain.ts:104`；设置弹窗目前只有绑定/解绑，无换绑入口 |
| 29 | 数据库账号密码管理（dev/prod 参数控制） | `GET /api/userapp/db-credential/{id}`<br>`POST /api/userapp/save-db-credential`<br>`GET /api/userapp/gen-db-credential/{id}` | 已完成 | 🔵 | `appDb.ts:30 / :43 / :53` 三条均已定义，**均无消费** | AppDevDatabasePanel 目前只嵌 dbx 代理 iframe，凭据查看/保存/随机生成 UI 缺失（三-待确认 ⑦） |
| 30 | 导出项目（全栈、常规） | `GET /api/computer/static/download-all-files` | 已完成 | ✅ | `src/services/vncDesktop.ts:158 apiDownloadAllFiles`（浏览器直下）；消费 `src/pages/Chat/hooks/useChatFiles.ts:313`、`useLocalDirectoryFiles.tsx:502`、`AppDevPro/index.tsx:931`、`ConversationAgent/index.tsx:1229`、`EditAgent/index.tsx:884`；**新增** `SpaceProjectManage/index.tsx` ⋯ 菜单导出（2026-09-10，先取 #5/#6 最新会话再按 cId 导出，无会话提示先进入项目） | 老接口，wiki 仅确认适用范围扩到全栈/常规项目 |
| 31 | 导入覆盖（全栈、常规） | `POST /api/computer/static/import-project` | 已完成 | ✅ | `vncDesktop.ts:316 apiImportProject`（FormData）；消费 `AppDevPro/index.tsx:421`（ImportProjectModal）、`ConversationAgent/index.tsx:576` | 同上 |
| 32 | 下架全栈应用（老接口改造） | `POST /api/published/offShelf` | 已完成 | 🔵 | `appDomain.ts:142-149 apiPublishedOffShelf`（注释标明支持 UserApp），**无消费** | 仍在用的旧通道：`/api/publish/offShelf`（`src/services/publish.ts:33`，VersionHistory:100、SpaceSquare:171）与 `/api/system/publish/offShelf/{id}`（`src/services/publishManage.ts:53`，OffshelfModal:25）。UserApp 下架 UI 入口（AppDevPro 内）待补（三-待确认 ⑥） |

---

## 二、nuwax-file-server 模块

| # | 功能 | 后端 | 前端 | 备注 |
| --- | --- | --- | --- | --- |
| 33 | 新路径规则 `userapp-workspace` | 已完成 | ➖ | 前端不关心 |
| 34 | 创建工作空间/推送技能 header 加 `x-service-type`/`x-app-id`/`x-user-id`，参数加 `service_type` | 已完成 | ➖ | 前端不关心 |
| 35 | 按项目类型分工作目录和日志目录 | 已完成 | ➖ | 前端不关心 |

---

## 三、缺口汇总

### 统计（按 wiki 行数）

> 2026-09-08 晚更新：#26 任务 26a/26b/26c 落地（1472047c7）——user-project CRUD 接线（update/delete）、userapp delete 入口、conversation/{id}×2 最新会话直达；PageApp 改名删除契约未覆盖仍本地。

- ✅ 完整接入 **18 行**（#1/3/4/5/6/10/11/12/13/14/15/16/20/21/24/30/31 + #9 为 appStage 五接口齐、pod/status 见待确认 ②）
- 🟡 部分接入 **3 行**（#2 user-project create/get 已定义未消费、#28 domain update 未消费、#9 pod/status 无调用）
- 🔵 已定义未消费 **2 行**（#17 logs/query、#29 db-credential×3）+ 行内 3 条（#2 create/get、#28 update）、#32 offShelf 新路径
- ❌ 未接入 **6 行**（#18/#19 proxy/app、#22/#23 proxy/ttyd、#25 audio、#26 ime——均为代理通道，落点 AppDevPro 归属另定）
- ➖ 前端不关心 **5 行**（#7/#8/#27/#33/#34/#35）

### 待确认语义点（对接后端/产品）

1. **devAgentId 覆盖面**：契约场景写「首页对话框创建」，Home 已传；SpaceCreateProject（空间创建项目页）与 SpaceProjectManage 的 CreateNormalProjectModal 是否也要传？
2. **pod/status**：wiki 列在 computer 六接口里，但前端历史上从无调用——是后端单方面加参，还是需要新增前端消费？
3. **logs/query vs sources/query**：日志 Tab 现轮询 sources/query（env 固定 Dev），logs/query 已定义未用——最终形态是哪个？prod 环境日志走哪条？
4. **预览域名直连 vs proxy/app 代理**：应用预览现在拼默认域名直连，后端另提供 dev/prod 两套 url 代理——分工是什么（同源调试？内网兜底）？
5. **proxy/ttyd 与现有终端**：现有终端走 `/computer/terminal/{conversationId}/ws`（会话锚定），userapp ttyd 代理是应用锚定——AppDevPro 是否需要独立的 Web 终端页签？
6. **UserApp 下架入口**：新路径 `apiPublishedOffShelf` 已定义，AppDevPro 无下架按钮；旧 `/api/publish/offShelf` 是否继续兼容 UserApp？
7. **db-credential UI 落点**：凭据查看/保存/随机生成放 AppDevDatabasePanel 内还是设置弹窗？

---

## 四、维护规则

1. **后端 wiki 更新后**：重导 CSV（ego-browser「菜单 → 表格 → 下载为 CSV」，落 `~/Downloads`）→ 对照更新本文「后端」列与契约版本时间；新增行按序号续排。
2. **前端接线/下线后**：更新对应行「前端」状态与证据行号；备注里的死代码、假操作描述同步删除。
3. **行号漂移**：证据 file:line 是 2026-09-08 快照，重大重构后以函数名 grep 为准，顺手修正行号。
4. **收口**：全部行 ✅（或 ➖/明确不做）后，标题加 ✅ 并在本节记录收口日期。
