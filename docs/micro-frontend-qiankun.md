# 通用微前端接入指南（umi 乾坤 / qiankun）

> 状态：v1（2026-09-17 方案验收通过；接入启动待资料库与消息（新版本）稳定，约 09-22）
> 定位：主仓作为 **qiankun 宿主（master）** 的通用微前端接入指南。资料库（nuwax-repo-web）为首个试点；
> **消息（新版本）等新模块按本文接入，不另起方案。**
> 部署策略（已定）：**主站与全部子应用部署在同一台静态资源服务器上，按目录区分**（详见 §5）。
> 资料库专属契约见 [repo-web-integration.md](./repo-web-integration.md)（本文不替代它，只沉淀通用部分）。

## 导读（按角色）

- **子应用接入方同学**（资料库/消息团队）：看 §2（五步改造）→ §3（本地验证）→ §6（联调验收），照抄代码模板即可；生产部署不用你们操心（§5 由主仓/运维统一处理）。
- **主仓侧**：看 §1（三件套）→ §4（联调拓扑）→ §5（部署）。
- **评审/架构**：看 §0（结论）与 §7（风险）。

## 0. 结论速览（试点实证）

| 验证项 | 结果 |
| --- | --- |
| 主站布局内嵌挂载（React18 宿主 + React19 子应用同文档共存） | ✅ |
| 登录态（同源 cookie `ticket`）与真实数据 | ✅ |
| SPA 内深链（`/repo/doc/:slugId`）+ 直达刷新 | ✅ |
| 浏览器前进/后退（popstate，qiankun≥2.4.6 默认 urlRerouteOnly） | ✅ |
| 路由卸载/重挂（切主站路由干净离场、切回正常重挂） | ✅ |
| 协作 WebSocket（经主站代理转发） | ✅（22 帧实测） |
| 样式共存（子应用 9.7k 行无前缀全局 CSS vs 主站 antd5） | ✅ 视觉走查无互踩（未开样式隔离，见 §7-3） |
| 非阻断观察项 | ⚠️ 2 项，见 §8 |

**兼容性前提（为什么这么接）**：主仓 @umijs/max 4.6.75 内置 qiankun master 插件（锁 qiankun 2.10.17-beta.0，2.x 线）。qiankun 2.x **不能执行原生 ESM 入口**（module script 被降级为 classic eval 直接语法错误），因此 Vite 子应用必须经 `@tiny-codes/vite-plugin-qiankun`（原版插件 2025-02 已归档、无 Vite8 适配；该 fork 声明 vite>=8，试点实证可用）。qiankun 3.x（rc）官方支持 Vite ESM 但 umi 插件锁 2.x，不走。

## 1. 主仓（宿主）接入三件套

### 1.1 应用注册表 `config/config.ts`

```ts
qiankun: {
  master: {
    apps: [
      {
        // 三个 name 必须完全一致：此处、路由 microApp 字段、子应用插件注册名
        name: 'nuwax-repo-web',
        // dev：子应用 vite dev server 根路径（不含 base！见 §2.2 说明）；生产：同域静态产物
        entry: process.env.NODE_ENV === 'development' ? 'http://localhost:7100/' : '/repo/',
      },
    ],
  },
},
// master 插件默认把挂载根 id 改为 root-master，显式钉回主站 #root
mountElementId: 'root',
```

新应用 = 在 `apps` 数组追加一项 + 一条路由（§1.2）+ 一个稳定入口页（§1.3）。**name/base/目录/dev 端口四要素先在 §5.2 约定表登记再动工。**

### 1.2 路由挂载 `src/routes/index.ts`

```ts
{
  path: '/repo/*',              // 通配承接子应用深链；react-router 实测 /repo/* 可匹配裸 /repo
  microApp: 'nuwax-repo-web',   // 对应 apps[].name
  microAppProps: { autoSetLoading: true },  // 仅 JSON 可序列化值（编译期字符串化）
},
```

- 路由放在 layouts children 内 = **主站侧栏常驻的布局内嵌形态**（试点定调：保留子应用自身侧栏，形成两级导航；后续要隐藏子侧栏属子仓改造）。
- umi 路由层经 `loadMicroApp` 挂载（非 activeRule 注册），URL 由 umi React Router 与子应用 router 各自 basename 协同，无需 extra 配置。

### 1.3 稳定入口页模式

