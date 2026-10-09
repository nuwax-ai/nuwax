import {
  DEFAULT_I18N_LANG,
  I18N_STORAGE_KEYS,
  MIN_EN_I18N_MAP,
  MIN_JA_I18N_MAP,
  MIN_ZH_HK_I18N_MAP,
  MIN_ZH_I18N_MAP,
  MIN_ZH_TW_I18N_MAP,
} from '@/constants/i18n.constants';
import { resolveEntryLang } from '@/services/i18nLangPolicy';

/** 启动界面只读本地词典，不能提前拉起尚未初始化的 i18nRuntime 依赖链。 */
export const startupText = (key: string): string => {
  let lang = DEFAULT_I18N_LANG;
  try {
    lang = resolveEntryLang(
      localStorage.getItem(I18N_STORAGE_KEYS.USER_SET),
      localStorage.getItem(I18N_STORAGE_KEYS.ACTIVE_LANG),
      DEFAULT_I18N_LANG,
    );
  } catch {
    // 存储不可用时仍要能展示启动反馈。
  }
  const map =
    lang.startsWith('zh-tw') || lang.startsWith('zh-hant')
      ? MIN_ZH_TW_I18N_MAP
      : lang.startsWith('zh-hk') || lang.startsWith('zh-mo')
      ? MIN_ZH_HK_I18N_MAP
      : lang.startsWith('zh')
      ? MIN_ZH_I18N_MAP
      : lang.startsWith('ja')
      ? MIN_JA_I18N_MAP
      : MIN_EN_I18N_MAP;
  return map[key] || MIN_ZH_I18N_MAP[key] || key;
};
