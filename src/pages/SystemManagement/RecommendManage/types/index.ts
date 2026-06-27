/**
 * 编辑推荐参数
 */
export interface DisplayRecommendParams {
  /* */
  id?: number;

  /* */
  targetType: string;

  /* */
  targetId: number;

  /* */
  recType: string;

  /* */
  functionType: string;

  /* */
  label?: string;

  /* */
  icon?: string;

  /* */
  placeholder?: string;

  /* */
  sort?: number;
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
