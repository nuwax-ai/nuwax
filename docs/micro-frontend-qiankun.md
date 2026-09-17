# 通用微前端接入契约（umi 乾坤 / qiankun）

> 状态：v0（2026-09-17 随资料库试点 PoC 落地，dev 链路全通）
> 定位：主仓作为 **qiankun 宿主（master）** 的通用微前端接入规范。资料库（nuwax-repo-web）为首个试点；
> **未来新模块（信息类等子应用）按本文接入，不再另起方案。**
> 资料库专属契约见 [repo-web-integration.md](./repo-web-integration.md)（本文不替代它，只沉淀通用部分）。

## 0. 结论速览（试点实证）

| 验证项 | 结果 |
| --- | --- |
| 主站布局内嵌挂载（React18 宿主 + React19 子应用同文档共存） | ✅ |
| 登录态（同源 cookie `ticket`）与真实数据 | ✅ |
| SPA 内深链（`/repo/doc/:slugId`）+ 直达刷新 | ✅ |
| 浏览器前进/后退（popstate，qiankun≥2.4.6 默认 urlRerouteOnly） | ✅ |
| 路由卸载/重挂（切主站路由干净离场、切回正常重挂） | ✅ |
| 协作 WebSocket（经主站代理转发） | ✅（22 帧实测） |
| 样式共存（子应用 9.7k 行无前缀全局 CSS vs 主站 antd5） | ✅ 视觉走查无互踩（未开样式隔离，见 §5.3） |
| 非阻断观察项 | ⚠️ 2 项，见 §7 |

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

新应用 = 在 `apps` 数组追加一项 + 一条路由（§1.2）+ 一个稳定入口页（§1.3）。

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

## 2. 子应用（Vite 系）接入清单

以资料库为例（React19 + Vite8 + react-router7 库模式），共 5 项改造：

1. **插件**：`@tiny-codes/vite-plugin-qiankun`，`vite.config.ts` 注册 `qiankun('<appName>', { changeScriptOrigin: command === 'serve' })`。
2. **生命周期双模式入口**：一次性 `createRoot` 改为 `exportQiankunLifeCycles({ name, mount, unmount })` + 非 qiankun 环境兜底启动；unmount 时 `root.unmount()` 清理（实例：`src/main.tsx`）。
3. **base 对齐**：子应用 base（vite base / router basename）与主仓路由 path 前缀一致（如 `/repo`），三处硬编码不动。
4. **react-refresh 桩**：新增无 JSX 的 setup 模块并在 main.tsx **第一个 import**（实例：`src/qiankun-setup.ts`）。原因：preamble 落在 qiankun 沙箱 proxy，原生 ESM 组件读真实 window，检测不到即抛 "can't detect preamble" 崩溃。
5. **dev server**：固定端口（资料库 7100，新应用按 +10 递增避让）+ `cors: true`（宿主跨域拉 entry/模块）。

### 2.1 changeScriptOrigin 两档语义（关键坑）

插件把入口 module script 改写为 `import(prefix + src)`，`src` 自带 vite base（`/repo/...`）：

| 档位 | prefix | 适用 |
| --- | --- | --- |
| `true`（默认） | qiankun 注入的 `__INJECTED_PUBLIC_PATH_BY_QIANKUN__`（= entry 目录） | **dev**：entry 传子应用**根路径** `http://localhost:7100/`（vite 302 → `/repo/`，使 prefix=origin 不含 base）→ 模块直连子应用 server |
| `false` | 空串 | **build**：生产同源部署，src（`/repo/assets/...`）本身即正确地址 |

传错组合即 **`/repo/repo/...` 双重前缀 404**（试点首日实锤）。

### 2.2 dev 联调拓扑（双 server）

```
浏览器 ── 主站 umi dev(3001) ──┬─ /api/*、/repo/ws → testagent（业务命名空间，既有代理）
                              └─ 主站 SPA 路由 /repo/* → qiankun 容器
qiankun ── entry/模块 ──────── 子应用 vite dev(7100) 直连（CORS 已放行）
子应用 fetch（相对路径） ─────→ 落主站 origin → 走既有 /api/* 代理（同源 cookie 生效）
```

