# 实施计划：经典布局（style1/2）任务列表单行化 + 列表左缘收窄

- 对应 spec：无（用户口头需求三条，2026-09-19 当面定调，ego-browser 现场实测取数）
- 状态：已完成（含偏离记录）

## 背景（实测几何，style2 现场）

- 任务行标题距列缘 42px：nav-menus pl 16 + `.conversation-list` pl 15 + 行 pl 10
- 项目行名称距列缘 ~44px：`.project-panel` pl 8 + 行 pl 4 + 图标
- 单栏 style3 任务行本就单行（compact 抑制智能体名副标题），用户认可 style3 现状

## 改动文件清单

| # | 文件 | 动作 | 说明 |
| --- | --- | --- | --- |
| 1 | src/layouts/DynamicMenusLayout/NewHomeSection/components/ConversationItem/index.tsx | 改 | 删 `hasAgentName` 分支与 `conversation-meta` 副标题块，时间恒内联标题行尾（compact 形参保留，仅样式用途） |
| 2 | src/layouts/DynamicMenusLayout/NewHomeSection/components/ConversationItem/index.less | 改 | 删 `.conversation-meta` 及 hover/active 引用（死样式清理） |
| 3 | src/layouts/DynamicMenusLayout/NewHomeSection/index.less | 改 | 经典 `.conversation-list` 左 padding 15→0（style3 作用域有 10px 覆盖不受影响） |
| 4 | src/layouts/DynamicMenusLayout/NewHomeSection/components/ProjectPanel/index.less | 改 | 经典 `.project-panel` pl 8→0、`.row` pl 4→10（图钉与任务行对齐；compact 分支自帶覆盖不受影响） |

目标几何：两个列表行胶囊左缘都落在容器基线（x=97），内容（图钉/标题）内缩 27px（原 42px）。

## 实施顺序

1. ConversationItem tsx + less（单行化）
2. 两个列表容器/行 padding（左缘收窄）
3. 浏览器走查（style1/2 任务+项目两 tab 实测对齐）+ vitest 回归

## 证明成立的测试

- 新增测试：无（纯展示删减，现有快照/行为测试回归覆盖）
- 回归范围：`npx vitest run src/layouts/DynamicMenusLayout/NewHomeSection`（含 ConversationItem leading-mark、ProjectPanel selection、useHomeSectionData 等）；触达会话路径，`npm run test:conversation` 抽查

## 风险与回退

| 风险 | 缓解 | 回退方式 |
| --- | --- | --- |
| 二级列/其他复用方跟随变窄 | `.conversation-list`/`.project-panel` base 为经典形态，style3 有更高优先级覆盖；二级列同视觉族随动可接受 | 还原各 less padding 值 |
| leading-mark 测试断言副标题结构 | 改前先跑该测试确认断言面 | 按 Redis 快照回退 tsx |

## 偏离记录

1. **新增需求 ③**（实施中追加）：style1/2 hover 任务/项目会话行时隐藏时间——hide 规则从 compact 专属块上提到基础作用域（ConversationItem `&:hover/.focus-visible/:has` 与 ProjectPanel `.child` 同款），compact 行为等价不变。
2. **需求 ② 实施方式偏离**：原计划直接改 `.conversation-list` 基础 padding-left 15→0，实测泄漏影响 style3——基础规则 `.new-home-section .conversation-list-wrapper .conversation-list` 与文件靠前的 style3 覆盖块 `:global(.xagi-nav-style3) & .conversation-list` 同优先级 (0,3,0)，基础规则位置更靠后胜出，style3 的 10px 左内缩被一并归零（用户截图实证图钉贴边）。改为在基础规则之后追加 style1/2 专属作用域（`:global(.xagi-nav-style1/2) &`，(0,4,0)），style3 逐像素恢复原状（listPL 15 / 标题 x=26 / hover 隐藏时间均回归实测通过）。
3. **新增需求 ④**：style1/2 任务行「⋯」须贴行最右（hover 时间隐藏后原停在让位空位左侧）——`.more-btn` 从行内流改为绝对定位贴右缘 11px + top 50% 垂直居中（与单栏 compact 同款，锚点=`.conversation-item` 新增 relative）；触屏（hover:none）时间让位 margin 随之上提基础作用域。CDP 放大截图实证 ⋯ 贴右 11px 居中可见；style3 行为不变（compact 原有同款规则，base 上提后等价）。
4. **新增需求 ⑤**：style3 选中白卡与 hover 灰底不同占位（选中左右各外扩 5px）——删 `.conversation-item.compact.active` 的 `margin: 0 -5px` 与配套 padding/more-btn right:16px 覆盖，选中卡回落与 hover 同占位（实测选中/常规均 x=15/w=219）；三级阴影由列表 15px 侧 padding 承接不裁切。
   - 附带发现：style3 覆盖块对 `.conversation-list` 的 10px 声明实为死规则（同优先级靠后败），style3 任务列表实际一直按基础 15px 渲染——本次不动它，维持现状；后续若要真生效须挪到基础规则之后或提升优先级。
