/**
 * 判断会话里的链接是不是资料库，并解析成可嵌入预览的绝对地址。
 *
 * 路径以 `/repo/` 开头即算资料库（如 `/repo/doc/`、`/repo/share/`）。
 * 只接受当前页面或 BASE_URL 同源的 http(s) 地址，避免把外站链接嵌进预览 iframe。
 * Chat 与 AppDevPro 共用，避免两套相同判断。
 */

/**
 * 路径是否落在资料库下。
 *
 * @param pathname URL 的 pathname
 * @returns 以 `/repo/` 开头时为 true
 */
const isRepoPathname = (pathname: string): boolean =>
  pathname.startsWith('/repo/');

/**
 * 路径或完整地址是不是资料库。
 *
 * @param value 相对路径或绝对 URL。完整地址按 pathname 判断。
 * @returns pathname 以 `/repo/` 开头时为 true
 */
export const isRepoLibraryPath = (value: string): boolean => {
  const raw = value?.trim();
  if (!raw) {
    return false;
  }

  if (raw.startsWith('/')) {
    return isRepoPathname(raw.split(/[?#]/)[0]);
  }

  try {
    return isRepoPathname(new URL(raw).pathname);
  } catch {
    return false;
  }
};

/** 嵌入当前页时只展示文档正文，并收起资料库侧栏表格。 */
const REPO_DOC_EMBED_QUERY = {
  just_show_content: 'true',
  hide_sheet: 'true',
} as const;

/** 收集允许嵌入的源站：当前页 origin，以及配置的 BASE_URL origin。 */
const collectAllowedOrigins = (allowedOrigins?: string[]): string[] => {
  if (allowedOrigins) {
    return allowedOrigins;
  }
  const origins: string[] = [];
  if (typeof window !== 'undefined' && window.location?.origin) {
    origins.push(window.location.origin);
  }
  const baseUrl = process.env.BASE_URL;
  if (baseUrl) {
    try {
      origins.push(new URL(baseUrl).origin);
    } catch {
      // BASE_URL 不是合法绝对地址时忽略，相对链接仍按当前页解析。
    }
  }
  return origins;
};

/**
 * 解析资料库文档链接。
 *
 * @param href 锚点上的原始地址，可以是相对路径或绝对 URL
 * @param options.base 相对路径的解析基准，默认当前页 origin
 * @param options.allowedOrigins 允许嵌入的源站列表；不传则用当前页和 BASE_URL
 * @returns 可交给页面预览 iframe 的绝对 URL，并带上只看正文的查询参数；不是资料库链接时返回 null
 */
export const resolveRepoDocEmbedUrl = (
  href: string,
  options?: { base?: string; allowedOrigins?: string[] },
): string | null => {
  const raw = href?.trim();
  if (!raw || raw.startsWith('#')) {
    return null;
  }

  const base =
    options?.base ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  if (!base) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(raw, base);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null;
  }
  if (!isRepoLibraryPath(url.pathname)) {
    return null;
  }

  const allowedOrigins = collectAllowedOrigins(options?.allowedOrigins);
  if (!allowedOrigins.includes(url.origin)) {
    return null;
  }

  Object.entries(REPO_DOC_EMBED_QUERY).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.href;
};
