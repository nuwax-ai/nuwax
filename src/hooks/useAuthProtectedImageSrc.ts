import {
  fetchAuthProtectedFileBlobUrl,
  isAuthProtectedFileUrl,
  resolveAuthProtectedFileFetchUrl,
} from '@/utils/authProtectedFileUrl';
import { getBusinessFileRequestAuth } from '@/utils/businessAuth';
import { useEffect, useState } from 'react';

interface UseAuthProtectedImageSrcResult {
  /** Cookie 环境保留原始地址；开发浏览器需要 Bearer 时使用带鉴权获取的 blob。 */
  displaySrc?: string;
  loading: boolean;
  error: boolean;
}

export function useAuthProtectedImageSrc(
  remoteUrl: string | undefined,
): UseAuthProtectedImageSrcResult {
  const displaySrc = remoteUrl?.trim()
    ? isAuthProtectedFileUrl(remoteUrl)
      ? resolveAuthProtectedFileFetchUrl(remoteUrl)
      : remoteUrl
    : undefined;
  // img 无法带 Authorization；只对当前业务域名的开发 Token 请求使用 fetch。
  const fetchSrc =
    displaySrc &&
    isAuthProtectedFileUrl(displaySrc) &&
    getBusinessFileRequestAuth(displaySrc).headers.Authorization
      ? displaySrc
      : undefined;
  const [fetched, setFetched] = useState<{
    source: string;
    url?: string;
    error?: boolean;
  }>();
  useEffect(() => {
    if (!fetchSrc) return;
    setFetched(undefined);
    let active = true;
    let objectUrl: string | undefined;
    void fetchAuthProtectedFileBlobUrl(fetchSrc).then(
      (url) => {
        if (!active) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setFetched({ source: fetchSrc, url });
      },
      () => {
        if (active) setFetched({ source: fetchSrc, error: true });
      },
    );
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fetchSrc]);
  if (!fetchSrc) return { displaySrc, loading: false, error: false };
  const current = fetched?.source === fetchSrc ? fetched : undefined;
  return {
    displaySrc: current?.url,
    loading: !current,
    error: current?.error === true,
  };
}
