/**
 * nuwax → nuwaclaw 桌面宿主的统一对外接入层。
 *
 * 这里是 nuwax 侧对 window.NuwaClawBridge 的**唯一收口**：所有面向 nuwaclaw
 * 原生宿主的调用（鉴权态同步、原生能力）都走本模块，业务方不再直接碰
 * window.NuwaClawBridge。与 perfTracker 同范式——集中处理「浏览器环境/桥未注入」
 * 守卫与失败降级，让调用点保持干净（无散点 ?. 与 try/catch）。
 *
 * 新增宿主能力时：先在 global.d.ts 补类型，再在此封装，最后由业务方调用。
 */

type NuwaClawBridgeLike = NonNullable<Window['NuwaClawBridge']>;

function getBridge(): NuwaClawBridgeLike | undefined {
  return typeof window !== 'undefined' ? window.NuwaClawBridge : undefined;
}

/**
 * 是否运行在 nuwax 平台桌面宿主中（宿主桥已注入，社区/商业均真）。
 * ⚠️ 仅用于环境/桥能力探测（如 perf 打点可用性）；**桌面适配（沉浸退让、
 * 单栏锁定、原生右键另存、企业登录入口等）一律用 isDesktopHost() /
 * isImmersiveShell()**——产品规则（2026-09-13）：社区宿主（NuwaClaw 客户端）
 * 与浏览器同形态，这些逻辑仅商业宿主启用。
 */
export function hasHostBridge(): boolean {
  return !!getBridge();
}

/**
 * 是否为经 native.openWindow 新开的独立窗口（URL 带 _shell=1 标记，由宿主追加）。
 * 独立窗口带系统标题栏（无沉浸式工具栏浮层），沉浸式专属布局不适用。
 *
 * 标记在 sessionStorage 内粘滞：窗口首次带 _shell=1 打开后，SPA 内部路由/
 * 登录重定向会重写 URL 丢掉 query，但「独立窗口」是窗口级事实，不应随路由翻转
 * （否则跳一页就误回沉浸式避让布局）。sessionStorage 按窗口隔离、随窗口关闭失效，
 * 恰好对应宿主窗口生命周期。
 */
const SHELL_WINDOW_SESSION_KEY = 'nuwax:shell-window';

