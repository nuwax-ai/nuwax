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

/** 公共桥类型来自前端本仓契约；维持既有全局名称供消费方使用。 */
type HostCommand = import('./interfaces/hostBridge').HostCommand;
type ShellThemePayload = import('./interfaces/hostBridge').ShellThemePayload;
type TitlebarDragRegion = import('./interfaces/hostBridge').TitlebarDragRegion;
type ClientUpdateState = import('./interfaces/hostBridge').ClientUpdateState;

interface Window {
  Global: typeof Global;
  /** 同页消息微应用安装；实例挂载完成后可订阅。 */
  __im?: import('./interfaces/im').ImWindowBridge;
  /** 浏览器无桥，旧宿主方法可缺省，调用方按能力探测。 */
  NuwaClawBridge?: import('./interfaces/hostBridge').CompatibleHostBridge;
}