每个子应用保留一个 `/xxx-entry` 稳定入口（菜单配置永不变更），实现 = dev 桥（如资料库 ticket cookie 镜像）+ SPA `<Navigate to="/xxx">`。形态演进只改这个页面（资料库实例：`src/pages/RepoWebEntry`，v0 整页重定向 → 现 SPA 跳转）。

## 2. 子应用接入方实操（Vite 系，五步）

以资料库为参照实现（独立仓 `nuwax-repo-web` 的 `feat/qiankun-slave` 分支，4 个文件的 diff 可直接对照抄）。示例假设你的子应用叫 `msg`、基路径 `/msg/`、dev 端口 7110。

### 第 1 步：装插件

```bash
pnpm add -D @tiny-codes/vite-plugin-qiankun
```

### 第 2 步：`vite.config.ts` 注册插件

```ts
import qiankun from '@tiny-codes/vite-plugin-qiankun'

// qiankun 子应用名：vite 插件、main 入口的 exportQiankunLifeCycles、
// 宿主 qiankun.master.apps[].name 三处必须一致。约定 = 仓库名。
export const QIANKUN_APP_NAME = 'nuwax-msg-web'

export default defineConfig(({ command }) => ({
  // 基路径：与宿主路由前缀、部署目录一致（三处同步，见 §5.2）
  base: '/msg/',
  plugins: [
    react(),
    // changeScriptOrigin 按 serve/build 两档取值（勿改，原因见 §2.1）
    qiankun(QIANKUN_APP_NAME, { changeScriptOrigin: command === 'serve' }),
  ],
  server: {
    port: 7110,   // 在 §5.2 约定表登记的固定端口
    cors: true,   // 宿主跨域拉 entry/模块必须放行
  },
}))
```

### 第 3 步：入口改生命周期双模式

`src/main.tsx`（或你的入口文件）：一次性 `createRoot` 改为「qiankun 生命周期 + 独立运行兜底」双模式，其余业务初始化逻辑（如资料库的 `initTreeBroadcast()`）原样保留：

```tsx
// qiankun-setup 必须保持第一个 import（见第 4 步）
import './qiankun-setup'
import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { qiankunWindow, exportQiankunLifeCycles } from '@tiny-codes/vite-plugin-qiankun'
import './index.css'
import App from './App.tsx'

const QIANKUN_APP_NAME = 'nuwax-msg-web'  // 与 vite.config.ts 一致

let root: Root | null = null

function render(container?: HTMLElement) {
  // qiankun 挂载时容器由宿主注入；独立运行落本应用 #root
  const el = container ?? qiankunWindow.document.getElementById('root')!
  root = createRoot(el)
  root.render(
    <StrictMode>
      {/* basename 与 base 同步；useTransitions 保持你们现状 */}
      <BrowserRouter basename="/msg">
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
}

exportQiankunLifeCycles({
  name: QIANKUN_APP_NAME,
  mount: (props) => render(props.container),
  unmount: async () => { root?.unmount(); root = null },
})

// 非 qiankun 环境（独立运行）一次性启动
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
```

### 第 4 步：react-refresh 沙箱桩（React + @vitejs/plugin-react 必需）

新建 `src/qiankun-setup.ts`（**不得包含 JSX**，否则自身会被注入 refresh wrapper 早于本文件执行）：

```ts
/**
 * qiankun 宿主内嵌时的 react-refresh 兼容桩（dev only）。
 * preamble（注册 $RefreshReg$/$RefreshSig$）由入口 HTML 的 classic script 执行——qiankun
 * 沙箱下落到 window.proxy；而组件模块经原生 ESM 加载、读真实 window，缺桩即抛
 * "@vitejs/plugin-react can't detect preamble" 导致渲染崩溃。
 * 独立运行时 preamble 已在真实 window 注册，不触发；生产无 refresh 注入，不触发。
 */
if (import.meta.env.DEV && typeof (window as any).$RefreshSig$ === 'undefined') {
  ;(window as any).$RefreshReg$ = () => {}
  ;(window as any).$RefreshSig$ = () => (type: unknown) => type
}
```

并在 main.tsx **第一个 import**（ESM 求值按 import 顺序，必须先于一切组件模块）。

### 第 5 步：验证独立运行不受影响

`pnpm dev` 直开 `http://localhost:7110/msg/`，行为应与改造前完全一致（双模式入口的兜底分支）。**独立可跑是硬要求**——不依赖宿主也能开发调试。

### 2.1 changeScriptOrigin 两档语义（关键坑，理解但勿改）

插件把入口 module script 改写为 `import(prefix + src)`，`src` 自带 vite base（`/msg/...`）：

