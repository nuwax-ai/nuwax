# 菜单嵌入内容保活方案：iframe 先行 · qiankun 同层演进

> 状态：**方案定稿，未动业务代码**（2026-09-21）评审节点：**2026-09-23 整体接入预览**（自动化提醒已建，当日 09:30）关联分支：`feat-dong.0930`（本方案）/ `feat/repo-web-qiankun`（qiankun POC，演进引用）

---

## 1. 需求与现状根因

「消息 / 资料库 / 生态市场 / 文档中心」等外链菜单，当前以 iframe 方式嵌入；后续将按 qiankun 框架接入（非 iframe）。需求：**用户初次进入后保持页面状态，切换导航再回来不重新初始化加载**。

> **范围更新（2026-09-21）**：qiankun 接入范围 = **资料库（repo-web，POC 已验证）+ 消息（新增业务范围，新版消息按同一契约接入）**；生态市场/文档中心等其余 iframe 菜单暂维持现状，由本方案 iframe 保活层先行覆盖。

### 1.1 现状链路

```
外链菜单（后端菜单树下发，path 含 http 且 openType=CurrentTab）
  → handleOpenUrl（DynamicMenusLayout/utils.ts:207）
  → buildOpenIframePath（utils.ts:118）拼 /open-iframe-page/:menuCode?url=...
  → history.push（普通路由跳转）
  → OpenIframePage（src/pages/OpenIframePage/index.tsx）渲染 <iframe>
```

### 1.2 重载根因（不是 bug，是链路必然）

`/open-iframe-page/:menuCode` 是 `/` 布局路由（`@/layouts`）下的**普通子路由**（`src/routes/index.ts:42-45`）。切走菜单时 react-router 交换 `<Outlet/>` 子元素 → `OpenIframePage` 整体 unmount → **iframe DOM 节点销毁** → 回来重新挂载、外部页面整页重载。

补充两个同类重载源：

- 两个不同 iframe 菜单互切（如 消息 ↔ 资料库）时组件不卸载，但 `location` 变化重跑 effect → `iframeUrl` state 变化 → 同一 iframe 的 `src` 属性被改写 → 浏览器仍整页加载新地址；
- 重复点击同一菜单 → `refreshOpenIframePath`（utils.ts:181）追加 `_refresh=Date.now()` → iframe `key` 变化强制重建。**这是「显式刷新」的有意语义，需保留**。

### 1.3 关键现状坐标（实施时直接对照）

| 内容 | 位置 |
| --- | --- |
| 主站路由注册 | `src/routes/index.ts:42-45`（`/open-iframe-page/:menuCode` → `@/pages/OpenIframePage`） |
| 独立应用壳路由（**不在本方案范围**） | `src/routes/index.ts:667-676`（`/app/open-iframe-page/:agentId`，BaseTemplate 壳，无主站布局） |
| iframe 渲染页 | `src/pages/OpenIframePage/index.tsx`（url 解析 23-29、`_refresh` key 18-21、iframe 148-157、生态市场 postMessage 代理 38-111） |
| 跳转/刷新构造 | `src/layouts/DynamicMenusLayout/utils.ts`（`buildOpenIframePath` 118、`parseOpenIframeLocation` 126、`refreshOpenIframePath` 181、`navigateOpenIframePath` 190、`handleOpenUrl` 207） |
| 布局宿主 | `src/layouts/index.tsx`（Layout → SidebarShell → page-container → `<Outlet/>`） |
| 内容区容器 | `src/layouts/SidebarShell/index.tsx:282-351`（contentNode，page/bare 双形态同构插槽，bug2487 保护）；`position:relative` 见 `src/layouts/index.less:51` |
| 登出/401 清理 | `src/utils/authStorageCleanup.ts`（`clearStoragePreservingUserPrefs`，调用方 `src/services/common.ts:167` 4010 分支） |
| 可复用保活蓝本 | `src/pages/Chat/components/ConversationInstanceCacheSlot.tsx`（常驻渲染 + display:none + store 差集卸载） |

---

## 2. 选型调研结论：keep-alive 插件路线已证伪（iframe 场景）

结论先行：**react-activation 与 keepalive-for-react 两大主流 keep-alive 库都无法保活 iframe，双方作者均在 GitHub issue 官方确认**。选型时勿再评估插件路线。

### 2.1 证伪证据（源码级核实，2026-09-21）

