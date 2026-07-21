/** localStorage 中访问令牌的 key，与 constants/home.constants 保持一致 */
const ACCESS_TOKEN_KEY = 'ACCESS_TOKEN';
const AUTH_PROTECTED_FILE_PATH_RE = /\/api\/f\//i;

/**
 * 判断 URL 是否为需 Bearer 鉴权才能加载的文件地址。
 */
export function isAuthProtectedFileUrl(url: string | undefined): boolean {
  if (!url?.trim()) {
    return false;
  }

  try {
    const parsed = /^https?:\/\//i.test(url)
      ? new URL(url)
      : new URL(
          url.startsWith('/') ? url : `/${url}`,
          process.env.BASE_URL || window.location.origin,
        );
    return AUTH_PROTECTED_FILE_PATH_RE.test(parsed.pathname);
  } catch {
    return AUTH_PROTECTED_FILE_PATH_RE.test(url);
  }
}

/**
 * 将相对或绝对文件 URL 规范化为可 fetch 的完整地址。
 */
export function resolveAuthProtectedFileFetchUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${process.env.BASE_URL || ''}${normalizedPath}`;
}

/**
 * 携带登录态拉取受保护文件并返回 blob object URL，供 img / Image 展示。
 * 调用方需在卸载时 revokeObjectURL。
 */
export async function fetchAuthProtectedFileBlobUrl(
  url: string,
): Promise<string> {
  const fetchUrl = resolveAuthProtectedFileFetchUrl(url);
  const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? '';
  const response = await fetch(fetchUrl, {
    method: 'GET',
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error(`Failed to load protected file: ${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * 打开或下载远程文件：受保护地址带 Bearer 拉取后触发下载，公开地址新窗口打开。
 */
export async function openRemoteFileUrl(
  url: string,
  fileName?: string,
): Promise<void> {
  const resolvedName =
    fileName ||
    url.split('/').filter(Boolean).pop()?.split('?')[0] ||
    'download';

  if (isAuthProtectedFileUrl(url)) {
    const blobUrl = await fetchAuthProtectedFileBlobUrl(url);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = resolvedName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}
