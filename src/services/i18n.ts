import { I18N_IMPORT_DEFAULTS } from '@/constants/i18n.constants';
import { apiUserUpdate } from '@/services/account';
import type {
  I18nAddLangParams,
  I18nClient,
  I18nConfigBatchAddOrUpdateParams,
  I18nLangDto,
  I18nSlideLangInfo,
  I18nUpdateLangParams,
  LangConfigListParams,
  SystemLangMap,
} from '@/types/interfaces/i18n';
import type { UserUpdateParams } from '@/types/interfaces/login';
import type { Page, RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 查询指定语言信息
export async function apiI18nQuery(
  lang?: string,
  side?: string,
): Promise<RequestResponse<SystemLangMap>> {
  const params: Record<string, string> = {};
  if (lang) params.lang = lang;
  if (side) params.side = side;

  return request('/api/i18n/query', {
    method: 'GET',
    params,
    skipErrorHandler: true,
  });
}

// 查询语言列表 (用户端)
export async function apiI18nLangList(): Promise<
  RequestResponse<I18nLangDto[]>
> {
  return request('/api/i18n/lang/list', {
    method: 'GET',
  });
}

export async function saveUserLang(
  lang: string,
): Promise<RequestResponse<null>> {
  const params: UserUpdateParams = {
    lang,
  };
  return apiUserUpdate(params);
}

export function getI18nImportDefaults(
  client: I18nClient = 'PC',
): Record<string, SystemLangMap> {
  const clientDefaults =
    (I18N_IMPORT_DEFAULTS as Record<string, Record<string, SystemLangMap>>)[
      client
    ] || {};

  return Object.entries(clientDefaults).reduce<Record<string, SystemLangMap>>(
    (acc, [lang, langMap]) => {
      acc[lang] = { ...langMap };
      return acc;
    },
    {},
  );
}

export function getI18nImportDefaultMap(
  lang: string,
  client: I18nClient = 'PC',
): SystemLangMap {
  const defaults = getI18nImportDefaults(client);
  const normalizedLang = String(lang || '').toLowerCase();
  if (normalizedLang.startsWith('zh')) {
    return { ...(defaults['zh-cn'] || {}) };
  }
  return { ...(defaults['en-us'] || {}) };
}

/**
 * 更新语言
 */
export async function apiI18nLangUpdate(
  data: I18nUpdateLangParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/i18n/lang/update', {
    method: 'POST',
    data,
  });
}

/**
 * 批量更新语言排序
 */
export async function apiI18nUpdateLangSort(
  data: I18nLangDto[],
): Promise<RequestResponse<null>> {
  return request('/api/system/i18n/lang/sort', {
    method: 'POST',
    data,
  });
}

/**
 * 设置为默认语言
 */
export async function apiI18nSetLangDefault(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/i18n/lang/setDefault/${id}`, {
    method: 'POST',
  });
}

/**
 * 删除语言
 */
export async function apiI18nDeleteLang(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/i18n/lang/delete/${id}`, {
    method: 'POST',
  });
}

/**
 * 新增语言
 */
export async function apiI18nLangAdd(
  data: I18nAddLangParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/i18n/lang/add', {
    method: 'POST',
    data,
  });
}

/**
 * 翻译单个key
 */
export async function apiI18nConfigTranslate(
  data: I18nSlideLangInfo,
): Promise<RequestResponse<null>> {
  return request('/api/system/i18n/config/translateKey', {
    method: 'POST',
    data,
  });
}

/**
 * 翻译所有key
 */
export async function apiI18nConfigTranslateAll(
  lang: string,
): Promise<RequestResponse<I18nSlideLangInfo>> {
  return request('/api/system/i18n/config/translateAll', {
    method: 'POST',
    params: {
      lang,
    },
  });
}

/**
 * 批量新增或更新多语言配置
 */
export async function apiI18nConfigBatchAddOrUpdate(
  data: I18nConfigBatchAddOrUpdateParams[],
): Promise<RequestResponse<null>> {
  return request('/api/system/i18n/config/batchAddOrUpdate', {
    method: 'POST',
    data,
  });
}

/**
 * 新增或更新多语言配置
 */
export async function apiI18nConfigAddOrUpdate(
  data: I18nConfigBatchAddOrUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/i18n/config/addOrUpdate', {
    method: 'POST',
    data,
  });
}

/**
 * 查询多语言端列表
 */
export async function apiI18nSideList(): Promise<RequestResponse<string[]>> {
  return request('/api/system/i18n/side/list', {
    method: 'GET',
  });
}

/**
 * 查询全部语言
 */
export async function apiI18nAllLangList(): Promise<
  RequestResponse<I18nLangDto[]>
> {
  return request('/api/system/i18n/lang/list', {
    method: 'GET',
  });
}

/**
 * 查询多语言配置列表
 */
export async function apiI18nConfigList(
  data: LangConfigListParams,
): Promise<RequestResponse<Page<I18nSlideLangInfo>>> {
  return request('/api/system/i18n/config/list', {
    method: 'POST',
    data,
  });
}
