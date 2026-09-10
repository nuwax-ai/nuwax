# 修复计划：主题风格进入网页应用开发详情后丢失（2026-09-10）

## 现象

用户主题里切回非单栏（style1 经典）后，进入网页应用开发详情（`/space/:spaceId/app-dev/:projectId`）会闪动，且导航被自动切成单栏（style3）。

补充反向场景：用户切到单栏（style3）后进入同一详情页，主题配置也会丢失并回到经典风格，导致详情页误走 `bare/fullscreen-page-container`，没有放进 `page-container`。

## 诊断（ego-browser 实测复现 + 代码链路实证）

1. **触发**：`src/services/common.ts:160`（umi request 拦截器）——任一接口返回业务码 `4010`（USER_NO_LOGIN）即执行 `localStorage.clear()`，用户主题配置 `xagi-user-theme-config`（含 `navigationStyleId:'style1'` 与切换标记）被整体清掉，随后 `redirectToLogin` 闪跳登录页（=「闪动」）。ACCESS_TOKEN 为 120s 短时 JWT，app-dev 页进入时请求密集，存在到期竞态，故偶发。
2. **翻转**：登录弹回后 `unifiedThemeService.loadConfiguration()` 用户层落空 → `loadTenantSettings()` 兜底，但 `normalizeTenantConfig` 按旧字段读取（`navigationStyleId`/`selectedThemeColor`/`selectedBackgroundId`），而管理端「主题配置」页 `handleSave` 保存的是新字段（`navigationStyle`/`primaryColor`/`backgroundId`/`layoutStyle`）→ `navigationStyle` 落到默认 **style3（单栏）**，主题色/背景也误回平台默认。
3. **二次清除（原修复遗漏）**：即使 4010 清理已经保住主题，短暂挂载登录页时 `src/pages/Login/index.tsx` 仍会无条件调用 `clearUserThemeConfig()`，再次单独删除用户主题配置。实测反向场景中 token 尚在但主题键消失，正是这条链导致 style3 回到经典布局，AppDev 随后误走 `bare`。
4. **实证**：经典 → 单栏场景复现现场内存态 `{navigationStyle:'style3', layoutStyle:'style1', primaryColor:'#5147ff', backgroundId:'', source:'tenant', timestamp:<租户模板 ts>}`；单栏 → 经典场景复现为 `xagi-user-theme-config` 消失、token 保留、AppDev 祖先变为 `fullscreen-page-container`。

## 修复

1. **保留主题偏好的认证清理**：新增 `src/utils/authStorageCleanup.ts`（`clearStoragePreservingThemePrefs`：clear 前暂存三键 `xagi-user-theme-config`/`xagi-global-settings`/`xagi-has-user-switch-theme`，clear 后原样恢复）；`common.ts` 4010 分支改用之。主题偏好与登录态无关，会话闪断重登不应销毁用户显式选择。显式退出登录（User/index.tsx）维持全清不动（可能切换账号，语义不同）。
2. **租户模板双格式兼容**：`unifiedThemeService.normalizeTenantConfig` 兼容新版字段（`primaryColor`/`backgroundId`/`layoutStyle(light|dark)`/`navigationStyle(布局类型)`），旧字段优先级不变——避免任何「用户层落空走租户兜底」的场景把导航风格误判为 style3、把租户主题色/背景误判为平台默认。
3. **登录页保护显式主题**：`Login` 初始化调用 `clearUserThemeConfig({ preserveExplicitChoice: true })`；存在 `xagi-has-user-switch-theme` 时不再二次删除主题。显式退出仍先执行 `localStorage.clear()`，不会被该保护误留账号主题。
4. **布局合同收口**：根布局的 route/style/mobile 三项分流收口为 `getSidebarShellLayoutPolicy`，锁定单栏桌面端 AppDev 详情必须返回 `variant: 'page'`，经典风格和移动端仍为 `bare`。

## 验收

- 新增单测：租户兜底双格式读取（v2 模板 → style1/租户色；旧模板行为不变）；清理工具保留三键；登录页保护显式选择；六个工作台路径及 AppDev 单栏容器策略。
- 浏览器复验：钉 style1 → 模拟配置被清 → 刷新 → 租户兜底呈 style1（而非 style3）。
- 浏览器反向复验：style3 首页 → SPA 进入真实 AppDev 详情，主题键及 token 均保留，DOM 祖先链为 `AppDev → #page-container-selector`，不再出现 `fullscreen-page-container`。
- `tsc` 触达文件零新增错误；vitest 新增用例全绿（本改动不触会话门禁路径）。
