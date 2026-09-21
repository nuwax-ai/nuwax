# /agent/:agentId 标签纳入多实例保活

## Context

女娲应用页点"网页应用"跳 `/agent/:agentId`(AgentDetails → ConversationDetails)。侧栏标签链路已存在(openedAppTabs 已注册 /agent/:id 标签、与 user-app 共享 5 个上限、点击/关闭通用),但保活容器 OpenedAppTabsKeepAlive 正则只匹配 /user-app/:appId——agent 标签切换时页面卸载重载(loading 闪、接口重拉、预览 iframe 整页重载)。要求:agent 标签像 user-app 标签一样多实例保活,切回不重新加载。

三路只读调查 + 方案设计 agent 已验证可行性。核心结论:

- **路由/容器层完全同构**:/agent/:agentId(routes/index.ts:48)与 /user-app/:appId 同层级,SidebarShell variant 恒 'page',UserApp 空壳注册模式(容器渲染实例、路由出口 return null)可直接复制。
- **会话组件层天然多实例安全**:UnifiedChatSession 的队列/干预态/sessionView 每挂载一套,V2 渲染器零 useModel,messageList 是页面本地 state;此页不轮询不收流(发消息即跳 /home/chat,本页是"发起页")。
- **真正障碍是 ConversationDetails 页面层的 4 个全局单例**,必须实例化:
  1. `chat.pagePreviewData` 全局预览单槽(致命:B 实例挂载调 showPagePreview → A 的 PagePreviewIframe 收到新 uri → **A 的预览 iframe 整页重载成 B 的页面**)。全局槽被 Chat 页/MarkdownCustomProcess/EditAgent 等大量消费,**不能动全局槽本身**,只能让本组件实例化取值来源。
  2. `useOpenApp.openPaymentModal` 裸 boolean(B 弹窗会弹到 A 头上并触发 A 的套餐 effect)。
  3. `useOpenApp.appAgentDetail`+试用计数单槽(后写覆盖、计数归属错乱)——由"激活时重同步"修复。
  4. `conversationHistory.conversationListItem` 全局单份(侧栏历史显示成对方的)——由"激活时重拉"修复。
- 设计发现的两个额外坑:antd Modal/CopyToSpace 传送门渲染到 body,**display:none 拦不住,失活实例必须关弹窗**;runDetail 有 debounce 300ms,**切走后回包仍会写全局,onResultSuccess 的全局写入需 active 守卫**。

## 硬约束

- ConversationDetails 是共享组件(/app/:agentId 独立树也在用,BaseTemplate 依赖 useOpenApp 全局槽):**新增 prop 全部给安全默认值,不传时行为与现状逐字节一致**。
- 不动:UnifiedChatSession、chat model 全局槽本体、useOpenApp/conversationHistory model、openedAppTabs 标签链路、PagePreviewIframe、UserApp 侧、/app 树。
- 用户既有要求:不影响其他业务功能与交互。
- 会话域相关改动:test:conversation 必跑全绿。

## 改动清单

### 1. `src/models/appTabKeepAlive.ts` — 增 agent 渲染器槽

与现有 renderer 槽并列新增(互不影响):

```ts
export interface AgentTabInstanceProps {
  agentId: number;
  active: boolean;
}
export interface AgentDirectInstanceProps {
  agentId: number;
}
export interface AgentTabRendererPair {
  tab: React.FC<AgentTabInstanceProps>;
  direct: React.FC<AgentDirectInstanceProps>;
}
// model 内:agentRenderer state + registerAgentTabRenderer(prev ?? next,先注册者优先)
```

### 2. 新建 `src/components/business-component/ConversationDetails/usePagePreviewController.ts` — 预览状态实例化

无条件调 `useModel('chat')`(兼容既有测试 mock 与 /app 形态),**取值层三元选取**;两端 setter 均 useCallback/useState setter 恒稳,effect deps 不抖:

