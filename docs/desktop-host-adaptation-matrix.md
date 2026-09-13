# nuwax(PC Web) 桌面宿主适配梳理：浏览器 / 社区宿主 NuwaClaw / 商业宿主 Nuwax

- 记录日期：2026-09-13（收口提交 `4415954f1`）
- 适用范围：nuwax PC Web 对 Electron 桌面宿主的全部适配逻辑
- 姊妹篇：nuwax-client `docs/20260913-webview-loading-differences.md`（两版客户端加载 nuwax 的链路差异深潜）

## 一、产品规则（2026-09-13 定，唯一事实）

**nuwax 在社区宿主（NuwaClaw 客户端）中的行为与浏览器完全一致——不做沉浸退让、不做任何客户端特殊适配。这些逻辑仅商业宿主（Nuwax 客户端）启用。**

推论：nuwax 的世界只有两种形态——**浏览器式**（浏览器 + 社区宿主 + 旧宿主）与**商业桌面式**（商业宿主主窗口）。所有「桌面适配」的判定必须且只能落在这两态上。

## 二、判定原语（`src/utils/hostBridge/index.ts`，唯一收口）

| 原语 | 定义 | 合法用途 |
| --- | --- | --- |
| `hasHostBridge()` | 桥存在（社区/商业均真） | **仅环境/桥能力探测**（如 perf 可用性）；❌ 禁止做特性门控 |
| `host.getProduct()` | 宿主身份：`'nuwaclaw'`（社区）/ `'nuwax'`（商业）/ `'nuwawork'`（存量商业历史值）/ `null`（无桥或旧宿主无 host 命名空间） | 产品身份区分（先例：downloadCompletion） |
| `isDesktopHost()` | `getProduct() ∈ {nuwax, nuwawork}` | **桌面适配唯一合法门控**（本规则核心） |
| `isShellWindow()` | URL 带 `_shell=1`（sessionStorage 粘滞） | 独立窗口识别（仅商业宿主会开这种窗口） |
| `isImmersiveShell()` | `isDesktopHost() && !isShellWindow()` | 沉浸式避让/单栏布局类门控 |
| `isMac()` / `isWinLinuxShell()` / `needsTopRightAvoid()` | 平台几何判定 | 三键避让方向 |
| `shellAvoid` | `{TOP:36, CONTENT_TOP:28, RIGHT:130, TOOLBAR:44}` | 与商业壳 TrafficLightToolbar 几何**成对维护**的唯一事实源 |

降级基线：桥缺失 / host 命名空间缺失 / getProduct 抛错或非契约值 → 一律按浏览器行为（`null`/false）。**保守取向**：极老的商业宿主（无 host 命名空间）配新 web 也回落浏览器式；若需保留它们，把 `isDesktopHost` 反转为 `getProduct() !== 'nuwaclaw'` 即可，社区两种写法都正确。

## 三、行为矩阵（host 门控行为的现状盘点）

| 行为 | 门控 | 浏览器/社区宿主/旧宿主 | 商业宿主主窗口 | 代码位置 |
| --- | --- | --- | --- | --- |
| 沉浸避让 CSS（类 + 变量） | `isImmersiveShell()` | 不铺 | 铺（TOP/TOOLBAR/RIGHT） | `syncShellAvoidanceCss` + `wrappers/immersiveShellAvoid` |
| 单栏导航锁定 | `isDesktopHost()` | 不锁，双栏可切 | 锁定单栏 | `NavigationStylePanel` / `useUnifiedTheme` / `workbenchHistoryBase` |
| 右键另存图片 | `isDesktopHost()` + `native.saveImage` | 浏览器默认菜单 | 拦截并另存 | `OptimizedImage` |
| 企业登录入口 | `isDesktopHost()` + `auth.configureServerHost` | 不展示 | 展示（切域重载） | `pages/Login` |
| 主题推壳 | `isDesktopHost()` + `theme.syncTheme` | no-op | 壳原生 UI 跟随调色板 | `services/brandTheme` |
| 下载/另存走宿主 | `getProduct() === 'nuwax'`（**严格**，存量 nuwawork 也跳过） | 浏览器下载路径 | 宿主保存 | `utils/downloadCompletion` |
| 宿主命令（toggle-second-menu / new-task） | `events.onHostCommand` 注册成功与否 | 注册失败 no-op | 壳工具栏/⌘N 下发 | `services/hostBridgeEvents` |
| 二级菜单折叠同步 | `layout.setSecondMenu*` | no-op | 壳按钮态与 web 折叠态互同步 | `useSecondMenuShellSync` |
| 独立窗口分流 | `native.openWindow`（`SHELL_NEW_WINDOW_ROUTES` 当前**为空**） | `history.push` 页内导航 | 同左（全屏页已改主窗口内承载） | `utils/router.ts` |
| token 免登/登出联动 | `auth.*` | no-op（社区宿主每次重启重登） | 域级 token 双向同步 | `auth` 命名空间 |
| 语言推壳 | `i18n.syncLang` | no-op | 壳文案跟随 | i18n 初始化 |
| 性能打点 | `perf.*`（桥存在即可用） | 社区宿主也工作 | 工作 | `perf` 命名空间 |

女娲主题**不属于**桌面适配：纯配置驱动、浏览器同步（2026-09-04 起），三形态一致生效。

## 四、桥能力契约（`src/types/global.d.ts`）

新增宿主能力三步：**global.d.ts 补类型 → `hostBridge/index.ts` 封装（`?.` 守卫 + 失败降级）→ 业务方调用**。宿主侧实现落在基座仓（nuwax-ai/nuwa-electron-shell）：社区线 `community/main`（getProduct='nuwaclaw'，@01189cf0 起）与商业线 main 按产品各自实现命名空间；web 侧永远假设能力可能缺失。

## 五、维护规则（给后续 nuwax 改动立规矩）

1. **新桌面适配一律用 `isDesktopHost()` / `isImmersiveShell()`**，用 `hasHostBridge()` 做门控视为 bug（其文档注释已立纪律）。
2. `shellAvoid` 数值与商业壳顶行几何成对改——单侧改动必然错位。
3. 测试纪律：桌面适配用例的桥 mock 必须带 `host.getProduct`（见 `hostBridge/index.test.ts` 的 `commercialBridge()` 助手），并配社区宿主反例（getProduct='nuwaclaw' → 行为与浏览器一致）。
4. 产品身份消费优先 `isDesktopHost()`，不要散点比较 getProduct 字符串（downloadCompletion 的严格 `==='nuwax'` 是历史先例，新增勿仿）。

## 六、遗留决策点

- **auth 免登**：社区宿主是否移植 auth 桥（基座 community/main 侧）——不移植则社区用户每次重启重登。nuwax 侧无需改动（桥缺失自动降级）。
- **存量商业宿主兼容取向**：保守版当前生效（无 host 命名空间 → 浏览器式）；如需保留改为 `!== 'nuwaclaw'`。