- **主站不要加 `/repo` 前缀代理**：会吞掉 `/repo-entry` 稳定入口（HPM 纯前缀匹配，试点实锤）；glob `/repo/**` 也不行（对带 `?v=` 查询的 vite deps URL 失配，实锤）；`^` 正则键在 umi compiled HPM 中不生效（实锤）。模块直连方案下根本不需要。
- **public/repo 静态产物会截胡**（serve-static 目录索引先于 proxy，webpack 内存 CopyPlugin 快照），qiankun dev 期间不要有 `public/<子应用>/` 产物；生产构建链再由 sync 产出。

## 3. 鉴权与上下文

- v0 维持**同源 cookie**（资料库 `ticket`，dev 桥镜像，契约 §2.2）；qiankun 下请求同源发起，cookie 天然携带，无需改造。
- v1（B 阶段）：`window.__NUWA_HOST__` 注入改为 qiankun `props` 透传（master apps[].props → 子应用 mount(props) 可读），结构沿用契约 §2.3。

## 4. 生产化步骤草案（PoC 通过后另起专项）

1. `sync:repo-web` 产 qiankun 化构建（插件 build 档 transformIndexHtml 会改写产物 index.html；`changeScriptOrigin:false` 下 src 自带 base 正确）。
2. 主仓 entry 环境切换（config 已按 NODE_ENV 写好）。
3. nginx `location /repo/ { try_files ... /repo/index.html; }`（既有 E3 项，深链直达=子应用整页兜底，与 SPA 内嵌双形态并存）。
4. CI 前置 sync（既有 E4 项）。
5. 子仓分支（`feat/qiankun-slave`）推送交对方 review 合入后 bump 主仓 submodule pin。

## 5. 风险登记

| # | 风险 | 现状/缓解 |
| --- | --- | --- |
| 1 | `@tiny-codes/vite-plugin-qiankun` 体量小（fork，上游已归档） | 试点实证可用；锁定精确版本，异常时回退链：@sh-winter fork → 手写非 module 入口 hack → wujie/micro-app（调研素材在会话记录） |
| 2 | qiankun 2.x 线停止演进（umIjs 插件锁 2.10.17-beta.0） | 现状可用；升级 qiankun 3 需绕开 umi 插件自接，暂不做 |
| 3 | 样式隔离未开（sandbox JS 隔离开、CSS 未隔离） | 试点视觉走查无互踩；子应用全局元素选择器（:root/body/button）与主站 antd5 共存风险在——新应用若样式互踩，再评估 experimentalStyleIsolation（注意 Vite dev 运行时注入样式不在其覆盖范围） |
| 4 | 双 React（宿主 18 + 子应用 19） | qiankun 沙箱隔离下共存实证 OK；体积代价子应用自担 |
| 5 | 子应用 HMR 在宿主内不可用 | 模块直连方案下 ws 升级仍不通；dev 调试可直开子应用 server（双模式入口保证独立可跑） |

## 6. 新应用接入模板（checklist）

- [ ] 子应用：装插件 + 双模式入口 + refresh 桩（照 §2，参考 nuwax-repo-web `feat/qiankun-slave` 分支 diff）
- [ ] 子应用：固定 dev 端口 + cors:true；base 与主仓路由前缀对齐
- [ ] 主仓：config apps[] 追加 + mountElementId:'root' 已有 + 路由 microApp + /xxx-entry 入口页
- [ ] 主仓：业务 API 命名空间加 dev 代理（照 config.development.ts 既有键）
- [ ] 验证：§0 清表走一遍（挂载/数据/深链/前进后退/卸载重挂/WS/视觉/副作用）

## 7. 试点观察项（非阻断，随 B 阶段消化）

1. **portal→doc 首跳 Maximum update depth ×~340**：栈在子应用 React 内部帧；reload 直达同文档 0 次、后续导航 0 次、功能正常。定性子应用内部路由切换期 effect 竞态，交子仓在 platform.ts 适配器（B1）阶段排查。
2. **document.title/favicon 被子应用改写**（打开文档时 title=文档名）：当前可接受；B 阶段 `__NUWA_HOST__` 落地时按 qiankun props 传入宿主回调接管。
3. **裸 `/repo` 直开 404**（无尾斜杠，vite 不重定向）：dev 边界；生产 nginx try_files 覆盖 `/repo/`，主站内导航均无尾斜杠 SPA 路由，不受影响。