```ts
export interface PagePreviewController {
  pagePreviewData: PagePreviewData | null;
  showPagePreview: (data: PagePreviewData | null) => void;
  hidePagePreview: () => void;
}
export const usePagePreviewController = (
  instanceScoped: boolean,
): PagePreviewController => {
  const {
    pagePreviewData: g,
    showPagePreview: gs,
    hidePagePreview: gh,
  } = useModel('chat');
  const [localData, setLocalData] = useState<PagePreviewData | null>(null);
  const ls = useCallback((d) => setLocalData(d), []);
  const lh = useCallback(() => setLocalData(null), []);
  return instanceScoped
    ? { pagePreviewData: localData, showPagePreview: ls, hidePagePreview: lh }
    : { pagePreviewData: g, showPagePreview: gs, hidePagePreview: gh };
};
```

### 3. `src/components/business-component/ConversationDetails/index.tsx` — 实例域改造

- **新 prop(安全默认)**:`instanceScoped?: boolean = false`(预览/付费弹窗改实例自持)、`active?: boolean = true`(保活容器隐藏实例为 false)。
- **取值替换两处,其余零 diff**:
  - L117-118 预览三件套 → `usePagePreviewController(!!instanceScoped)`,下游 handleOpenPreview/workflowId/showCopyButton/右面板/卸载清理继续用同名标识符。
  - 付费弹窗:useOpenApp 解构改名加 `localOpenPaymentModal` state,`const openPaymentModal = instanceScoped ? local : global` 同名选取(header 订阅图标、套餐 effect、Modal 全部不用改)。/app 模式(instanceScoped=false)保留全局写入,BaseTemplate 不受影响。
- **onResultSuccess 全局写入加 active 守卫**(防切走后 debounce 回包踩全局+隐藏实例自动弹传送门弹窗):
  ```tsx
  if (result.paymentRequired && !result.subscribed) {
    if (active) setOpenPaymentModal(true);
  } else {
    setOpenPaymentModal(false);
  }
  if (active) handleSetAppAgentDetail(result);
  ```
  本地预览写入(handleOpenPreview)无需守卫——不可见时写本地无害,激活即现。
- **激活副作用三条**:
  1. 历史拉取 effect 并入 active:`deps [agentId, isAppSidebarMode, active]`,`!active` 早退(默认 true 与现状一致;切回重拉该 agent 最新历史)。
  2. 归属重同步:`wasInactiveRef` 守卫,仅"失活过再激活"执行 `handleSetAppAgentDetail(agentDetail)`(修全局归属+试用计数归属);首挂不双跑。
  3. 失活关弹窗:`active===false` 时 `setLocalOpenPaymentModal(false)` + `setOpenPageCopyModal(false)`(antd Modal/MoveCopy 传送门到 body,display:none 拦不住悬空)。
- **不加"激活时重跑 runDetail"**——切回不重载是需求核心;useLayoutEffect([agentId]) 每实例仅首挂一次,conversationId/草稿/预览随实例保留。

### 4. `src/pages/AgentDetails/index.tsx` — 路由组件空壳化(照 UserApp 模式)

```tsx
const AgentTabInstance: React.FC<AgentTabInstanceProps> = ({ agentId, active }) =>
  <ConversationDetails agentId={agentId} active={active} instanceScoped />;
const AgentDirectInstance: React.FC<AgentDirectInstanceProps> = ({ agentId }) => {
  const { skillInfo } = useSkillInfo();  // query 响应式消化(广场技能入口)
  return <ConversationDetails agentId={agentId} skillInfo={skillInfo} instanceScoped />;
};
const AgentDetails: React.FC = () => {
  const { registerAgentTabRenderer } = useModel('appTabKeepAlive');
  useEffect(() => { registerAgentTabRenderer({ tab: AgentTabInstance, direct: AgentDirectInstance }); }, [...]);
  return null;  // 防双实例双请求,渲染上移容器
};
```

标签入口从不带 skill query → tab 实例不接 skillInfo;直开实例也可能与标签实例并存(开过标签后又从广场进)→ **direct 也 instanceScoped**。

### 5. `src/layouts/SidebarShell/OpenedAppTabsKeepAlive.tsx` — agent 实例构建

