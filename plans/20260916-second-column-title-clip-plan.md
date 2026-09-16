# 实施计划：二级列标题负 margin 裁切修复（广场/更多页/系统管理）

- 对应 spec：无（样式缺陷修复，单点根因，不走 intent/spec 链）
- 状态：已接受（用户报障 2026-09-16：/square 标题「广场」首字缺角；/more-page/my-subscriptions、/system/recommend-manage/chatbox 同类问题）

## 根因

三处页面的二级列标题共用 SidebarNavLayout 单一渲染点（style3 单栏）：

- 标题块 `margin: '-9px 0 0'` 上提 9px 对齐顶栏中线（19px 目标线）；
- 外层 HoverScrollbar `.content` 为 `overflow:hidden`，盒顶在 28px（列 padding 16 + 滚动容器 padding 12）；
- 负 margin 顶出盒顶的 9px 整段被裁 →「广场」变「）场」、「更多」变「史多」（9-15 实锤，当时挂账统一修）。

## 改动文件清单

| # | 文件 | 动作 | 说明 |
| --- | --- | --- | --- |
| 1 | src/layouts/DynamicMenusLayout/SidebarNavLayout/index.tsx | 改 | HoverScrollbar 顶部 padding 12→3px（标题自然落位 19px）；标题块删负 margin、底部 padding 12→21px 补偿 |
| 2 | src/layouts/DynamicMenusLayout/SpaceSection/index.tsx | 改 | 头部包裹层内联 `0 12px 12px` 改挂 `.header-box` 类（默认值不变，经典/HoverMenu 不受影响） |
| 3 | src/layouts/DynamicMenusLayout/SpaceSection/index.less | 改 | `.header-box` 新增：默认 `0 12px 12px`；`:global(.xagi-nav-style3)` scope 下 `3px 10px 21px` 对齐标题分支落位 |

后续菜单内容落点逐像素不变：19+24+21 = 64 = 28+24+12。

### 补充：影响范围与工作空间对齐（2026-09-16 用户追加）

- **影响范围确认**：裁切缺陷与修复均仅在 SidebarNavLayout（style3 单栏，`DynamicMenusLayout/index.tsx` 按 style 分流）；style1/2 经典布局走 ClassicLayout，无负 margin 写法，不受缺陷影响也不受修复影响。
- **工作空间二级列对齐**：SpaceSection 头部（个人空间选择器）原 `padding: 0 12px 12px`、自然落位 top=16，与标题分支（top=19/水平 20/底部 21）不齐；因 SpaceSection 被 ClassicLayout/HoverMenu 共用，改动以 less + style3 祖先标记 scope，单栏生效 `3px 10px 21px`（top 16+3=19）。ego 实测 space 页头部 top 19/left 20/中点 31，与广场页标题完全一致。

## 实施顺序

1. 单文件两处内联样式改动，一次完成。

## 证明成立的测试

- 新增测试：无（纯内联样式定位修复，无逻辑分支；走浏览器像素走查）
- 回归范围：改动文件不触会话域红线；浏览器复验三页标题完整不缺角、与顶栏中线对齐、二级菜单列表纵向落点不变

## 风险与回退

| 风险 | 缓解 | 回退方式 |
| --- | --- | --- |
| 菜单列表纵向落点漂移 | 底部 padding 21px 精确补偿（算式见上） | revert 单提交 |
| 其他 HoverScrollbar 消费方受影响 | 改动仅 SidebarNavLayout 内联 style，组件本体不动 | 不适用 |

## 偏离记录

（无）
