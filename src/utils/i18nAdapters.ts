/**
 * 多语言统一适配层
 *
 * 为所有需要 locale 的库提供统一的注册、查询和回退机制。
 * 业务组件不直接写语言码判断，统一通过本模块获取 locale。
 *
 * 核心概念：
 * - supportedAppLocales：系统支持的业务语言列表
 * - libraryLocaleRegistry：每个库实际支持的语言配置
 * - resolveFallbackChain(lang)：根据输入语言返回回退顺序
 * - pickSupportedLocale(libraryName, lang)：从回退链里挑该库真正支持的 locale
 */

import type { Locale } from 'antd/es/locale';
import enUS from 'antd/es/locale/en_US';
import zhCN from 'antd/es/locale/zh_CN';
import zhHK from 'antd/es/locale/zh_HK';
import zhTW from 'antd/es/locale/zh_TW';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-tw';

// ---------------------------------------------------------------------------
// 1. 系统支持的业务语言
// ---------------------------------------------------------------------------

export const supportedAppLocales = [
  'zh-CN',
  'zh-TW',
  'zh-HK',
  'en-US',
] as const;
export type AppLocale = (typeof supportedAppLocales)[number];

// ---------------------------------------------------------------------------
// 2. 各库的 locale 注册表
//    key = 库名称, value = 该库支持的语言 → locale 配置 的映射
// ---------------------------------------------------------------------------

interface LibraryLocaleEntry<T> {
  supported: string[];
  map: Record<string, T | string>;
  fallback: string;
}

const libraryLocaleRegistry: Record<string, LibraryLocaleEntry<unknown>> = {
  antd: {
    supported: ['zh-CN', 'zh-TW', 'zh-HK', 'en-US'],
    map: {
      'zh-CN': zhCN,
      'zh-TW': zhTW,
      'zh-HK': zhHK,
      'en-US': enUS,
    },
    fallback: 'en-US',
  },
  dayjs: {
    supported: ['zh-cn', 'zh-tw', 'en'],
    map: {
      'zh-CN': 'zh-cn',
      'zh-TW': 'zh-tw',
      'zh-HK': 'zh-tw', // dayjs 无 zh-hk，降级到 zh-tw
      'en-US': 'en',
    },
    fallback: 'en',
  },
  umi: {
    supported: ['zh-CN', 'zh-TW', 'zh-HK', 'en-US'],
    map: {
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
      'zh-HK': 'zh-HK',
      'en-US': 'en-US',
    },
    fallback: 'zh-CN',
  },
};

// ---------------------------------------------------------------------------
// 3. 回退链
// ---------------------------------------------------------------------------

/**
 * 根据输入语言返回回退顺序。
 *
 * 规则：
 * - 中文语系优先回退到繁中或简中，不直接掉英文
 * - 英文作为最终公共兜底
 */
export function resolveFallbackChain(lang: string): string[] {
  const normalized = (lang || '').toLowerCase();

  // 中文语系
  if (normalized.startsWith('zh')) {
    if (normalized.includes('tw') || normalized.includes('hant')) {
      // 繁中系：zh-TW → zh-CN → en-US
      return ['zh-TW', 'zh-CN', 'en-US'];
    }
    if (normalized.includes('hk') || normalized.includes('mo')) {
      // 港澳：zh-HK → zh-TW → zh-CN → en-US
      return ['zh-HK', 'zh-TW', 'zh-CN', 'en-US'];
    }
    // 简中系：zh-CN → zh-TW → en-US
    return ['zh-CN', 'zh-TW', 'en-US'];
  }

  // 非中文：直接回退到英文
  return [lang, 'en-US'].filter(Boolean);
}

// ---------------------------------------------------------------------------
// 4. 从回退链中挑选该库支持的 locale
// ---------------------------------------------------------------------------

/**
 * 根据库的注册信息，从回退链中挑出该库真正支持的 locale key。
 */
export function pickSupportedLocale(
  libraryName: string,
  lang: string,
): string | null {
  const registry = libraryLocaleRegistry[libraryName];
  if (!registry) return null;

  const chain = resolveFallbackChain(lang);

  for (const candidate of chain) {
    // 先尝试精确匹配注册表 map 的 key
    if (registry.map[candidate]) return candidate;
    // 再尝试匹配 supported 列表
    if (registry.supported.includes(candidate)) return candidate;
  }

  return registry.fallback;
}

// ---------------------------------------------------------------------------
// 5. 各库的 adapter 函数
// ---------------------------------------------------------------------------

/**
 * 获取 antd locale 对象
 */
export function getAntdLocale(lang: string): Locale {
  const registry = libraryLocaleRegistry.antd;
  const localeKey = pickSupportedLocale('antd', lang);
  return (localeKey && registry.map[localeKey]) || enUS;
}

/**
 * 获取 dayjs locale 字符串并应用
 */
export function applyDayjsLocale(lang: string): string {
  const registry = libraryLocaleRegistry.dayjs;
  const localeKey = pickSupportedLocale('dayjs', lang);
  const dayjsLocale =
    (localeKey && (registry.map[localeKey] as string)) || 'en';
  dayjs.locale(dayjsLocale);
  return dayjsLocale;
}

/**
 * 获取 Umi locale key
 */
export function getUmiLocaleKey(lang: string): string {
  const registry = libraryLocaleRegistry.umi;
  const localeKey = pickSupportedLocale('umi', lang);
  return (localeKey && (registry.map[localeKey] as string)) || 'zh-CN';
}

// ---------------------------------------------------------------------------
// 6. 统一同步函数：一次性同步所有第三方库
// ---------------------------------------------------------------------------

/**
 * 同步所有依赖 locale 的第三方库。
 * 在 setCurrentLang() 中调用。
 */
export function syncAllLocaleSystems(lang: string): void {
  // dayjs 同步（同步调用）
  applyDayjsLocale(lang);

  // Umi locale 同步 → 驱动 _LocaleContainer 的 antd ConfigProvider 更新
  import('umi')
    .then(({ setLocale }) => {
      setLocale(getUmiLocaleKey(lang), false);
    })
    .catch(() => {
      // Umi 不可用时静默忽略
    });
}

// ---------------------------------------------------------------------------
// 7. 通用工具：获取 JS 原生 toLocaleString 使用的 locale 标识
// ---------------------------------------------------------------------------

/** 将内部语言标识转换为 JS Intl / toLocaleString 使用的 BCP 47 locale */
const jsLocaleMap: Record<string, string> = {
  'zh-cn': 'zh-CN',
  'zh-tw': 'zh-TW',
  'zh-hk': 'zh-HK',
  'en-us': 'en-US',
};

export function getJsLocale(lang: string): string {
  return jsLocaleMap[(lang || '').toLowerCase()] || 'en-US';
}