export function isShellWindow(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (new URLSearchParams(window.location.search).get('_shell') === '1') {
      try {
        window.sessionStorage.setItem(SHELL_WINDOW_SESSION_KEY, '1');
      } catch {
        /* sessionStorage 不可用（隐私模式等）时退化为仅看 URL */
      }
      return true;
    }
    return window.sessionStorage.getItem(SHELL_WINDOW_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * 是否运行在承载桌面适配的宿主中——**仅商业版 Nuwax 客户端**。
 * 产品规则（2026-09-13）：社区宿主（NuwaClaw 客户端，getProduct()='nuwaclaw'）
 * 与浏览器同形态——不做沉浸退让、不做任何客户端特殊适配；这些逻辑仅商业
 * 宿主（'nuwax'；存量宿主历史值 'nuwawork'）启用。旧宿主无 host 命名空间
 * 时视为无桌面适配（回落浏览器行为）。
 */
export function isDesktopHost(): boolean {
  const p = getBridge()?.host?.getProduct?.();
  return p === 'nuwax' || p === 'nuwawork';
}

/**
 * 是否为商业宿主主窗口的沉浸式形态（商业桌面端且非独立窗口）。
 * 菜单避让/隐藏 logo 等沉浸式专属门控一律用本判定；桌面独立窗口返回 false，
 * 恢复浏览器式布局（系统标题栏已承担顶部空间，无需避让）；社区宿主与
 * 浏览器恒为 false（见 isDesktopHost 产品规则）。
 */
export function isImmersiveShell(): boolean {
  return isDesktopHost() && !isShellWindow();
}

/**
 * 是否 macOS 平台（浏览器 / mac 壳均算）。
 * 判定写法与 nuwaclaw 壳 TrafficLightToolbar 保持同款，保证两侧一致——
 * 「壳画自绘窗口三键的场合」恰好是「guest 需右上避让的场合」。
 */
export function isMac(): boolean {
  return typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
}

/**
 * 是否 Windows/Linux 沉浸式主窗口：右上角有壳自绘的窗口控制三键（CtrlButton）。
 * 右上角浮层避让（登录页语言切换等）与主内容区顶部避让（page-container）
 * 均以此判定；mac 壳红绿灯在左上（菜单列另行避让）、独立窗口带系统标题栏、
 * 浏览器无壳，均 false。
 */
export function isWinLinuxShell(): boolean {
  return isImmersiveShell() && !isMac();
}

/**
 * 是否需要右上角避让：右上角浮层让位壳自绘三键（CtrlButton）。
 */
export function needsTopRightAvoid(): boolean {
  return isWinLinuxShell();
}

/**
 * 壳层沉浸式 UI 避让尺寸：与 nuwaclaw 壳 TrafficLightToolbar 的自绘布局对应，
 * 壳侧改版时同步维护这里——两侧布局避让的唯一事实来源，避免散点魔法数。
 */
export const shellAvoid = {
  /** 壳内一级/二级菜单顶部下移量；mac 保持原有红绿灯避让，Win/Linux 对齐加高的顶行。 */
  get TOP() {
    return isMac() ? 36 : 40;
  },
  /**
   * Win/Linux 内容区（page-container）顶部避让：与壳顶行同高，
   * 使内容区圆角从顶行下沿开始，也避免顶行覆盖内容区交互。
   */
  CONTENT_TOP: 40,
  /** Win/Linux 自绘三键贴死右上角（40×3=120px）：右上角浮层避让宽度（含间隙）。 */
  RIGHT: 130,
  /** 沉浸工具栏整条高度（同窗承载的无菜单详情页标题返回栏等顶部下移量）。 */
  TOOLBAR: 44,
};

/**
 * 沉浸态无菜单二级页返栏紧凑样式：垂直 padding 由主题变量值（≈12）收拢为 4，
 * 页头 ~46 → ~30，控制「工具栏避让 TOOLBAR + 页头」总高在 ~78。
 * 仅几何尺寸且 inline 优先级稳定覆盖主题变量，不触碰颜色/背景/边框——
 * 亮、暗、女娲自定义主题均兼容；浏览器与独立窗口返回 undefined 零影响。
 */
export function immersiveHeaderCompact():
  | { paddingTop: number; paddingBottom: number }
  | undefined {
  return isImmersiveShell() ? { paddingTop: 4, paddingBottom: 4 } : undefined;
}

/**
 * 把沉浸式避让状态落到 documentElement（html 类 + CSS 变量）——避让样式集中化的
 * 唯一状态源。数值唯一来源仍是上方 shellAvoid；消费端
 * （styles/immersiveShell.less、wrappers/immersiveShellAvoid 挂的 .immersive-shell-page）
 * 只读变量，不再逐页内联避让尺寸。
 * 幂等：沉浸态补齐类与变量；非沉浸（浏览器/独立窗口）全部移除，下游规则天然失效。
 * --immersive-shell-right 沉浸态恒写，是否生效由 immersive-shell-frameless 类门控。
 */
export function syncShellAvoidanceCss(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const immersive = isImmersiveShell();
  root.classList.toggle('immersive-shell', immersive);
  root.classList.toggle(
    'immersive-shell-frameless',
    immersive && isWinLinuxShell(),
  );
  const vars: Array<[string, string | null]> = immersive
    ? [
        ['--immersive-shell-top', `${shellAvoid.TOP}px`],
        // 独立全屏页（layout:false 路由）顶部退让：mac 不做——红绿灯悬浮于左上、
        // 图标簇只占左侧 300px，页头（返回/标题/tabs）自 x≈260 起，无需让位；
        // Win/Linux 保留——自绘菜单栏横跨到内容区（x 至 ~400），不避让会压住页头。
        [
          '--immersive-shell-toolbar',
          isMac() ? '0px' : `${shellAvoid.TOOLBAR}px`,
        ],
        ['--immersive-shell-right', `${shellAvoid.RIGHT}px`],
      ]
    : [
        ['--immersive-shell-top', null],
        ['--immersive-shell-toolbar', null],
        ['--immersive-shell-right', null],
      ];
  for (const [name, value] of vars) {
    if (value === null) root.style.removeProperty(name);
    else root.style.setProperty(name, value);
  }
}

/**
 * 鉴权态同步：ACCESS_TOKEN 在 nuwax 与 nuwaclaw 宿主之间的双向同步（重启免登）。
 * 浏览器环境无桥，各方法均为 no-op / 返回空值，不影响 nuwax 自身流程。
 */
export const auth = {
  /** 启动时从宿主恢复 token（getInitialState 内，须早于首个鉴权请求）。 */
  async getToken(): Promise<string | null> {
    try {
      return (await getBridge()?.auth?.getToken?.()) ?? null;
    } catch (e) {
      console.warn('[hostBridge] restore token from host failed', e);
      return null;
    }
  },
  /** 登录成功后把 token 持久化到宿主（重启免登）。 */
  async persistToken(token: string): Promise<boolean> {
    try {
      return (await getBridge()?.auth?.persistToken?.(token)) ?? false;
    } catch (e) {
      console.warn('[hostBridge] persist token to host failed', e);
      return false;
    }
  },
  /** 登出 / token 失效：清宿主凭证（并触发宿主停服务）。失败静默忽略。 */
  async clear(): Promise<void> {
    try {
      await getBridge()?.auth?.clear?.();
    } catch {
      /* 宿主缺失或调用失败均忽略——不阻塞 nuwax 自身的登出/重定向 */
    }
  },
  /**
   * 企业登录：切换客户端后端域名并重新初始化（写壳侧业务域名配置 + 停本地
   * 服务 + webview 重载到新域登录页）。仅壳内有效；浏览器端返回未处理。
   */
  async configureServerHost(
    host: string,
  ): Promise<{ success: boolean; serverHost?: string; error?: string }> {
    try {
      return (
        (await getBridge()?.auth?.configureServerHost?.(host)) ?? {
          success: false,
          error: 'bridge unavailable',
        }
      );
    } catch (e) {
      console.warn('[hostBridge] configure server host failed', e);
      return { success: false, error: String(e) };
    }
  },
};

/**
 * 原生能力：仅在 nuwaclaw 中可用的桌面端特性；浏览器端调用返回未处理。
 */
export const native = {
  /**
   * 右键另存图片到本地。是否真正拦截右键由调用方据 hasHostBridge() 同步判断——
   * preventDefault 必须在事件回调内同步执行，不能等异步结果。
   */
  async saveImage(
    url: string,
    filename?: string,
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    const save = getBridge()?.native?.saveImage;
    if (!save) return { success: false };
    try {
      return await save(url, filename);
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },
  /**
   * 新开独立窗口打开站内页面（全屏页承载，见 router.ts 的新窗口路由清单）。
   * 浏览器端无桥：返回 {success:false}，调用方（jumpTo 分流）会回落到页内导航。
   */
  async openWindow(
    path: string,
  ): Promise<{ success: boolean; error?: string }> {
    const open = getBridge()?.native?.openWindow;
    if (!open) return { success: false };
    try {
      return await open(path);
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },
  /**
   * 打开宿主壳「客户端设置」弹窗（设置 UI 由壳 renderer 承载，经主进程转发打开）。
   * 仅新版商业宿主支持；浏览器 / 旧版宿主返回 {success:false}，调用方降级处理。
   */
  async openClientSettings(): Promise<{ success: boolean; error?: string }> {
    const open = getBridge()?.native?.openClientSettings;
    if (!open) return { success: false };
    try {
      return await open();
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },
};

/**
 * 宿主入站事件（host→guest）：nuwaclaw 工具栏等触发的命令经 webviewPerfBridge
 * 转发到 nuwax；浏览器无桥时 no-op。命令协议见 global.d.ts 的 HostCommand。
 */
export const events = {
  /**
   * 注册宿主命令处理器。传 null 注销。返回是否注册成功（无桥/无能力则 false）。
   * 由 hostBridgeEvents 在桌面端启动时调用一次。
   */
  onHostCommand(cb: ((payload: HostCommand) => void) | null): boolean {
    try {
      const handler = getBridge()?.events?.onHostCommand;
      if (!handler) return false;
      handler(cb);
      return true;
    } catch (e) {
      console.warn('[hostBridge] register onHostCommand failed', e);
      return false;
    }
  },
};

/**
 * 主题同步（guest→host）：把女娲主题状态推给 nuwaclaw 壳，壳侧给自己的
 * antd tokens / CSS 变量叠加同套调色板，让原生 UI（设置弹窗等）与 nuwax 统一。
 * 浏览器无桥 / 壳旧版本无此能力均为 no-op。
 */
export const theme = {
  /** 推送主题状态（fire-and-forget，失败静默——不影响 nuwax 自身主题应用）。 */
  syncTheme(payload: ShellThemePayload): void {
    try {
      getBridge()?.theme?.syncTheme?.(payload);
    } catch {
      /* 宿主缺失或调用失败均忽略 */
    }
  },
};

/**
 * 布局状态同步（guest→host）：把 nuwax 当前布局状态推给 nuwaclaw 壳。
 * 如「当前页是否存在可收起的二级菜单」——壳工具栏据此显隐收起按钮
 * （无二级菜单的页面按钮无意义）。浏览器无桥 no-op。
 */
export const layout = {
  /** 告知壳当前页是否有二级菜单可收起（fire-and-forget，失败静默）。 */
  setSecondMenuAvailable(available: boolean): void {
    try {
      getBridge()?.layout?.setSecondMenuAvailable?.(available);
    } catch {
      /* 宿主缺失或调用失败均忽略 */
    }
  },
  /** 同步二级菜单真实收起态给壳（fire-and-forget，失败静默）。 */
  setSecondMenuCollapsed(collapsed: boolean): void {
    try {
      getBridge()?.layout?.setSecondMenuCollapsed?.(collapsed);
    } catch {
      /* 宿主缺失或调用失败均忽略 */
    }
  },
  /** 同步顶部空白拖拽矩形；浏览器/旧宿主无桥时 no-op。 */
  setTitlebarDragRegions(regions: TitlebarDragRegion[]): void {
    try {
      getBridge()?.layout?.setTitlebarDragRegions?.(regions);
    } catch {
      /* 宿主缺失或调用失败均忽略 */
    }
  },
};

/**
 * 语言同步（guest→host）：把 nuwax 当前语言推给 nuwaclaw 壳，壳的 UI 文案与
 * 主进程语言跟随切换。浏览器无桥 no-op。
 */
export const i18n = {
  /** 推送当前语言（如 en-US / zh-CN；fire-and-forget，失败静默）。 */
  syncLang(lang: string): void {
    try {
      getBridge()?.i18n?.syncLang?.(lang);
    } catch {
      /* 宿主缺失或调用失败均忽略 */
    }
  },
};

/**
 * 页面元信息上报（guest→host）：启动时上报前端构建版本，壳关于页
 * 「界面版本（nuwax pc web）」展示。浏览器无桥 no-op。
 */
export const meta = {
  /** 上报构建信息（appVersion 来自构建期生成的版本常量；fire-and-forget）。 */
  syncWebInfo(payload: { appVersion: string; gitHash?: string }): void {
    try {
      getBridge()?.meta?.syncWebInfo?.(payload);
    } catch {
      /* 宿主缺失或调用失败均忽略 */
    }
  },
};

/**
 * 宿主客户端更新（guest→host）：logo 旁版本徽标消费的状态与动作。
 * 与壳关于页共用主进程同一更新器；浏览器 / 旧宿主无 updater 命名空间 → 全部降级
 * （getState 返回 null，徽标整体隐藏）。
 */
export const updater = {
  /** 当前更新状态 + 宿主版本；宿主无此能力或调用失败 → null。 */
  getState(): Promise<ClientUpdateState | null> {
    try {
      return Promise.resolve(
        getBridge()?.updater?.getState?.() ?? Promise.resolve(null),
      );
    } catch {
      return Promise.resolve(null);
    }
  },
  /** 触发一次更新检查（fire-and-forget 语义；失败静默由轮询兜底）。 */
  async check(): Promise<void> {
    try {
      await getBridge()?.updater?.check?.();
    } catch {
      /* 忽略 */
    }
  },
  /** 下载更新；返回宿主原始回包（success/error），宿主无能力/异常 → null。 */
  async download(): Promise<{ success: boolean; error?: string } | null> {
    try {
      return (await getBridge()?.updater?.download?.()) ?? null;
    } catch {
      return null;
    }
  },
  /** 重启并安装（仅 downloaded 状态有意义）。 */
  async install(): Promise<void> {
    try {
      await getBridge()?.updater?.install?.();
    } catch {
      /* 忽略 */
    }
  },
};

/**
 * 宿主身份（host→guest 只读）：区分宿主产品——nuwaclaw（社区版）/
 * nuwax（商业版 Nuwax；2026-09 改名前为 nuwawork，保留以兼容存量宿主），
 * 用于按宿主开关桌面专属能力或降级。
 * 契约来自基座 NuwaClawBridge.host.getProduct()（preload 构建期注入，非 IPC）。
 * 浏览器 / 旧宿主无 host 命名空间 → null，调用方回落通用逻辑（可选消费）。
 */
export type HostProductId = 'nuwaclaw' | 'nuwawork' | 'nuwax';

export const host = {
  /** 宿主产品标识；桥缺失 / host 命名空间缺失 / 返回非契约值 → null。 */
  getProduct(): HostProductId | null {
    try {
      const product = getBridge()?.host?.getProduct?.();
      return product === 'nuwaclaw' ||
        product === 'nuwawork' ||
        product === 'nuwax'
        ? product
        : null;
    } catch {
      return null;
    }
  },
};

/** 统一对外聚合对象（与 perfTracker 风格一致）。 */
export const hostBridge = {
  hasHostBridge,
  isDesktopHost,
  isShellWindow,
  isImmersiveShell,
  isMac,
  isWinLinuxShell,
  needsTopRightAvoid,
  shellAvoid,
  syncShellAvoidanceCss,
  immersiveHeaderCompact,
  auth,
  native,
  events,
  theme,
  layout,
  i18n,
  meta,
  updater,
  host,
};

export default hostBridge;
