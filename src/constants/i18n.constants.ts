import {
  I18N_LOCAL_DEFAULT_MAP,
  I18N_LOCAL_IMPORT_DEFAULTS,
} from '@/locales/i18n';
import { EN_US } from '@/locales/i18n/en-US';
import { JA_JP } from '@/locales/i18n/ja-JP';
import { ZH_CN } from '@/locales/i18n/zh-CN';
import { ZH_HK } from '@/locales/i18n/zh-HK';
import { ZH_TW } from '@/locales/i18n/zh-TW';

/**
 * 产品默认语言：简体中文。
 * 语义=无持久化用户选择时的默认值，**优先于系统/浏览器语言**（不再跟随 navigator.language）；
 * 用户在登录页语言开关或设置页显式选择后，以持久化的选择为准。
 */
export const DEFAULT_I18N_LANG = 'zh-cn';

/**
 * 历史版本的产品默认语言（英文）。
 * 存量账号 user.lang 与老浏览器 ACTIVE_LANG 里的 en-us 均可能是从未被用户选择过的
 * 旧默认残留——判定逻辑统一收口在 i18nLangPolicy（无显式标记时视为残留）。
 */
export const LEGACY_DEFAULT_I18N_LANG = 'en-us';

/**
 * 「显式选择语言」标记的当前版本值，只由 markLangUserSet 单点写入。
 * 版本演进：'1'（2928abb1d）时期 syncLangFromUserInfo 会把账号侧旧默认 en-us
 * 无条件当显式选择写标记，存量 '1' 与真实选择无法区分 → 一律视为未设置
 * （一次性归位默认中文）；'2' 起才是可信的显式选择。
 */
export const I18N_LANG_USER_SET_MARKER = '2';

export const I18N_STORAGE_KEYS = {
  ACTIVE_LANG: 'umi_locale',
  /**
   * 用户显式选择语言的标记（登录页语言开关 / 设置页语言面板）。
   * 仅 ACTIVE_LANG 无法区分「用户选过」与「旧默认值被持久化」——历史版本每次
   * 解析默认值都会写 ACTIVE_LANG，导致老 profile 的 en-us 残留被误当成用户选择，
   * 新的默认语言（简体中文）无法对它们生效。本标记补齐这个区分；
   * 标记值含义见 I18N_LANG_USER_SET_MARKER。
   */
  USER_SET: 'umi_locale_user_set',
} as const;

// I18N_MAP_CACHE_TTL removed as caching is disabled

// Runtime fallback dictionaries
export const MIN_EN_I18N_MAP: Record<string, string> = EN_US;
export const MIN_JA_I18N_MAP: Record<string, string> = JA_JP;
export const MIN_ZH_I18N_MAP: Record<string, string> = ZH_CN;
export const MIN_ZH_TW_I18N_MAP: Record<string, string> = ZH_TW;
export const MIN_ZH_HK_I18N_MAP: Record<string, string> = ZH_HK;
export const LOCAL_DEFAULT_I18N_MAP = I18N_LOCAL_DEFAULT_MAP;

// Platform defaults for i18n management import
export const I18N_IMPORT_DEFAULTS = I18N_LOCAL_IMPORT_DEFAULTS;

export const I18N_CLIENTS = ['PC', 'Mobile', 'Claw'] as const;

export const I18N_SCOPES = [
  'Pages',
  'Components',
  'Toast',
  'Modal',
  'Common',
  'Constants',
  'Routes',
  'Utils',
  'Hooks',
  'Layouts',
  'Models',
] as const;

export const I18N_KEY_REGEX =
  /^(PC|Mobile|Claw)\.(Pages|Components|Toast|Modal|Common|Hooks|Layouts|Models|Constants|Routes|Utils)\.([A-Za-z0-9]+\.)*[a-z][A-Za-z0-9]*$/;
