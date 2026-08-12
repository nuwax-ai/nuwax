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
  };
}
