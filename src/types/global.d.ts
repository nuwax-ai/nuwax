// interface Window {
//   publicPath?: string;
// }
declare namespace Global {
  interface Pagination {
    total: number;
    pageSize: number;
    current: number;
  }

  interface IGetList {
    pageNo: number;
    pageSize: number;
    category?: string;
    kw?: string;
    spaceId?: number;
    dataType?: string;
    justReturnSpaceData?: boolean;
  }
}

/**
 * nuwaclaw 宿主下发给 nuwax 的命令协议（跨 webview host→guest 通道）。
 * 由 nuwaclaw 工具栏触发，经 webviewPerfBridge 转发，nuwax 侧 nuwaClawHostEvents 响应。
 * 新增命令类型在此扩展 type 联合。
 */
interface HostCommand {
  /** 收起/展开二级菜单 */
  type: 'toggle-second-menu';
  /** true=收起，false=展开 */
  collapsed: boolean;
}

// 扩展全局作用域（本文件为全局脚本，顶层声明直接合并到全局类型，
// 故 interface Window 不需要 declare global 包裹）
interface Window {
  Global: typeof Global;
  NuwaClawBridge?: {
    perf?: {
      enabled?: () => boolean;
      mark?: (stage: string, payload?: Record<string, unknown>) => void;
      markOnce?: (
        key: string,
        stage: string,
        payload?: Record<string, unknown>,
      ) => void;
    };
    // nuwaclaw 客户端宿主注入：ACCESS_TOKEN 双向同步（重启免登）
    auth?: {
      getToken?: () => Promise<string | null>;
      persistToken?: (token: string) => Promise<boolean>;
      clear?: () => Promise<boolean>;
    };
    // nuwaclaw 客户端宿主注入：原生能力（右键另存图片等）
    native?: {
      saveImage?: (
        url: string,
        filename?: string,
      ) => Promise<{ success: boolean; path?: string; error?: string }>;
    };
    // nuwaclaw 宿主→nuwax 入站命令通道（contextBridge 注册回调；host 触发时 cb 在 guest 上下文执行）
    events?: {
      /** 注册/注销宿主命令回调（传 null 注销）。 */
      onHostCommand?: (cb: ((payload: HostCommand) => void) | null) => void;
    };
  };
}
