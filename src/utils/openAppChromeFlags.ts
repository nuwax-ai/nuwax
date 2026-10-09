/**
 * 独立会话页（OpenApp / AppDetails / /app/chat）可通过 URL query 隐藏的 chrome 开关。
 * 仅当值为字面量 `true` 时生效，与既有 hideMenu 约定一致。
 */

export const OPEN_APP_CHROME_FLAG_KEYS = [
  'hideMenu',
  'hideNew',
  'hideTitle',
  'hideTerminal',
  'hideTree',
] as const;

export type OpenAppChromeFlagKey = (typeof OPEN_APP_CHROME_FLAG_KEYS)[number];

export interface OpenAppChromeFlags {
  /** 隐藏展开导航图标，并默认收起独立会话侧栏 */
  hideMenu: boolean;
  /** 隐藏新建会话图标，以及输入框中的清空会话记录图标 */
  hideNew: boolean;
  /** 隐藏会话主题 */
  hideTitle: boolean;
  /** 隐藏终端图标 */
  hideTerminal: boolean;
  /** 隐藏文件树图标 */
  hideTree: boolean;
}

export const EMPTY_OPEN_APP_CHROME_FLAGS: OpenAppChromeFlags = {
  hideMenu: false,
  hideNew: false,
  hideTitle: false,
  hideTerminal: false,
  hideTree: false,
};

/** query 值为字面量 `true` 时视为开启 */
export const isQueryFlagTrue = (value: string | null): boolean =>
  value === 'true';

/**
 * 从 search 字符串或 URLSearchParams 解析独立会话 chrome 隐藏开关。
 * @param search `?hideMenu=true` 或 `hideMenu=true` 或 URLSearchParams
 */
export const parseOpenAppChromeFlags = (
  search: string | URLSearchParams = '',
): OpenAppChromeFlags => {
  const params =
    typeof search === 'string'
      ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
      : search;
  return {
    hideMenu: isQueryFlagTrue(params.get('hideMenu')),
    hideNew: isQueryFlagTrue(params.get('hideNew')),
    hideTitle: isQueryFlagTrue(params.get('hideTitle')),
    hideTerminal: isQueryFlagTrue(params.get('hideTerminal')),
    hideTree: isQueryFlagTrue(params.get('hideTree')),
  };
};

/**
 * 把当前 URL 中已开启的 hide* 开关追加到目标路径，避免会话跳转后丢失。
 * 目标路径已有 query 时合并，不覆盖已有同名参数。
 */
export const appendOpenAppChromeFlags = (
  path: string,
  search: string = typeof window !== 'undefined' ? window.location.search : '',
): string => {
  const incoming = parseOpenAppChromeFlags(search);
  const questionIndex = path.indexOf('?');
  const base = questionIndex >= 0 ? path.slice(0, questionIndex) : path;
  const existingQuery = questionIndex >= 0 ? path.slice(questionIndex + 1) : '';
  const merged = new URLSearchParams(existingQuery);
  OPEN_APP_CHROME_FLAG_KEYS.forEach((key) => {
    if (incoming[key] && !merged.has(key)) {
      merged.set(key, 'true');
    }
  });
  const qs = merged.toString();
  return qs ? `${base}?${qs}` : base;
};