| 档位 | prefix | 适用 |
| --- | --- | --- |
| `true`（默认） | qiankun 注入的 `__INJECTED_PUBLIC_PATH_BY_QIANKUN__`（= entry 目录） | **dev**：宿主 entry 传子应用**根路径** `http://localhost:7110/`（vite 302 → `/msg/`，使 prefix=origin 不含 base）→ 模块直连子应用 server |
| `false` | 空串 | **build**：生产同源部署，src（`/msg/assets/...`）本身即正确地址 |

传错组合即 **`/msg/msg/...` 双重前缀 404**（试点实锤）。所以 vite.config 里写死 `command === 'serve'`，宿主 entry 按 §1.1 写死环境切换，两侧勿手工改。

## 3. 子应用侧自查清单

- [ ] 插件注册名 / main 导出名 / 宿主 apps[].name 三处一致
- [ ] base / router basename / 部署目录三处一致（§5.2）
- [ ] qiankun-setup.ts 是 main.tsx 第一个 import 且无 JSX
- [ ] dev 固定端口 + `cors: true`
- [ ] API 请求用**相对路径**（同源落宿主域，登录 cookie 天然携带；勿写绝对地址）
- [ ] unmount 干净：WS/定时器/全局监听在组件卸载时清理（宿主切路由会频繁 mount/unmount）
- [ ] `pnpm dev` 独立运行与改造前一致
- [ ] 避免直接改 `document.title`/favicon（宿主与子应用会互踩；如业务需要，后续经 `__NUWA_HOST__` 回调接管——B 阶段）

## 4. dev 联调拓扑（双 server）

```
浏览器 ── 主仓 umi dev(3001) ──┬─ /api/*、子应用 WS 命名空间 → testagent（业务代理，config.development.ts）
                              └─ 主站 SPA 路由 /repo/* → qiankun 容器
qiankun ── entry/模块 ──────── 子应用 vite dev(7100/7110/…) 直连（CORS 已放行）
子应用 fetch（相对路径） ─────→ 落主站 origin → 走既有业务代理（同源 cookie 生效）
```

- **主仓不要加子应用路径前缀的 HTTP 代理**：会吞掉 `/xxx-entry` 稳定入口（HPM 纯前缀匹配）；glob `/repo/**` 对带 `?v=` 查询的 vite deps URL 失配；`^` 正则键 umi compiled HPM 不生效（三连实锤）。模块直连方案根本不需要。
- **主仓 dev 端口**：`.env` 钉死 `PORT=3000`，被占时 umi 自动顺延（当前 3001）；换端口须改 `.env`。
- **qiankun dev 期间主仓勿留 `public/<子应用>/` 产物**：serve-static 目录索引会截胡该路径的文档请求（webpack 内存还有 CopyPlugin 快照，移除后需重启 dev server）。
- 子应用 HMR 在宿主内不可用（ws 升级不通），改代码后刷新页面即可；深度调试直开子应用自己的 dev server。

## 5. 部署策略（已定：同一静态资源服务器，按目录区分）

### 5.1 形态

主站与全部子应用**部署在同一台 nginx/静态资源服务器**，按 URL 目录划分——

```
服务器静态根/
├── (主站 umi 产物：index.html、umi.js、…)      ← /
├── repo/   (资料库 vite 产物：index.html、assets/…)  ← /repo/
└── msg/    (消息新版产物，接入时按 §5.2 定名)         ← /msg/
```

**与 v0（submodule 整页挂载）的部署物形态完全相同**——qiankun 化不改变部署拓扑，只多两件事：
1. 子应用产物 index.html 经插件的 build 档改写（`changeScriptOrigin:false`，script src 自带 `/repo/` base 即正确地址）；
2. 主站产物内含 qiankun master 运行时（umi 插件自动打入）。

主站构建时把子应用产物放进 `dist/<base>/`（资料库现状由 `npm run sync:repo-web` 落位 `public/repo/` → `dist/repo/`；消息接入时按同款脚本化），部署侧仍是**一个 dist 一次发布**。

### 5.2 约定登记表（新应用接入前先在此占位，三处一致）

| 子应用 | qiankun name | base / 部署目录 | dev 端口 | 稳定入口 | 产物落位脚本 |
| --- | --- | --- | --- | --- | --- |
| 资料库 | `nuwax-repo-web` | `/repo/` | 7100 | `/repo-entry` | `sync:repo-web`（既有） |
| 消息（新版本） | `nuwax-msg-web`（暂定，接入时定稿） | `/msg/`（暂定） | 7110 | `/msg-entry`（暂定） | 接入时按 sync:repo-web 模式脚本化 |

