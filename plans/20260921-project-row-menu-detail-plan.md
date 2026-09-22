# 侧栏项目行菜单：置顶文案修正 + 新增「项目详情」跳转

日期：2026-09-21 　分支：feat-dong.0930

## 背景（用户截图两点反馈）

1. 侧栏项目行 ⋯/右键菜单里置顶项文案是「置顶会话」——菜单作用于**项目**，应为「置顶项目」。
2. 菜单缺「项目详情」入口，要求新增并跳转到项目详情页。

## 现状

- 侧栏 `NewHomeSection/components/ProjectPanel` 的 `buildProjectMenu`（约 1140 行）置顶标签借用会话词条 `PC.Components.ConversationContextMenu.pin/unpin`（"置顶会话/取消置顶"）；项目行 hover 置顶按钮的 Tooltip 与 aria-label 同样借用（约 1425-1445 行）。
- 会话行（ConversationItem）、会话菜单（ConversationContextMenu）用同词条是正确语义，不动。
- 历史页项目列表已有项目专用词条先例（`HistoryConversationList.projectPin="置顶"`）。
- 各类型项目详情页路由（`src/routes/index.ts`）与跳转映射（`SpaceProjectManage/index.tsx` `handleOpenProject` 256-264 行）现成：
  - NormalProject → `/space/:spaceId/normal-project-detail/:projectId`
  - UserApp → `/space/:spaceId/app-project-detail/:appId`
  - ThirdApp → `/space/:spaceId/third-app-detail/:projectId`

## 改动

### 1. 词条（5 语言，插 `PC.Layouts.DynamicMenusLayout.NewHomeSection` 块）

| key | zh-CN | en-US | zh-HK/zh-TW | ja-JP |
| --- | --- | --- | --- | --- |
| projectDetail | 项目详情 | Project details | 項目詳情/專案詳情 | プロジェクト詳細 |

（2026-09-21 两轮定调收敛：置顶文案全站统一通用「置顶/取消置顶」——项目行、任务行、会话行、历史页全一致。实现=改共用词条 `ConversationContextMenu.pin/unpin` 的值（unpin 原本就是「取消置顶」，en unpin 顺带去掉 conversation 后缀），项目行收回共用词条，中间态的 pinProject/unpinProject 专用键已删；仅新增 projectDetail 一个键。）

### 2. `ProjectPanel/index.tsx`

- 新增模块级纯函数 `projectDetailPath(project)`：按 projectType 三分支映射详情页 URL； `spaceId` 缺失或类型无详情页（PageApp 等）返回 null → 菜单项隐藏。
- `buildProjectMenu`：
  - 置顶标签沿用共用词条 pin/unpin（值已改「置顶/取消置顶」，按 pinnedIds 复合键判断，同现状）。
  - 「收藏」之后、divider 之前插入 `detail` 项（ProfileOutlined 图标），仅 `projectDetailPath` 非 null 时展示。
  - onClick 加 `detail` 分支：`history.push(path)`（umi history，layouts 层有先例）。
- 项目行 hover 置顶按钮 Tooltip / aria-label 与菜单同源（共用词条）。

## 不做

- 历史页 ProjectList（已有项目词条）、会话行/会话菜单（语义正确）不动。
- SpaceProjectManage 的未知类型兜底链（最近会话 → 详情 → 上框）不复刻，菜单只服务三类有详情页的类型。

## 验证

- `npx vitest run` ProjectPanel 相关测试（index.selection / projectPagination / childrenProbe）。
- 词条五语言 key 齐全（grep 核对）。
- tsc 改动路径零新增。