|  | react-activation | keepalive-for-react |
| --- | --- | --- |
| 缓存机制 | 内容节点 `appendChild` 移到 AliveScope 下 `display:none` 容器，激活再移回原位 | 缓存 div 非激活时整体 `node.remove()` 脱离文档，激活 `appendChild` 挂回 |
| iframe 后果 | issue **#97**（open 4 年+）作者原话：「对 iframe 标签进行的 dom 移位操作一律会引起刷新，但 keep-alive 功能必须进行 dom 移位。此问题暂未寻到修正方式，暂不修复」；另有 #358（2025-10，open） | issue **#53**（closed 但无库内修复）：用户实证「缓存组件中有 Iframe 就会导致 iframe 重新加载」，社区最终自建 display:none 解决 |
| 其他硬伤 | React 18 + `createRoot`（umi 4 正是）必须关 `autoFreeze` 并手动 context 修补（`autoFixContext`）；库已 16 个月未更新（0.13.4，2025-05） | React 18 只能用 4.x 老版本（5.x/6.x 仅支持 React 19.2+） |
| 维护/周下载 | 10,464/周（存量用户为主） | 5,019/周，两天前仍在发版，活跃 |

### 2.2 原理层根因

HTML 规范：**iframe 元素脱离文档即销毁其浏览上下文（browsing context：文档、JS 状态、滚动位置），重插必为全新加载**。WICG 的 iframe reparenting 提案（`moveBefore`）尚未普及（[WICG webcomponents#5484](https://github.com/WICG/webcomponents/issues/5484)）。因此 iframe 保活唯一可行路线 = **节点常驻原位 + `display:none` 隐藏**——两个库的 issue 区最终都收敛于此。

### 2.3 `display:none` 保活的可行性依据

- **重绘 ≠ 重载**：隐藏只是跳过布局与绘制，浏览上下文完整保留；重新显示浏览器只是把它画回来，无导航发生。隐藏期间浏览器节流内嵌页 rAF/定时器（类似后台标签页，反而省内存）。
- **项目内三处生产先例**：①`ConversationInstanceCacheSlot`（display:none + LRU）保活会话页预览 iframe 与 VNC iframe，有测试固化「切换只隐藏、淘汰才卸载」；②`ResizableSplit.rightHidden` prop 注释原文即「保持右侧子树挂载，但从布局中隐藏（用于 iframe / 终端实例保活）」；③AppDev `ContentViewer` visible/hidden 双容器常驻渲染预览 iframe。

### 2.4 两个连带决策

1. **会话缓存（ConversationInstanceCacheSlot / conversationPageCacheManager）不迁移插件**：其核心价值正是保活 iframe/VNC，插件 DOM 移动必致重载 = 功能回退；现有 display:none 形态即正确形态。未来若统一，方向是「普通组件走插件、iframe 走常驻宿主」双轨，另立任务（涉及会话路径硬质量门）。
2. **keepalive-for-react@^4.0.3 本期不引入**：仅在「非 iframe 普通路由页保活」场景有未来价值，本需求无消费者，避免死依赖。

---

## 3. 方案架构：菜单嵌入内容保活层（MenuEmbeddedKeepAlive）

一套宿主服务两个阶段：现阶段渲染 iframe；消息/资料库切 qiankun 后，同一宿主加微应用渲染分支，缓存语义不变。

```
Layout（持久，跨子路由切换不卸载，bug2487 已保护子树稳定）
└─ SidebarShell
   └─ page-container（position:relative 已有，index.less:51）
      ├─ MenuEmbeddedKeepAliveLayer  ← 新增保活宿主（absolute inset:0，与 children 并列）
      │   entry.type='iframe'（现阶段）/ 'micro-app'（qiankun 阶段，同一宿主）
      │   ├─ [ziliaoku]  display:none / 显示
      │   ├─ [message]    display:none / 显示
      │   └─ ...（LRU 上限 4，淘汰最久未访问且非激活条目）
      └─ <Outlet/>
          └─ OpenIframePage 改造为薄控制页（只驱动 store，不渲染 iframe）
```

### 3.1 生命周期语义

| 场景 | 行为 |
| --- | --- |
| 首次进入菜单 A | 薄控制页 mount → `activate('A', urlA)` → 宿主创建条目并显示 |
| 切走到其它页面（/home 等） | 薄控制页 unmount → `deactivate()`（仅标记非激活）→ A 的 iframe `display:none` **仍挂载，状态保留** |
| 切回菜单 A | 薄控制页 mount → `activate`（条目已存在且 url 未变，仅复活）→ 宿主切显示 → **iframe 不重载** |
| 菜单 A ↔ 菜单 B 互切 | 两个条目并存于宿主，各自 iframe 独立保活，display 切换 |
| 重复点击当前菜单 | `_refresh` 参数变化 → `reload(key)` → `reloadToken++` → iframe key 变化重建 = **显式刷新（保留现状语义）** |
| 第 5 个菜单打开 | LRU 淘汰最久未访问且非激活的条目 → 该 iframe 真正卸载 |
| 登出 / 4010 会话失效 | `invalidateAll()` → 全部条目卸载（鉴权与菜单配置已失效） |
| 菜单配置变更（同 code 不同 url） | 更新 url + `reloadToken++` → 重建（合理重载） |

### 3.2 三大重载诱因防护（方案成立的技术核心）

| 重载诱因 | 防护 |
| --- | --- |
| ① `src` 属性被改写 | iframe url 从 store entry 读取、**与路由 location 解耦**。不缓存 `OpenIframePage` 元素快照的原因：其内部 `useLocation`/`useEffect([location])` 会在隐藏期间收到 context 更新、读到其它页面 url 改写 src，保活失效 |
| ② DOM 节点被移动/移除 | 缓存条目**常驻渲染**（渲染位置与顺序稳定），React 同层复用节点，永不移动；宿主挂 SidebarShell 双形态**同构插槽**（见 4.4），跨断点形态切换也不卸载 |
| ③ React 重挂（key 变化/祖先卸载） | key 仅含 `menuCode + reloadToken`，只有显式刷新才递增；不引入任何会移动 DOM 的 keep-alive 插件（见 §2） |

---

## 4. 文件级实施清单（编码阶段执行，本次未动码）

### 4.1 新增 `src/layouts/MenuEmbeddedKeepAlive/store.ts`

单例发布订阅 store + `useSyncExternalStore` 绑定 hook（蓝本：`conversationPageCacheManager` 骨架，剔除会话特有逻辑——终态释放、草稿持久化、VNC exclusive）：

- entry 结构：`{ key: menuCode, type: 'iframe', url, reloadToken, lastAccessAt }`
- API：
  - `activate(key, url)`：新建/复活条目 + 更新 `lastAccessAt` + LRU 淘汰检查（激活项豁免）；url 变更时更新 url 并 `reloadToken++`
  - `deactivate()`：当前激活条目降级为缓存（不删除）
  - `reload(key)`：`reloadToken++`（`_refresh` 语义）
  - `invalidateAll()`：清空全部（登出）
- 容量：`MENU_EMBEDDED_CACHE_MAX_ENTRIES = 4`（常量；跨域 iframe 各占独立内存）
- **evict 钩子预留**：`onEvict((entry) => void)` 注册式监听，淘汰/清空时按 `entry.type` 分发——现阶段 iframe 无需处理（React 卸载即释放），qiankun 阶段在此调 `microApp.unmount()`
- 快照缓存：`getSnapshot` 返回缓存引用，emit 时失效（`useSyncExternalStore` 稳定性要求）
- 测试辅助 `resetForTest()`

### 4.2 新增 `src/layouts/MenuEmbeddedKeepAlive/index.tsx`（宿主）

- 订阅 store；`useLocation` + 复用 `parseOpenIframeLocation`（`DynamicMenusLayout/utils.ts:126`，纯函数可安全复用）判定激活 key
- 渲染：外层容器 `position:absolute; inset:0`（page-container 已 relative），**非激活态 `pointerEvents:'none'`**（空覆盖层会拦截下层页面点击）；每个 entry 一个常驻 div（`key=entry.key`、`data-cache-key`），`display: active ? 'block' : 'none'`，内层按 `entry.type` 分支渲染——现阶段仅 `'iframe'` 分支（`<iframe key={key + ':' + reloadToken} src={entry.url}>`）
- **生态市场 postMessage 代理迁移**：从 `OpenIframePage/index.tsx:38-111` 原样平移（来源校验 `e.origin === ecoWebOrigin` + fetch credentials 代理 + requestId 回传）；绑定条件收窄为「entry.url 的 origin === `tenantConfigInfo.ecoWebUrl` 的 origin」才绑（多实例下与原单实例行为等价：只有生态市场页会发这些消息）
- 监听登出清理事件（见 4.5）调用 `invalidateAll()`

### 4.3 改造 `src/pages/OpenIframePage/index.tsx`（拆双模）

- **`/app/open-iframe-page/:agentId` 独立应用壳链路：现有组件整体保留、零行为变更**（该路由在 BaseTemplate 壳下，不在 `/` 布局内，无保活宿主）——建议把现有实现收进 `OpenIframeAppShellPage` 子组件
- 新增主站薄控制页 `OpenIframeStationController`（默认导出按 `location.pathname.startsWith('/app/')` 分发）：
  - mount / menuCode·url 变化时 `activate(menuCode, url)`，cleanup 时 `deactivate()`（React 先 cleanup 后 effect，A→B 互切时序天然正确）
  - `_refresh` 监听：以 ref 记录首次运行跳过（挂载期带 `_refresh` 不触发刷新，与现状 `iframeKey || '0'` 等价）；后续 `_refresh` 值变化 → `reload(menuCode)`
  - 渲染 `null`（真实内容在布局层宿主里）

### 4.4 改 `src/layouts/SidebarShell/index.tsx`（挂载宿主）

`keepAliveLayerNode = useMemo(() => <MenuEmbeddedKeepAliveLayer />, [])` 稳定元素引用，插入 contentNode 的 **page / bare 两分支容器内、children 前的同一插槽位置**——variant 翻转（跨移动断点 768）时 React 按「同位置同类型」复用 DOM，宿主与其中 iframe 不重挂（对齐 bug2487「只换类名不换子树结构」手法）。bare 形态下宿主不可见（iframe 菜单路由恒为 page 形态），挂载仅为槽位稳定。

### 4.5 登出清理（CustomEvent 解耦，分层零新增）

- 新增 `src/constants/menuEmbeddedKeepAlive.constants.ts`：事件名常量（如 `MENU_EMBEDDED_CACHE_INVALIDATE = 'menu-embedded-cache:invalidate'`）
- `src/utils/authStorageCleanup.ts` 的 `clearStoragePreservingUserPrefs` 末尾 `window.dispatchEvent(new CustomEvent(...))`
- 宿主组件挂载时 `addEventListener` → `invalidateAll()`
- **为何走事件而非直接 import**：store 落位 `layouts/`，utils 层直接 import layouts 无先例（depcruise 虽无明文禁令，但分层方向不洁）；事件解耦让 utils/constants/layouts 各守其层，`lint:arch` 零新增违规

### 4.6 分层合规预核对（已对照 `.dependency-cruiser.cjs`）

- `layouts/MenuEmbeddedKeepAlive` → `layouts/DynamicMenusLayout/utils`：同层引用 ✓
- `pages/OpenIframePage` → `layouts/MenuEmbeddedKeepAlive/store`：pages→layouts，先例 `pages/Index`、`pages/Space` ✓
- `layouts/SidebarShell` → `layouts/MenuEmbeddedKeepAlive`：同层 ✓
- `utils` → `constants`、`layouts` → `constants`：均允许 ✓
- 不触会话域红线；循环依赖预检：`SidebarShell → MenuEmbeddedKeepAlive → DynamicMenusLayout/utils`，utils.ts 不反向引用 SidebarShell，无环 ✓

---

## 5. qiankun 同层演进路径（引用既有 POC 分支）

### 5.1 POC 坐标（`feat/repo-web-qiankun` 分支，成果已 cherry-pick 进 `origin/feat-2026.9.30`，当前开发分支未含）

| 项 | 内容 |
| --- | --- |
| 主应用注册 | `config/config.ts` 增 `qiankun.master.apps`：`name: 'nuwax-repo-web'`，entry dev `localhost:7100` / 生产同域 `/repo/`，显式 `mountElementId: 'root'`（防 master 插件默认改 `root-master`） |
| 路由挂载 | `/repo/*` → `microApp: 'nuwax-repo-web'`（umi @umijs/max qiankun master 插件路由级挂载 + `autoSetLoading`），通配承接子应用深链 `/repo/doc/:slugId` |
| 稳定入口页 | `src/pages/RepoWebEntry`（路由 `/repo-entry`）：SPA `<Navigate to="/repo">` + dev 桥（localStorage token 镜像同源 `ticket` cookie） |
| 子应用 | 独立仓 `feat/qiankun-slave@e598a00`，`@tiny-codes/vite-plugin-qiankun` 导出生命周期（qiankun 2.x 不能执行原生 ESM 入口） |
| 契约文档 | `docs/micro-frontend-qiankun.md`（在该分支）：明文「消息（新版本）等新模块按此接入，不另起方案」 |

### 5.2 衔接结论（保活视角的关键差异）

**POC 的路由级 `microApp` 挂载切走即卸载子应用——与 iframe 路由卸载同构，不保活。** 消息/资料库接入 qiankun 时若沿用路由级挂载，本需求的保活目标会原样复现。保活场景应采用：

```
宿主层手动挂载：loadMicroApp({ name, entry, container, props })
  → 容器 div 常驻宿主（与 iframe 同一插槽位）
  → deactivate 只 display:none，不 unmount
  → LRU 淘汰 / 登出清理时才 microApp.unmount()
```

与 POC 的 `qiankun.master.apps` 注册配置兼容，仅挂载方式不同。

### 5.3 演进清单（qiankun 接入时执行，宿主与缓存语义零改动）

接入对象：**资料库（`nuwax-repo-web`，POC 现成）+ 消息（新版业务，新增范围）**——两者注册形态相同，`qiankun.master.apps` 各加一项即可；消息的新子应用按 POC 同款生命周期导出。

1. store entry `type` 扩 `'micro-app'` + 子应用配置来源（菜单配置下发或前端映射，沿用 POC 注册形态）
2. 宿主加渲染分支：常驻容器 div + `loadMicroApp`（首次激活时 load，之后仅显隐）
3. evict 钩子接 `microApp.unmount()`
4. 薄控制页按菜单承载方式 activate 对应 type 条目；`_refresh` 语义映射为 `unmount + load`（重建）
5. **在 POC 契约文档 `docs/micro-frontend-qiankun.md` 补「保活挂载」一节**：路由级 `microApp` 不保活的差异说明 + 宿主层挂载规范（待该分支合入后）

---

## 6. 测试与验收标准（编码阶段执行）

单测（vitest，mock umi 的 `useLocation`/`useModel`，参考 `tests/conversation/conversationInstanceCacheSlot.test.tsx` 写法）：

- store：activate/deactivate 生命周期、LRU 淘汰顺序与激活豁免、reload 递增、url 变更重建、invalidateAll、evict 钩子触发
- 宿主：激活显示 / 非激活 display:none、淘汰差集卸载、reloadToken 变化重建 iframe、非激活态 `pointerEvents:'none'`、`/app/` 路径不受影响
- 薄控制页：mount/unmount 配对 activate/deactivate、`_refresh` 变化触发 reload、挂载期带 `_refresh` 不触发

门禁：`npx vitest run` 相关文件全绿；`npm run lint:arch` 零新增；触达文件 tsc 零新增（改动含 layouts 共享壳，跑一次 `npm run test:conversation` 确认无连带破坏）。

浏览器走查（ego）五场景：① 菜单 A→B→A iframe 不重载（内嵌页滚动/输入状态保留）② 重复点击刷新仍生效 ③LRU 第 5 个打开后最旧被卸载 ④ 登出后缓存清空 ⑤ 生态市场页内 postMessage 请求代理仍通。

---

## 7. 时间线

| 日期 | 事项 |
| --- | --- |
| 09-21 | 方案定稿（本文档），未动业务代码；自动化提醒已建 |
| 09-23（后天）09:30 | **整体接入预览**：基于本文档评审——iframe 保活架构演示讲解 + 结合 POC 分支讲 qiankun 同层演进路径（接入范围：资料库 + 消息业务） |
| 预览评审通过后 | 按 §4 清单编码 → §6 测试门禁 → 走查 → 提测 |

## 8. 风险与边界

- **隐藏期间节流**：display:none 期间浏览器节流内嵌页 rAF/定时器（类后台标签页，省内存）；个别强响应式页面可能因隐藏态视口变化做一次内部重排、显示时恢复（**重排 ≠ 重载**）；若个别目标页面敏感，该条目可换「保留布局的隐藏」（visibility + 位移出视口），架构不变
- **内存**：隐藏 iframe 常驻有开销，LRU 4 封顶
- **首帧空白**：首次进入比现状多一拍（activate 异步通知宿主），与现状 effect 解析 url 的空白拍相当
- **`/app` 壳链路**：明确不在本方案范围，双模拆分时零行为变更
- **插件依赖**：不引入（§2 证伪）；后续非 iframe 普通路由页保活需求可评估 keepalive-for-react@4.x（React 18 线）

---

## 附录：调研证据链接

- [react-activation issue #97 【暂无法修复】iframe 无法保持状态](https://github.com/CJY0208/react-activation/issues/97)
- [react-activation issue #358 在页面有 Iframe 的情况下会触发 Reload](https://github.com/CJY0208/react-activation/issues/358)
- [keepalive-for-react issue #53 缓存组件含 Iframe 时重新加载](https://github.com/finedaybreak/keepalive-for-react/issues/53)
- [WICG: Reparenting iframes without reloading（moveBefore 提案）](https://github.com/WICG/webcomponents/issues/5484)
- keepalive-for-react 源码 `packages/core/src/components/CacheComponent`（`node.remove()` + `appendChild` 实证）
