# 实施计划：干预 dock 弹出期间全页模态化（侧栏/顶栏 inert）

- 对应 spec：无（禅道式口述 bug 单：ask-question dock 弹出时会话页其余区域仍可滚动/点击）
- 状态：已接受（用户 2026-09-17 报障 +「继续」推进修复）

## 背景与根因

- `.intervention-dock`（UnifiedChatSession/index.less）是 session-container 内 `position:absolute; inset:0; z-index:30` 的透明拦截层，只覆盖会话列。
- 实测（ego-browser，真实页 /home/chat/1693344/1596 dock 在挂）：
  - 会话列本身已被完全拦截（网格命中测试全落 dock；滚轮不滚消息区；祖先链无可滚容器）；
  - **泄漏面在遮罩外**：左侧栏会话列表（`conversation-list-wrapper`）真实滚轮 0→600 滚动成功，会话行、导航轨、顶栏均仍可点击/可聚焦——与 `aria-modal="true"` 的承诺矛盾。
- 会话页缓存（ConversationInstanceCacheSlot）以 `display:none` 保活后台会话：后台会话收到 ask 时 dock 在隐形子树里挂载，此时**不允许**锁可见页面。

## 方案

新增 `useInterventionPageInert(active, containerRef)`（与 `useInterventionDialogFocus` 配对：后者是 aria-modal 的键盘侧承诺，本钩子补指针侧）：

- 激活时从对话框宿主沿祖先链上溯到 body，把每一层「非对话框链旁支」的 element 子树置 `inert`（不可点/不可滚/不可聚焦，含原生滚动条拖拽）；
- 用 IntersectionObserver 门控可见性：dock 宿主不相交（display:none 保活、 only-input 隐藏）时不挂拦截，切回可见时 IO 触发补挂、切走时拆挂；
- 关闭/卸载时精确还原（只摘自己加的 inert，保留他方预置的 inert）；
- 环境无 IntersectionObserver（jsdom/旧内核）时退化为立即挂拦截。

不引入视觉遮罩、不改 z-index/stacking，零视觉回归面。

## 改动文件清单

| # | 文件 | 动作 | 说明 |
| --- | --- | --- | --- |
| 1 | `src/components/business-component/AgentIntervention/hooks/useInterventionPageInert.ts` | 增 | inert 旁支 + IO 可见性门控 |
| 2 | `src/components/business-component/AgentIntervention/hooks/useInterventionPageInert.test.tsx` | 增 | 单测（jsdom 需 IO stub） |
| 3 | `src/components/business-component/AgentIntervention/AgentInterventionChatLayer/index.tsx` | 改 | 调用钩子（active=queueItems.length>0，复用 dialogFocus.containerRef） |
| 4 | `src/components/business-component/AgentIntervention/AgentInterventionChatLayer/index.test.tsx` | 改 | 补 IO stub；新增「旁支被 inert」断言 |
| 5 | `src/components/business-component/AgentIntervention/README.md` | 改 | 模块结构表补该钩子一行 |

## 实施顺序

1. 钩子实现 + 单测（先行）
2. 接线层组件 + 存量测试补 stub
3. `npx vitest run`（触达路径）+ `npm run test:conversation` 全绿
4. ego-browser 复验：真实页侧栏滚/点被锁、卡片交互正常；mock 页（ASK_QUESTION）答题后侧栏恢复可交互

## 证明成立的测试

- 新增：钩子单测（arm 范围=祖先链旁支、链自身不 inert、隐藏不挂/恢复补挂、 cleanup 还原且保留预置 inert、无 IO 环境退化）。
- 回归：`npx vitest run` 全量 + `npm run test:conversation`（会话路径硬门）。

## 风险与回退

| 风险 | 缓解 | 回退方式 |
| --- | --- | --- |
| 后台保活会话收到 ask 锁死可见页 | IO 可见性门控（display:none 不相交即不挂） | 摘除钩子调用一行即回退 |
| antd 弹层容器（先于 arm 已存在的 body 直挂容器）被误 inert | antd v5 Popup 默认挂触发器父节点（卡片子树内，不在旁支）；Modal/Drawer 每次打开新挂容器 | 单测覆盖「保留预置 inert」语义；如有漏网按容器点名豁免 |
| 双会话实例同屏各挂干预互相 inert | 现网单一可见实例（缓存槽只显示一个）；双开属边缘，先到先得 | 记录偏离，后续按宿主仲裁 |

## 偏离记录

- **2026-09-17 需求方向反转（推翻本计划主体）**：首版按「弹窗应挡住页面」实现全页模态 inert（用户自行提交 e01576fb99），用户实测后定调相反——**弹窗不应挡页面**：消息区要能滚、进度胶囊要能点、左侧导航要能点。撤销 inert 钩子与接线（钩子文件删除、层测试还原），改为 `.intervention-dock` 宿主 `pointer-events: none` + 卡片子树（`> *`） `pointer-events: auto` 的纯 CSS 穿透，视觉布局零变化。焦点管理（聚焦入内/Tab 循环/还原）为既有行为，本次不动。
