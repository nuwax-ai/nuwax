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

/** 统一对外聚合对象（与 perfTracker 风格一致）。 */
export const nuwaClawHost = { isNuwaClaw, auth, native, events, theme };

export default nuwaClawHost;
