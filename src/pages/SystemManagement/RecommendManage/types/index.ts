/**
 * 推荐展示类型
 */
export enum DisplayRecTypeEnum {
  // 智能体推荐
  Home = 'Home',
  // 官方推荐
  Official = 'Official',
  // 对话框智能体推荐
  ChatBoxNav = 'ChatBoxNav',
}

/**
 * 推荐目标类型
 */
export enum DisplayRecommendTargetTypeEnum {
  Agent = 'Agent',
  PageApp = 'PageApp',
  Skill = 'Skill',
  Plugin = 'Plugin',
  Workflow = 'Workflow',
}

/**
 * 对话框智能体功能子类型
 */
export enum DisplayRecommendFunctionTypeEnum {
  // 智能体开发
  AgentDev = 'AgentDev',
  // 网页应用开发
  PageAppDev = 'PageAppDev',
  // 技能开发
  SkillDev = 'SkillDev',
  // 插件开发
  PluginDev = 'PluginDev',
  // 智能体
  Chat = 'Chat',
}

/**
 * 编辑推荐参数
 */
export interface DisplayRecommendParams {
  id?: number;
  targetType: string;
  targetId: number;
  recType: string;
  functionType: string;
  label?: string;
  icon?: string;
  placeholder?: string;
  sort?: number;
}

/**
 * 更新推荐排序参数
 */
export interface UpdateDisplayRecommendSortParams {
  items: UpdateDisplayRecommendSortItem[];
}

/**
 * 更新推荐排序参数项
 */
export interface UpdateDisplayRecommendSortItem {
  /*ID */
  id: number;

  /*父级ID，0表示根节点，不传则不修改（无层级则忽略） */
  parentId?: number;

  /*排序索引，不传则不修改 */
  sortIndex?: number;
}

/**
 * 查询推荐列表参数
 */
export interface DisplayRecommendListParams {
  /*页码，从1开始 */
  pageNo?: number;

  /*每页大小 */
  pageSize?: number;

  /*名称模糊搜索 */
  name?: string;

  /*创建人ID列表 */
  creatorIds?: Record<string, unknown>[];

  /*创建人名称搜索 */
  creatorName?: string;

  /*空间ID */
  spaceId?: number;

  /*管控条件 */
  accessControl?: number;

  /*推荐类型：Home、Official、ChatBoxNav */
  recType: DisplayRecTypeEnum;
}

/**
 * 推荐信息
 */
export interface DisplayRecommendInfo {
  id: number;
  tenantId: number;
  targetType: string;
  targetId: number;
  recType: string;
  functionType: string;
  label: string;
  icon: string;
  placeholder: string;
  sort: number;
  modified: string;
  created: string;
}
