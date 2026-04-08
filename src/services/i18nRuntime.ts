import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  DEFAULT_I18N_LANG,
  I18N_KEY_REGEX,
  I18N_MAP_CACHE_TTL,
  I18N_STORAGE_KEYS,
  MIN_EN_I18N_MAP,
  MIN_ZH_HK_I18N_MAP,
  MIN_ZH_I18N_MAP,
  MIN_ZH_TW_I18N_MAP,
} from '@/constants/i18n.constants';
import type { I18nKeyPattern, SystemLangMap } from '@/types/interfaces/i18n';
import { syncLocaleSystems } from '@/utils/localeSync';
import { apiI18nQuery } from './i18n';

let currentLang = DEFAULT_I18N_LANG;
let langMap: SystemLangMap = { ...MIN_EN_I18N_MAP };
let zhBaseMap: SystemLangMap = { ...MIN_ZH_I18N_MAP };
let zhValueToKeyMap: Record<string, string> = {};
let initialized = false;
const warnedLegacyKeys = new Set<string>();
const warnedInvalidKeys = new Set<string>();
const warnedMissingKeys = new Set<string>();

const normalizeLang = (lang?: string | null) =>
  (lang || DEFAULT_I18N_LANG).toLowerCase();

const isZhLang = (lang?: string | null): boolean =>
  normalizeLang(lang).startsWith('zh');

const getLocalDefaultMapByLang = (lang?: string | null): SystemLangMap => {
  const normalized = normalizeLang(lang);
  if (normalized.startsWith('zh-tw') || normalized.startsWith('zh-hant'))
    return MIN_ZH_TW_I18N_MAP;
  if (normalized.startsWith('zh-hk') || normalized.startsWith('zh-mo'))
    return MIN_ZH_HK_I18N_MAP;
  if (normalized.startsWith('zh')) return MIN_ZH_I18N_MAP;
  return MIN_EN_I18N_MAP;
};

const isLegacySystemKey = (key: string): boolean => key.startsWith('System.');

const isValidI18nKey = (key: string): key is I18nKeyPattern =>
  I18N_KEY_REGEX.test(key);

const warnOnce = (
  cache: Set<string>,
  key: string,
  logger: (payload: string) => void,
): void => {
  if (cache.has(key)) return;
  cache.add(key);
  logger(key);
};

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore cache failures
  }
};

const getBrowserLang = (): string => {
  if (typeof navigator === 'undefined') {
    return DEFAULT_I18N_LANG;
  }
  return normalizeLang(navigator.language);
};

const formatText = (template: string, values: (string | number)[]): string => {
  if (!values.length) return template;
  let text = template;
  values.forEach((value, index) => {
    const stringValue = String(value ?? '');
    text = text.replace(new RegExp(`\\{${index}\\}`, 'g'), stringValue);
  });
  let cursor = 0;
  text = text.replace(/\{\}/g, () => String(values[cursor++] ?? ''));
  return text;
};

const readMapFromCache = (lang: string): SystemLangMap | null => {
  const cacheAt = Number(safeGetItem(I18N_STORAGE_KEYS.LANG_MAP_CACHE_AT));
  const cacheText = safeGetItem(I18N_STORAGE_KEYS.LANG_MAP_CACHE);
  const cacheLangRaw = safeGetItem(I18N_STORAGE_KEYS.LANG_MAP_CACHE_LANG);
  const cacheLang = cacheLangRaw ? normalizeLang(cacheLangRaw) : '';
  if (!cacheText || !cacheAt) return null;
  if (Date.now() - cacheAt > I18N_MAP_CACHE_TTL) return null;
  if (cacheLang && cacheLang !== normalizeLang(lang)) return null;
  try {
    const cacheValue = JSON.parse(cacheText) as SystemLangMap;
    if (cacheValue && typeof cacheValue === 'object') {
      return cacheValue;
    }
  } catch {
    // ignore invalid cache
  }
  return null;
};

const persistMapCache = (lang: string, map: SystemLangMap): void => {
  safeSetItem(I18N_STORAGE_KEYS.LANG_MAP_CACHE, JSON.stringify(map));
  safeSetItem(I18N_STORAGE_KEYS.LANG_MAP_CACHE_AT, String(Date.now()));
  safeSetItem(I18N_STORAGE_KEYS.LANG_MAP_CACHE_LANG, normalizeLang(lang));
};

const readLangFromCache = (): string | null => {
  return safeGetItem(I18N_STORAGE_KEYS.ACTIVE_LANG);
};

const parseLangMapResult = (result: any): SystemLangMap | null => {
  const resultData =
    result?.data && typeof result.data === 'object' ? result.data : result;
  const isSuccess = result?.code ? result.code === SUCCESS_CODE : true;
  if (!isSuccess || !resultData || typeof resultData !== 'object') {
    return null;
  }
  return resultData as SystemLangMap;
};

export const getCurrentLang = (): string => currentLang;

export const getCurrentLangMap = (): SystemLangMap => ({ ...langMap });

export const setCurrentLang = (lang?: string | null): void => {
  const resolvedLang = normalizeLang(lang || getBrowserLang());
  currentLang = resolvedLang;
  safeSetItem(I18N_STORAGE_KEYS.ACTIVE_LANG, resolvedLang);
  syncLocaleSystems(resolvedLang);
};

const buildZhValueToKeyMap = (map: SystemLangMap): void => {
  const nextMap: Record<string, string> = {};
  Object.entries(map).forEach(([key, value]) => {
    const normalizedValue = String(value || '').trim();
    if (!normalizedValue) return;
    if (!(normalizedValue in nextMap)) {
      nextMap[normalizedValue] = key;
    }
  });
  zhValueToKeyMap = nextMap;
};

