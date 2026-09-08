import { ACCESS_TOKEN } from '@/constants/home.constants';

export interface FilePathPreviewTarget {
  conversationId: number;
  path: string;
  customTargetDir?: string;
}

export class FilePathPreviewError extends Error {
  constructor(public readonly reason: 'path' | 'missing' | 'denied' | 'load') {
    super(reason);
  }
}

/** 输入为当前数据源根起算的文件路径，不对文件名中的百分号做二次解码。 */
export function buildFilePathPreviewUrl(target: FilePathPreviewTarget): string {
  const path = target.path.trim().replace(/\\/g, '/');
  const parts = path.split('/');
  if (
    !Number.isSafeInteger(target.conversationId) ||
    target.conversationId <= 0 ||
    !path ||
    /^(?:\/|[a-z][a-z\d+.-]*:)/i.test(path) ||
    parts.some((part) => !part || part === '.' || part === '..') ||
    /[\u0000-\u001f\u007f]/.test(path)
  ) {
    throw new FilePathPreviewError('path');
  }
  const url = `/api/computer/static/${target.conversationId}/${parts
    .map(encodeURIComponent)
    .join('/')}`;
  return target.customTargetDir
    ? `${url}?customTargetDir=${encodeURIComponent(target.customTargetDir)}`
    : url;
}

/** 先通过有认证、无缓存的请求拉取，再交给预览器，避免预览器重新裸请求。 */
export async function loadFilePathPreview(
  target: FilePathPreviewTarget,
  signal: AbortSignal,
): Promise<File> {
  const url = buildFilePathPreviewUrl(target);
  const token = localStorage.getItem(ACCESS_TOKEN) || '';
  const response = await fetch(`${process.env.BASE_URL || ''}${url}`, {
    signal,
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new FilePathPreviewError(
      response.status === 404
        ? 'missing'
        : response.status === 401 || response.status === 403
        ? 'denied'
        : 'load',
    );
  }
  const blob = await response.blob();
  const name = target.path.trim().split(/[\\/]/).pop()!;
  return new File([blob], name, { type: blob.type });
}
