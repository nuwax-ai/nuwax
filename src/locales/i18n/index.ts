import type { SystemLangMap } from '@/types/interfaces/i18n';
import { EN_US } from './en-US';
import { ZH_CN } from './zh-CN';
import { ZH_HK } from './zh-HK';
import { ZH_TW } from './zh-TW';

export const I18N_LOCAL_DEFAULT_MAP: Record<string, SystemLangMap> = {
  'en-us': EN_US,
  'zh-cn': ZH_CN,
  'zh-tw': ZH_TW,
  'zh-hk': ZH_HK,
};

export const I18N_LOCAL_IMPORT_DEFAULTS = {
  PC: {
    'en-us': EN_US,
    'zh-cn': ZH_CN,
    'zh-tw': ZH_TW,
    'zh-hk': ZH_HK,
  },
} as const;

export const getLocalDefaultLangMap = (lang?: string): SystemLangMap => {
  const normalizedLang = String(lang || '').toLowerCase();
  if (
    normalizedLang.startsWith('zh-tw') ||
    normalizedLang.startsWith('zh-hant')
  ) {
    return { ...ZH_TW };
  }
  if (
    normalizedLang.startsWith('zh-hk') ||
    normalizedLang.startsWith('zh-mo')
  ) {
    return { ...ZH_HK };
  }
  if (normalizedLang.startsWith('zh')) {
    return { ...ZH_CN };
  }
  return { ...EN_US };
};
