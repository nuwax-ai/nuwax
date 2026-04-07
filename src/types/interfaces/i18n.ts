/**
 * 语言状态，0 停用；1 启用
 */
export enum I18nLangStatusEnum {
  /** 停用 */
  Disabled = 0,
  /** 启用 */
  Enabled = 1,
}

/**
 * 是否为默认语言，0 否；1 是
 */
export enum I18nLangIsDefaultEnum {
  /** 否 */
  No = 0,
  /** 是 */
  Yes = 1,
}

/**
 * 语言信息
 */
export interface I18nLangDto {
  // 语言 ID
  id: number;
  /** 语言名称，例如 简体中文 */
  name: string;
  /** 语言标识，中文：zh-cn，英文：en-us 等等 */
  lang: string;
  /** 语言状态，0 停用；1 启用 */
  status: I18nLangStatusEnum;
  /** 是否为默认语言，0 否；1 是 */
  isDefault: I18nLangIsDefaultEnum;
  /** 排序，值越小越靠前 */
  sort: number;
  /** 更新时间 */
  modified: string;
  /** 创建时间 */
  created: string;
}

export type SystemLangMap = Record<string, string>;

export type I18nClient = 'PC' | 'Mobile' | 'Claw';

export type I18nScope = 'Pages' | 'Components' | 'Toast' | 'Modal' | 'Common';

// key format: {Client}.{Scope}.{Domain}.{specific}
export type I18nKeyPattern = `${I18nClient}.${I18nScope}.${string}.${string}`;

// 更新语言参数
export interface I18nUpdateLangParams {
  /*语言 ID */
  id: number;

  /*语言名称，例如 简体中文 */
  name?: string;

  /*语言状态，0 停用；1 启用 */
  status?: I18nLangStatusEnum;

  /*是否为默认语言，0 否；1 是 */
  isDefault?: I18nLangIsDefaultEnum;

  /*排序，值越小越靠前 */
  sort?: number;
}

// 新增语言参数
export interface I18nAddLangParams {
  /*语言名称，例如 简体中文 */
  name: string;

  /*语言标识，中文：zh-cn，英文：en-us 等等 */
  lang: string;

  /*语言状态，0 停用；1 启用 */
  status?: I18nLangStatusEnum;

  /*是否为默认语言，0 否；1 是 */
  isDefault?: I18nLangIsDefaultEnum;

  /*排序，值越小越靠前 */
  sort?: number;
}

// 端语言信息
export interface I18nSlideLangInfo {
  /*端 */
  side?: string;

  /*具体语言，中文：zh-cn，英文：en-us，等 */
  lang?: string;

  /*键 */
  key?: string;

  /*值 */
  value?: string;

  /*备注 */
  remark?: string;
}

// 批量新增或更新多语言配置参数
export type I18nConfigBatchAddOrUpdateParams = I18nSlideLangInfo;