export const fetchAndApplyLangMap = async (
  lang?: string,
  side: string = 'PC',
): Promise<boolean> => {
  const isInitialCall = !lang;
  try {
    const result = await apiI18nQuery(lang, side);
    const parsedMap = parseLangMapResult(result);
    if (!parsedMap) {
      if (isInitialCall) {
        // 首屏请求失败，启用本地英语兜底
        langMap = { ...MIN_EN_I18N_MAP };
        setCurrentLang('en-us');
      }
      return false;
    }

    // --- 基于字典内容自动识别语种 ---
    let detectedLang = lang; // 如果是手动切换，使用传入的 lang
    if (!detectedLang) {
      // 首次加载或未传参数，通过内容判定
      const testValue = parsedMap['PC.man.user.add'];
      if (testValue === '增加用户') {
        detectedLang = 'zh-cn';
      } else if (testValue === 'add user') {
        detectedLang = 'en-us';
      }
    }

    const finalLang = normalizeLang(detectedLang || currentLang);
    // 同步全局语种状态（确保 antd 等受控组件识别到正确语种）
    setCurrentLang(finalLang);

    langMap = {
      ...getLocalDefaultMapByLang(finalLang),
      ...parsedMap,
    };
    persistMapCache(finalLang, langMap);
    return true;
  } catch {
    if (isInitialCall) {
      // 捕获异常：应用本地英语兜底
      langMap = { ...MIN_EN_I18N_MAP };
      setCurrentLang('en-us');
    }
    return false;
  }
};

// const fetchZhBaseMap = async (): Promise<void> => {
//   zhBaseMap = { ...MIN_ZH_I18N_MAP };
//   try {
//     const result = await apiI18nQuery('zh-cn');
//     const parsedMap = parseLangMapResult(result);
//     if (parsedMap) {
//       zhBaseMap = {
//         ...MIN_ZH_I18N_MAP,
//         ...parsedMap,
//       };
//     }
//   } catch {
//     // ignore zh fallback fetch errors
//   }
//   buildZhValueToKeyMap(zhBaseMap);
// };

export const syncLangFromUserInfo = async (user?: {
  lang?: string | null;
}): Promise<void> => {
  if (!user?.lang) return;
  const targetLang = normalizeLang(user.lang);
  // 只同步本地状态，不再发起网络请求，相信 initI18n 的第一次请求结果
  setCurrentLang(targetLang);
  if (isZhLang(targetLang)) {
    zhBaseMap = { ...MIN_ZH_I18N_MAP };
    buildZhValueToKeyMap(zhBaseMap);
  }
  initialized = true;
};

export const dict = (key: string, ...values: (string | number)[]): string => {
  const normalizedKey = String(key || '').trim();
  if (!normalizedKey) return '';

  if (isLegacySystemKey(normalizedKey)) {
    warnOnce(warnedLegacyKeys, normalizedKey, (k) => {
      console.error(
        `[i18n] Legacy key is not supported anymore and should be migrated: ${k}`,
      );
    });
    return normalizedKey;
  }

  if (!isValidI18nKey(normalizedKey)) {
    warnOnce(warnedInvalidKeys, normalizedKey, (k) => {
      console.error(
        `[i18n] Invalid key format. Expected {Client}.{Scope}.{Domain}.{key}: ${k}`,
      );
    });
    return normalizedKey;
  }

  const template =
    langMap[normalizedKey] ||
    MIN_EN_I18N_MAP[normalizedKey] ||
    MIN_ZH_I18N_MAP[normalizedKey];
  if (!template) {
    warnOnce(warnedMissingKeys, normalizedKey, (k) => {
      console.error(`[i18n] Missing translation entry for key: ${k}`);
    });
    return normalizedKey;
  }

  return formatText(template, values);
};

export const t = (key: string, ...values: (string | number)[]): string =>
  dict(key, ...values);

export const translateLiteralText = (rawText: string): string => {
  const originalText = String(rawText || '');
  const trimmedText = originalText.trim();
  if (!trimmedText) return originalText;

  // 直接支持新规范 key 文本
  if (isValidI18nKey(trimmedText)) {
    return originalText.replace(trimmedText, dict(trimmedText));
  }

  if (isLegacySystemKey(trimmedText)) {
    dict(trimmedText);
    return originalText;
  }

  // 中文界面无需替换
  if (getCurrentLang().startsWith('zh')) {
    return originalText;
  }

  const key = zhValueToKeyMap[trimmedText];
  if (!key) return originalText;

  const translated = dict(key);
  if (!translated || translated === key) return originalText;
  return originalText.replace(trimmedText, translated);
};

export const initI18n = async (): Promise<void> => {
  if (initialized) return;

  const cachedLang = readLangFromCache();
  const resolvedLang = normalizeLang(cachedLang || getBrowserLang());
  setCurrentLang(resolvedLang);

  langMap = { ...getLocalDefaultMapByLang(resolvedLang) };

  const cachedMap = readMapFromCache(resolvedLang);
  if (cachedMap) {
    langMap = {
      ...getLocalDefaultMapByLang(resolvedLang),
      ...cachedMap,
    };
  }

  // 首屏仅发起一次不带参数的请求，由后端自动识别
  await fetchAndApplyLangMap();

  if (isZhLang(getCurrentLang())) {
    zhBaseMap = { ...langMap };
    buildZhValueToKeyMap(zhBaseMap);
  } else {
    // 移除 init 时的额外基准包请求，严格遵守一次请求原则
    // 如果需要中文反向翻译，使用本地默认提供的中文包作为备选
    buildZhValueToKeyMap(MIN_ZH_I18N_MAP);
  }

  initialized = true;
};
