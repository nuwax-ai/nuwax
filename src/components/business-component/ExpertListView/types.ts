/**
 * ExpertListView 类型定义：独立专家列表组件（数据内聚 + 双布局变体）
 */

/** 专家条目（组件对外契约，由接口响应归一化） */
export interface ExpertListItem {
  /** 稳定标识（视图类型 + 发布记录/使用记录 ID） */
  key: string;
  /** 发布记录 ID（used 视图为使用记录 ID） */
  rawId: number;
  /** 智能体本体 ID（选中/付费复核/召唤寻址；used 视图即 agentId） */
  targetId?: number;
  /** 名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 图标（URL / SvgIcon 名称，空回退名称首字） */
  icon?: string;
  /** 是否需要付费（付费角标 + 选择拦截判定） */
  paymentRequired?: boolean;
  /** 是否已订阅 */
  subscribed?: boolean;
  /** 最近使用时间（仅 used 视图条目，卡片右上角相对时间展示） */
  usedTime?: string;
  /** 使用次数（系统广场/团队/搜索视图统计，付费弹窗内专家卡展示） */
  userCount?: number;
}

/**
 * 数据视图类型（与 keyword 正交）：
 * - used    最近召唤：/user/agent/used/list 全量数组，keyword 客户端过滤，
 *           条目带最近使用时间；
 * - system  系统广场：/published/agent/list 服务端分页（targetType=Agent +
 *           targetSubType=ChatBot 专家口径，category 内容分类）；
 * - team    团队空间：同接口 + justReturnSpaceData + category='Agent'，
 *           spaceId=具体空间 / spaceIds=全部空间聚合（未传组件自拉兜底）；
 * - search  搜索场景：同接口固定 spaceId=-1（组件内写死，不对外暴露）。
 */
export type ExpertListSourceType = 'used' | 'system' | 'team' | 'search';

/** 布局变体：grid=两栏卡片（默认）/ list=单栏横排行 */
export type ExpertListVariant = 'grid' | 'list';

export interface ExpertListViewProps {
  /** 数据视图类型 */
  type: ExpertListSourceType;
  /** 布局变体，默认 grid */
  variant?: ExpertListVariant;
  /** 搜索关键字（受控；任意场景可传，组件内 300ms 防抖） */
  keyword?: string;
  /** 系统广场内容分类（仅 type=system 生效，空/不传=全部） */
  category?: string;
  /** 团队空间：具体空间 ID */
  spaceId?: number;
  /** 团队空间「全部」聚合：全部空间 ID 列表；未传时组件自拉空间列表兜底 */
  spaceIds?: number[];
  /**
   * 选中回调：付费拦截通过后才触发（免费/已订阅/复核出已订阅/统一专家卡
   * 内召唤放行），复核/召唤确认的已订阅随条目回传（下游免二次拦截）
   */
  onSelect: (item: ExpertListItem) => void;
  /** 每页数量，默认 20（used 视图即拉取条数） */
  pageSize?: number;
  /** 根容器（滚动容器）类名 */
  className?: string;
}
