<!--
nuwa-sdlc-kit v1.0.0 · content — 播种一次，本地所有（升级不覆盖）
SDLC Stage 3 · Build 工件模板
用法：spec 通过后在 plan mode 访谈产出，存 plans/YYYYMMDD-<slug>-plan.md。
闸门：接受本计划才允许动 src；实现偏离计划时同一 commit 更新本文件（plan-gate 会提醒）。
-->

# 实施计划：normal-project-integration

- 对应 spec：无独立 spec（小需求，直出 plan；需求源=飞书 wiki「全栈应用开发接口清单」v2 2026-09-11 行 4/5/6）
- 状态：已接受（2026-09-11 用户批准计划）

## 需求背景

罗东负责范围内（首页/项目管理相关项目接口）三个未闭环项，后端契约已就位：

1. **行 4 常规项目 CRUD**：`/api/normal-project/create` 已接，get/update/delete 未接（改名/删除仍走老 `/api/user-project/*`）。
2. **行 5 常规项目最新会话**：`GET /api/normal-project/conversation/{id}`（进项目详情无会话 id 时调用），全仓未接。
3. **行 6 项目置顶/归档**：`POST /api/user-project/pin/{id}`、`POST /api/user-project/archive/{id}`，ProjectPanel 现为内存 Set 本地态。

明确不做：行 9 会话域 pin/archive/list（归属未明）、SpaceProjectManage 补置顶/归档菜单、收藏后端化（契约无）、全栈模块。

## 改动文件清单

| # | 文件 | 动作 | 说明 |
| --- | --- | --- | --- |
| 1 | plans/20260911-normal-project-integration-plan.md | 增 | 本文件 |
| 2 | src/services/userProjectApp.ts | 改 | 新增 normal-project update/delete/get/conversation 四函数 + user-project pin/archive 两函数（共享层，layouts 可消费） |
| 3 | src/types/interfaces/userProject.ts | 改 | `UserProjectTabItem` +`pinned?/archived?`（契约先行防御式） |
| 4 | src/pages/AppDevPro/services/appDevPro.ts | 删 | 老族死代码 `apiUserProjectLatestConversation`（零消费）；顺带若 import 链无引用则移出再导出清单 |
| 5 | src/pages/SpaceProjectManage/index.tsx | 改 | 改名/删除 NormalProject 分支切新族；CRUD import 收敛到 `@/services/userProjectApp`（消除跨页面 import 存量违规）；handleOpenProject 缺会话兜底链（conversation 接口 → get 兜底 → pin 上框） |
| 6 | src/layouts/DynamicMenusLayout/NewHomeSection/components/ProjectPanel/index.tsx | 改 | 改名/删除切新族；toggleProjectFlag pin/archive 分支调后端（失败回滚不动 Set）；数据加载 seed pinned/archived |

## 关键设计

- **服务落点**：`src/services/userProjectApp.ts`（分层规范 docs/engineering-conventions.md:71；ProjectPanel 在 layouts 层必须走共享层）。
- **契约先行**：响应字段未细化的接口全部防御式取值（沿 26a/26b、apiNormalProjectCreate 先例）；`ProjectLatestConversationResult` 复用既有类型（conversationId/id/agentId 三形态）。
- **置顶/归档**：成功才更新本地 Set + 复用既有 toast 词条（零新增 i18n）；收藏维持本地态；行数据 `pinned/archived === true` 防御式 seed（后端字段就位自动生效，未就位不阻塞）。
- **打开项目兜底链**（NormalProject 分支，行内 conversations 取不到时）：① `apiNormalProjectLatestConversation` → ② `apiNormalProjectGetById` 防御式取 conversationId → ③ 现有 `pin()` 上框兜底；期间防重复点击。

## 实施顺序

1. 类型（#3）→ 服务层（#2）→ 死代码清理（#4）。
2. SpaceProjectManage（#5）→ ProjectPanel（#6）。
3. 验证：tsc 触达零新增、`vitest run tests/sidebarProjectPanel.test.tsx`、`test:conversation` 全绿。
4. 飞书表格回填 E4/E5/E6 → 已对接；本地 docs/userapp-api-integration-status.md 同步。

## 验收

- 常规项目改名/删除请求落 `/api/normal-project/*`（Network 可见）。
- ProjectPanel 置顶/归档发 POST `/api/user-project/pin|archive/{id}`，失败 toast 且状态回滚。
- 项目管理页打开无会话常规项目：先见 conversation 接口请求，仍无则 get，再无则上框 /home。