- `AGENT_ROUTE_RE = /^\/agent\/(\d+)$/`;遍历 openedAppTabs 匹配生成 tab 实例(key=routePath,active=精确匹配当前路由)。
- 直连兜底:pathname 匹配 /agent/:id 且无激活标签实例 → direct 临时实例(key=`agent-direct:${pathname}`,**不含 search**——同路径换 query 不重挂,skillInfo 由 direct 渲染器响应式消化)。
- **skill query 让位规则**:`?skillId&skillName` 存在时,同路径标签实例 active=false(保持挂载不可见),direct 实例接管——防标签实例静默吞掉技能 query(回归现状行为)。
- user-app 实例逻辑不动;容器可见性 = 任一类实例激活;更新文件头注释(现写着"/agent/:id 类标签不进本容器"需改写)。

### 6. 测试(新建,放 tests/ 根与现有合同测试同位)

- `tests/appTabKeepAliveModel.test.tsx`:双槽默认 null、先注册者优先、两槽互不影响(model 纯 hook 不依赖 umi mock)。
- `tests/openedAppTabsKeepAlive.test.tsx`:mock umi useModel/useLocation + 假渲染器——agent 标签按 openedAppTabs 渲染、激活可见/其余 display:none;无标签直开生成 direct 实例;skill query 让位;user-app 回归;双槽 null 返回 null。
- `tests/conversationDetailsKeepAlive.test.tsx`:**复用 conversationDetailsRendererSelection.test.tsx 的整块 mock 脚手架**,PagePreviewIframe 替身捕获 props——默认形态合同不回归(全局 showPagePreview/handleSetAppAgentDetail/runHistoryItem 各一次);instanceScoped 下全局槽不被写、预览走本地;active false→true 重同步与历史重拉、首挂不双跑;失活关本地弹窗。

## 实施顺序

0. 把本计划存为 `plans/agent-tab-keepalive-plan.md`(plan-gate 工件)。
1. model 槽 → 2. usePagePreviewController → 3. ConversationDetails 改造(完成即跑合同测试确认默认形态零变化)→ 4+5. **AgentDetails 空壳化与容器扩展必须同一批次**(中间态 = agent 路由渲染 null 而容器不渲染,页面空白)→ 6. 补测试 → 7. 全量验证。

## 验证

```bash
npx vitest run tests/appTabKeepAliveModel.test.tsx tests/openedAppTabsKeepAlive.test.tsx \
  tests/conversationDetailsRendererSelection.test.tsx tests/conversationDetailsKeepAlive.test.tsx
npm run test:conversation        # 会话域回归(秒级)
npx tsc --noEmit                 # 改动路径零新增(全库预存错误不作门)
npm run lint:arch                # 分层禁令(新 hook 放 components,合法)
```

手测核心场景(dev server + 真实数据):

1. 双网页应用标签 A/B:A 开预览 → 开 B(B 预览独立)→ 切回 A,**A 预览未被 B 覆盖/清空、iframe 内导航位置保留、无 loading 闪**(Network 确认 apiPublishedAgentInfo 仅首开一次)。
2. agent↔user-app↔ 普通页混合互切;标签关闭销毁实例;5 上限拦截。
3. 付费智能体:自动弹订阅弹窗;**弹窗开着切走不悬空**;切回可重开;试用计数正确。
4. 无标签直开:广场技能(?skillId&skillName 提及项正常)、刷新 /agent/:id、专家页 ?params= 自动发消息、发消息后 POP 返回。
5. /app/:agentId 独立树全量回归(详情/发消息跳 /app/chat/BaseTemplate 侧栏与付费弹窗/chrome flags)。
6. AgentSidebar 切回后历史列表正确、点击跳 /home/chat;Chat 页消息内预览按钮(全局槽)不受影响。

## 已接受的限制(不在本期处理)

- previewPageTitle 全局标题两实例互写(纯展示,不可见实例无活动不写)。
- 开场白消息内若含"打开页面"类按钮(MarkdownCustomProcess 写全局槽),instanceScoped 下本页预览面板不响应——开场白为纯文本,实际不可达;消息驱动预览的主战场在 Chat 页(不走 instanceScoped)。
- AgentIntervention 回执 fallback 全局 model:此页 messageList 仅开场白+发消息即跳走,干预卡不可达。
- 激活重同步前的短暂窗口内全局归属属于旧实例——仅影响试用计数理论归属,展示无感知。
