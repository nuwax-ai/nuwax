/** 敏感词分类 */
export enum SensitiveWordCategoryEnum {
  Illegal = 'ILLEGAL',
  Advertising = 'ADVERTISING',
  PrivacyLeak = 'PRIVACY_LEAK',
  Competitor = 'COMPETITOR',
}

/** 敏感词匹配方式 */
export enum SensitiveWordMatchTypeEnum {
  Contain = 'CONTAIN',
  Regex = 'REGEX',
}

/** 敏感词触发策略 */
export enum SensitiveWordActionEnum {
  Disconnect = 'DISCONNECT',
  Replace = 'REPLACE',
}

/** 敏感词（列表项） */
export interface SensitiveWordInfo {
  id: number;
  /** 包含匹配存明文，正则匹配存表达式 */
  word: string;
  category: SensitiveWordCategoryEnum;
  matchType: SensitiveWordMatchTypeEnum;
  action: SensitiveWordActionEnum;
  /** 1 启用 / 0 禁用 */
  status: number;
  created?: string;
  modified?: string;
}

/** 新增敏感词（status 缺省为启用） */
export interface SensitiveWordCreateParams {
  word: string;
  category: SensitiveWordCategoryEnum;
  matchType: SensitiveWordMatchTypeEnum;
  action: SensitiveWordActionEnum;
}

/** 编辑敏感词（状态走单独接口） */
export interface SensitiveWordUpdateParams extends SensitiveWordCreateParams {
  id: number;
}

/** 分页查询敏感词（current 从 1 开始） */
export interface SensitiveWordPageParams {
  current: number;
  pageSize: number;
  queryFilter?: {
    word?: string;
    category?: SensitiveWordCategoryEnum;
    matchType?: SensitiveWordMatchTypeEnum;
    action?: SensitiveWordActionEnum;
    status?: number;
  };
}
