/**
 * ConnectorListView 类型定义：独立连接器列表组件（数据与连接流程内聚 + 双布局变体）
 */

/** 连接器条目（组件对外契约，由接口响应归一化） */
export interface ConnectorListItem {
  /** 稳定标识（视图类型 + service/ID） */
  key: string;
  /** service 标识（连接/断开寻址） */
  rawId: number | string;
  /** 名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 图标（URL / SvgIcon 名称，空回退名称首字） */
  icon?: string;
  /** 连接状态（开关状态 + 已连接/未连接状态标） */
  connected?: boolean;
  /** 认证方式（oauth2/api_key/bearer/custom/no_auth，连接/断开分流用） */
  authType?: string;
}

/**
 * 数据视图类型（与 keyword 正交）：
 * - connected  已连接：GET /connector/providers?connected=true 全量数组
 *   （兼容裸数组/records 双壳），keyword 客户端过滤；
 * - system     系统广场：官方连接器目录（scope=official）服务端分页，
 *   category 内容分类；
 * - team       团队空间：具体空间传 spaceId；「全部」走 scope=space
 *   服务端聚合（无需外部传空间列表）；
 * - search     搜索场景：仅关键字 + 分页（不带 scope/spaceId）。
 */
export type ConnectorListSourceType =
  | 'connected'
  | 'system'
  | 'team'
  | 'search';

/** 布局变体：grid=两栏卡片（默认）/ list=单栏横排行 */
export type ConnectorListVariant = 'grid' | 'list';

export interface ConnectorListViewProps {
  /** 数据视图类型 */
  type: ConnectorListSourceType;
  /** 布局变体，默认 grid */
  variant?: ConnectorListVariant;
  /** 搜索关键字（受控；任意场景可传，组件内 300ms 防抖） */
  keyword?: string;
  /** 系统广场内容分类（仅 type=system 生效，空/不传=全部） */
  category?: string;
  /** 团队空间：具体空间 ID（不传=scope=space 聚合全部空间） */
  spaceId?: number;
  /**
   * 连接/断开成功通知（开关请求、状态回写、凭据/扫码授权子弹窗全部
   * 组件内闭环），宿主凭此同步「已连接」页签等派生数据
   */
  onConnectedChange?: (item: ConnectorListItem, connected: boolean) => void;
  /** 每页数量，默认 20（connected 视图忽略） */
  pageSize?: number;
  /** 根容器（滚动容器）类名 */
  className?: string;
}
