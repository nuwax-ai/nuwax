/**
 * 将地址栏输入解析为 iframe 可访问的预览地址。
 * 完整 URL 或已包含代理前缀时原样使用；否则拼到当前环境代理根路径后。
 *
 * @param input 地址栏输入
 * @param baseUrl 当前环境预览代理根路径
 * @returns 解析后的预览地址
 */
export const resolveUserAppPreviewNavigateUrl = (
  input: string,
  baseUrl: string,
): string => {
  const trimmed = input.trim();
  const base = (baseUrl || '').replace(/\/$/, '');
  if (!trimmed) {
    return base;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (base && (trimmed === base || trimmed.startsWith(`${base}/`))) {
    return trimmed;
  }
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
};
