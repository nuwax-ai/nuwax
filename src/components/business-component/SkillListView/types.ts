/**
 * SkillListView 类型定义：独立技能列表组件（数据内聚 + 双布局变体）
 */

/** 技能条目（组件对外契约，由接口响应归一化） */
export interface SkillListItem {
  /** 稳定标识（视图类型 + 发布记录 ID） */
  key: string;
  /** 发布记录 ID */
  rawId: number;
  /** 技能本体 ID（选中/启用/付费复核寻址） */
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
  /** 是否已启用（开关状态） */
  enabled?: boolean;
}

/**
 * 数据视图类型（与 keyword 正交）：
 * - enabled  我启用的：enable/list 全量数组，keyword 客户端过滤；
 * - system   系统广场：published/skill/list 服务端分页（category 内容分类）；
 * - team     团队空间：同接口 justReturnSpaceData，spaceId=具体空间 /
 *            spaceIds=全部空间聚合（空间字典由外部拉取传入）；
 * - search   搜索场景：同接口固定 spaceId=-1（组件内写死，不对外暴露）。
 */
export type SkillListSourceType = 'enabled' | 'system' | 'team' | 'search';

/** 布局变体：grid=两栏卡片（默认）/ list=单栏横排行 */
export type SkillListVariant = 'grid' | 'list';

export interface SkillListViewProps {
  /** 数据视图类型 */
  type: SkillListSourceType;
  /** 布局变体，默认 grid */
  variant?: SkillListVariant;
  /** 搜索关键字（受控；任意场景可传，组件内 300ms 防抖） */
  keyword?: string;
  /** 系统广场内容分类（仅 type=system 生效，空/不传=全部） */
  category?: string;
  /** 团队空间：具体空间 ID */
  spaceId?: number;
  /**
   * 团队空间「全部」聚合：全部空间 ID 列表（外部拉取空间字典后传入）；
   * 需要聚合而未传时组件自拉空间列表兜底（就绪前列表查询挂起）
   */
  spaceIds?: number[];
  /**
   * 选中回调：付费拦截通过后才触发（免费/已订阅/复核出已订阅/租户未开启
   * 订阅），复核出的已订阅随条目回传（下游免二次拦截）
   */
  onSelect: (item: SkillListItem) => void;
  /** 启用/取消启用成功通知（开关请求与状态回写内部闭环） */
  onEnabledChange?: (item: SkillListItem, enabled: boolean) => void;
  /** 每页数量，默认 20 */
  pageSize?: number;
  /** 根容器（滚动容器）类名 */
  className?: string;
}
