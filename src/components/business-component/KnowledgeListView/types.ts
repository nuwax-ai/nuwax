/**
 * KnowledgeListView 类型定义：独立资料库列表组件（数据内聚 + 双布局变体）
 */

/** 资料条目（组件对外契约，由接口响应归一化） */
export interface KnowledgeListItem {
  /** 稳定标识（视图类型 + 页面 ID） */
  key: string;
  /** 页面主键 */
  rawId: number;
  /** 短链标识（选中后 selectedDocs 寻址用） */
  slugId?: string;
  /** 名称（页面标题） */
  name: string;
  /** 文档类型（随选中回传，chip 插入链路随 selectedDocs 发送） */
  pageType?: string;
  /** 展示 Tag 文案（sourceExt 优先、pageType 回落，统一大写） */
  fileType?: string;
  /** 最近访问时间（仅 recent 视图条目，卡片右端相对时间胶囊） */
  usedTime?: string;
}

/**
 * 数据视图类型（与 keyword 正交）：
 * - recent  最近访问：门户 recently-accessed 接口全量数组（from/size 单次
 *   拉取），keyword 客户端过滤，条目带最近访问时间；
 * - space   指定空间的 repo 页面树：全量拉取后先序平铺（目录与页面同构，
 *   每个节点都是可选文档），keyword 客户端过滤 + 内存切片模拟滚动加载。
 */
export type KnowledgeListSourceType = 'recent' | 'space';

/** 布局变体：grid=两列横排资料行（默认）/ list=单列横排资料行 */
export type KnowledgeListVariant = 'grid' | 'list';

export interface KnowledgeListViewProps {
  /** 数据视图类型 */
  type: KnowledgeListSourceType;
  /** 布局变体，默认 grid */
  variant?: KnowledgeListVariant;
  /** 搜索关键字（受控；任意场景可传，组件内 300ms 防抖 + 客户端过滤） */
  keyword?: string;
  /** space 场景必传：repo 树接口 spaceId 必传；未传时挂起不加载 */
  spaceId?: number;
  /** 选中回调：资料无付费拦截，直调（悬停「选择」按钮为唯一选中入口） */
  onSelect: (item: KnowledgeListItem) => void;
  /** 每页数量，默认 20（树平铺后客户端切片步长） */
  pageSize?: number;
  /** 根容器（滚动容器）类名 */
  className?: string;
}
