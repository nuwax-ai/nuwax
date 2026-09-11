/**
 * 语言决策纯函数（无 localStorage / umi 依赖，可单测）。
 * i18nRuntime 是唯一消费方；判定语义与取舍见 plans/20260911-i18n-default-lang-en-fix-plan.md。
 */
import {
  DEFAULT_I18N_LANG,
  I18N_LANG_USER_SET_MARKER,
  LEGACY_DEFAULT_I18N_LANG,
} from '@/constants/i18n.constants';

/** 语种归一化：空值回落产品默认，其余统一小写（en-US/en-us → en-us）。 */
export const normalizeLang = (lang?: string | null): string =>
  (lang || DEFAULT_I18N_LANG).toLowerCase();

/**
 * 原始标记值是否代表「用户显式选择」。
 * 只认当前版本 '2'；'1' 是历史脏同步写入的存量（与真实选择无法区分），视为未设置。
 */
export const isUserSetExplicit = (rawMarker: string | null): boolean =>
  rawMarker === I18N_LANG_USER_SET_MARKER;

/**
 * 进入时解析语种：显式选择（'2'）且缓存非空 → 缓存值；否则产品默认（简体中文）。
 * 无标记或旧标记 '1' 的 ACTIVE_LANG 均可能是历史默认值残留，一律归位默认语言。
 */
export const resolveEntryLang = (
  rawMarker: string | null,
  cachedLang: string | null,
  defaultLang: string,
): string => {
  const resolved = (isUserSetExplicit(rawMarker) && cachedLang) || defaultLang;
  return normalizeLang(resolved);
};

/**
 * 账号侧语种（后端 user.lang / 本地 USER_INFO 缓存）是否应同步到本地：
 * - en-us 是历史版本的默认语言，存量账号的 en-us 从未被用户选过——无显式标记时
 *   视为旧默认残留，忽略（否则每次进入都会把默认中文顶回英文并写脏标记）；
 * - 其余语种（ja-JP/zh-TW 等）不可能是旧默认，均视为用户真实设置，照常同步。
 * 已知代价：真选英文的用户在新设备首登会被当残留回落中文，需重选一次。
 */
export const shouldSyncAccountLang = (
  userLang: string | null | undefined,
  rawMarker: string | null,
): boolean => {
  if (!userLang) return false;
  if (
    normalizeLang(userLang) === LEGACY_DEFAULT_I18N_LANG &&
    !isUserSetExplicit(rawMarker)
  ) {
    return false;
  }
  return true;
};