### 5.3 nginx 配置（每加一个子应用加一段 location）

```nginx
# 主站 SPA（既有）
location / {
  try_files $uri $uri/ /index.html;
}

# 子应用：静态产物 + history 路由深链回退（缺这段深链刷新 404）
location /repo/ {
  try_files $uri $uri/ /repo/index.html;
}
location /msg/ {   # 新应用照抄一段
  try_files $uri $uri/ /msg/index.html;
}
```

- 深链直达（直接开/刷新 `https://host/repo/doc/xxx`）= 子应用**独立整页**打开（v0 行为并存，双模式入口兜底）；站内导航（`/repo-entry` → SPA 跳转）= 布局内嵌。两形态并存是设计内行为。
- 业务 API / WS 走既有网关（`/api/*`、资料库 `/repo/ws`），不经过本静态服务器，nginx 无需额外规则。

### 5.4 发布顺序

先发子应用产物、再发主站（主站 qiankun entry 指向 `/repo/` 产物，新产物先到 = 旧主站不受影响；反向则可能拉到不存在的 entry）。回滚同理反向。

## 6. 联调验收清单（主仓+子应用一起过）

1. 起服务：子应用 `pnpm dev`（各自端口）+ 主仓 `npm run dev`（3001）
2. 浏览器登录主站 → 访问 `/<base>-entry` → 应 SPA 跳转到 `/<base>` 且：主站侧栏常驻 + 内容区渲染子应用 + 真实数据加载（登录态同源 cookie）
3. 子应用内导航/深链（含刷新直达）→ URL 正常、浏览器前进/后退正常
4. 切主站其他路由 → 子应用卸载干净；切回 → 重挂正常
5. 子应用的 WS/编辑器等重功能抽测
6. 视觉走查：布局无错位、无样式互踩、无 console 报错（主站预存告警除外）

## 7. 风险登记

| # | 风险 | 现状/缓解 |
| --- | --- | --- |
| 1 | `@tiny-codes/vite-plugin-qiankun` 体量小（fork，上游已归档） | 试点实证可用；锁定精确版本，异常时回退链：@sh-winter fork → 手写非 module 入口 hack → wujie/micro-app（调研素材在会话记录） |
| 2 | qiankun 2.x 线停止演进（umi 插件锁 2.10.17-beta.0） | 现状可用；升级 qiankun 3 需绕开 umi 插件自接，暂不做 |
| 3 | 样式隔离未开（sandbox JS 隔离开、CSS 未隔离） | 试点视觉走查无互踩；新应用若样式互踩，再评估 experimentalStyleIsolation（注意 Vite dev 运行时注入样式不在其覆盖范围） |
| 4 | 双 React（宿主 18 + 子应用 19） | qiankun 沙箱隔离下共存实证 OK；体积代价子应用自担 |
| 5 | 子应用 HMR 在宿主内不可用 | dev 调试直开子应用自己的 server（双模式入口保证独立可跑） |
| 6 | 主仓 dev 端口顺延不确定性 | `.env PORT=3000` + 占用顺延；联调文档统一写 3001，端口漂移时以 dev 启动日志为准 |

## 8. 试点观察项（非阻断，随 B 阶段消化）

1. **portal→doc 首跳 Maximum update depth ×~340**：栈在子应用 React 内部帧；reload 直达同文档 0 次、后续导航 0 次、功能正常。定性子应用内部路由切换期 effect 竞态，交子仓在 platform.ts 适配器（B1）阶段排查。
2. **document.title/favicon 被子应用改写**（打开文档时 title=文档名）：当前可接受；B 阶段 `__NUWA_HOST__` 落地时按 qiankun props 传入宿主回调接管。
3. **裸 `/repo` 直开**（无尾斜杠）落 `public/repo` 旧产物整页（dev）；生产 nginx try_files 覆盖 `/repo/`，主站内导航均 SPA 路由，不受影响。

## 9. 后续（生产化专项，接入启动时做）

1. `sync:repo-web` 产出 qiankun 化构建（插件 build 档自动改写产物 index.html）——脚本无需大改，验证产物即可。
2. 主仓 entry 环境切换（config 已就位，§1.1）。
3. nginx §5.3 / CI 前置 sync（= 既有 roadmap E3/E4 项）。
4. 消息（新版本）按本文 §2+§5.2 接入。
