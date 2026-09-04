# 主导航改造：全局单栏化（入口合并至会话侧栏）— 实施计划

- 分支：`feat/sidebar-nav-merge`（基于 `feat-dong.0930`，worktree `.claude/worktrees/sidebar-nav`）
- 日期：2026-09-03
- 状态：已与需求方对齐四项决策（改造范围/入口集合/自动化指向/搜索形态）

## 背景与目标

参考 Claude/Codex 桌面端形态：移除全局主导航（一级 icon 竖栏），把导航入口合并到会话侧栏顶部，形成「单一侧栏」布局。

现状：`src/layouts/DynamicMenusLayout/index.tsx` = 一级竖栏（Header logo + DynamicTabs + UserOperateArea + User）+ 二级列（按 activeTab 分发 NewHomeSection/SpaceSection/SquareSection/DynamicSecondMenu，底部 CreditsBalance）。菜单数据由后端 `/api/user/list-menu` 下发（`menuModel`），前端按 code 映射图标与 Section。

## 已确认决策

| 决策点 | 结论 |
| --- | --- |
| 改造范围 | 全局单栏：整个应用移除一级竖栏，侧栏常驻为唯一导航 |
| 入口集合 | 顶部四项（新建任务/搜索/自动化/插件市场）+「探索」Dropdown 收纳其余后端下发菜单 |
| 自动化指向 | `/space/:spaceId/task-center`（spaceModel 解析默认空间） |
| 搜索形态 | 聚焦侧栏现有内嵌搜索框 + ⌘K 快捷键 |

## 目标形态

侧栏 = 全局顶部区 + 按域切换的主体 + 统一底部：

1. 顶部（新组件 `SidebarNavHeader`）：Logo（点击回 /home）+ 操作区行：新建任务(⌘N)/搜索(⌘K)/自动化/插件市场/探索(⋯ Dropdown)
2. 主体：
   - 会话域（/home、/home/chat）= `NewHomeSection` 三 tab 会话列表
   - 空间/广场/系统管理域 = 保留原 SpaceSection/SquareSection/DynamicSecondMenu（管理后台子导航不失联）
   - 其余路由兜底 = 会话列表（NewHomeSection）
3. 底部：CreditsBalance（原位）+ User 头像迁移至此（横向布局变体）

## 入口行为

- 新建任务 = 现有 `new_conversation` 逻辑（`handlerClick` → `handleCreateConversation(defaultAgentId)`）
- 搜索 = 聚焦侧栏搜索框（模块级 focus 单例）+ ⌘K；⌘N 尽力拦截（webview 内有效，浏览器可能被系统占用）
- 自动化 = `/space/:spaceId/task-center`
- 插件市场 = `/square?cate_type=plugin...`（对齐 SquareSection 插件项）
- 探索 = `menuModel` 的 firstLevelMenus（排除 homepage/new_conversation）+ otherMenus，复用 `handleTabClick`/`handleUserClick`，保留后端权限过滤

## 实施步骤

1. `DynamicMenusLayout/index.tsx`：删一级竖栏渲染；nav-menus 顶部挂 SidebarNavHeader、底部 integral-footer 加 User；主体切换反转为「默认 NewHomeSection，仅 space/system_square/system_manage 走原 Section」；侧栏常驻
2. 新组件 `DynamicMenusLayout/SidebarNavHeader/`（tsx + less）
3. `SearchHeader` 输入框 ref 透传（模块级 focus 单例，沿用 NewHomeSection `componentCache` 模式）；SearchHeader 内新建按钮下线
4. `User` 组件加横向布局变体
5. i18n：新增词条五语言全补（zh-CN/en-US/zh-TW/zh-HK/ja-JP）
6. 验证：定向 vitest（recentAgentItemGroup 等）+ `test:conversation` + tsc 零新增 + dev 走查

## 边界

- OpenApp(/app) 内嵌模式、HoverMenu、后端菜单接口不动，仅改渲染壳
- 通知弹窗（setOpenMessage via layout model）与外链打开逻辑原样复用
- 移动端抽屉形态沿用，重点保桌面
