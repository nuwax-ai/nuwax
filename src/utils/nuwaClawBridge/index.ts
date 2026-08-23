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
 * 是否运行在 nuwaclaw 桌面客户端中（宿主桥已注入）。
 * 用于「仅桌面端生效」的特性门控（如专属主题、原生右键菜单）。
 */
export function isNuwaClaw(): boolean {
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
 * 是否为 nuwaclaw 主窗口的沉浸式形态（桌面端且非独立窗口）。
 * 菜单避让/隐藏 logo 等沉浸式专属门控一律用本判定；桌面独立窗口返回 false，
 * 恢复浏览器式布局（系统标题栏已承担顶部空间，无需避让）。
 */
export function isImmersiveShell(): boolean {
  return isNuwaClaw() && !isShellWindow();
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
  /** mac 红绿灯 {16,16} + 沉浸工具栏条：壳内一级/二级菜单等顶部下移量。 */
  TOP: 36,
  /** Win/Linux 自绘三键贴死右上角（46×3=138px）：右上角浮层避让宽度（含间隙）。 */
  RIGHT: 150,
};

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
      console.warn('[nuwaClawHost] restore token from host failed', e);
      return null;
    }
  },
  /** 登录成功后把 token 持久化到宿主（重启免登）。 */
  async persistToken(token: string): Promise<boolean> {
    try {
      return (await getBridge()?.auth?.persistToken?.(token)) ?? false;
    } catch (e) {
      console.warn('[nuwaClawHost] persist token to host failed', e);
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
};

/**
 * 原生能力：仅在 nuwaclaw 中可用的桌面端特性；浏览器端调用返回未处理。
 */
export const native = {
  /**
   * 右键另存图片到本地。是否真正拦截右键由调用方据 isNuwaClaw() 同步判断——
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
};

/**
 * 宿主入站事件（host→guest）：nuwaclaw 工具栏等触发的命令经 webviewPerfBridge
 * 转发到 nuwax；浏览器无桥时 no-op。命令协议见 global.d.ts 的 HostCommand。
 */
export const events = {
  /**
   * 注册宿主命令处理器。传 null 注销。返回是否注册成功（无桥/无能力则 false）。
   * 由 nuwaClawHostEvents 在桌面端启动时调用一次。
   */
  onHostCommand(cb: ((payload: HostCommand) => void) | null): boolean {
    try {
      const handler = getBridge()?.events?.onHostCommand;
      if (!handler) return false;
      handler(cb);
      return true;
    } catch (e) {
      console.warn('[nuwaClawHost] register onHostCommand failed', e);
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
};

/** 统一对外聚合对象（与 perfTracker 风格一致）。 */
export const nuwaClawHost = {
  isNuwaClaw,
  isShellWindow,
  isImmersiveShell,
  isMac,
  isWinLinuxShell,
  needsTopRightAvoid,
  shellAvoid,
  auth,
  native,
  events,
  theme,
  layout,
};

export default nuwaClawHost;
