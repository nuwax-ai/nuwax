# 提测后优化实施计划（2026-09-12，worktree：refactor/qa-optimization-0912）

> 来源：sess_d9a89e67 提测前质量评估的 P0 清单。本文件为 plan-gate 工件，实施已获批。
> 分支基于 `feat-dong.0930@848519452`，**不合入提测分支**，走查后由负责人决定合并时机。

## 范围

| 项 | 内容 | 预期效果 |
| --- | --- | --- |
| 速赢包 | 删 3 处死代码 + i18n dead key | -~2200 行 |
| P0-3 | ProjectPanel「查看更多」分页 | 大数据量不再一次性渲染 |
| P0-1 | 导航双份收敛第一批（纯函数 + useMenuNavigation） | Classic/SidebarNav 各删 ~400 行重复 |

P0-2（输入框收敛）、P0-4（Chat 页拆分）、SpaceProjectManage 测试：**本批不做**。

## 死代码清单（三个只读探索代理核实零引用）

1. `src/layouts/DynamicMenusLayout/HomeSection/`（4 文件 352 行）——两布局均渲染 NewHomeSection（ClassicLayout:745 / SidebarNavLayout:806）
2. `src/pages/Home/index.legacy.tsx` + `index.legacy.less`（441 行）——umi 只认 index.tsx
3. `src/pages/Home/DraggableHomeContent/`（11 文件 ~1400 行）——唯一引用者是 legacy:28
4. i18n：删 `HomeSection.{recentlyUsed,noAgentUsed,exploreSquare,conversationHistory,viewAll,startFirstConversation}`（5 语言）
   - **保留** `HomeSection.projectTab`（NewHomeSection:654,711 在用）、`ConversationItem.executing`（多处在用）

## ProjectPanel 分页要点

- pageSize 100→20；`current/total/loadingMore` 面板内自管
- 「查看更多（剩余 N）」按钮仿「已归档」入口样式位（index.tsx:768-781）
- 追加按 projectId 去重合并；pinnedIds/archivedIds 增量并集；`hasMore = 去重数 < total`；spaceId 变化重置
- 纯函数抽 `ProjectPanel/projectPagination.ts` + 单测（显式 import vitest）
- 不动 NewHomeSection 共享滚动容器（触底自动加载留进阶）

## 导航收敛要点

- **提交 D**：`menuMatching.ts` 抽 `isMenuMatch`/`isPathMatch`/`findFirstLevelCodeByMenuCode(firstLevelMenus, menuCode)`/`findFirstLevelCodeByPath`，两布局删本地副本 + 单测
- **提交 E**：`useMenuNavigation` hook 收编 activeTab 状态机 + 大 effect + handleTabClick（~400 行×2）；注入 `secondMenuSectionTabs`（Classic 含 homepage / SidebarNav 不含）与移动菜单关闭回调；依赖数组与调用时序原样保持；JSX/二级列/handleUserClick 不合并
- hook 单测放 `tests/chatConversation/`（入 test:conversation 门禁）

## 质量门

- 每提交独立绿；终验一次全量：`npm run test:conversation` 全绿 + `npx tsc --noEmit` 改动路径零新增（基线 ~515 预存）+ 新增测试全过 + grep 零残留
- 布局导航行为（style1/2+style3 刷新/直链/新对话）需浏览器走查——本批 worktree 无带登录态 dev server，走查留给负责人或授权 ego-browser 对主区 3000 验

## 明确不做

P0-2 / P0-4 / SpaceProjectManage 测试 / debug FAB 生产可见性（待产品）/ 触底自动加载 / AppDev 本地 fork 输入框
