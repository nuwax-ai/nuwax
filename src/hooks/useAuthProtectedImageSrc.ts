import {
  fetchAuthProtectedFileBlobUrl,
  isAuthProtectedFileUrl,
} from '@/utils/authProtectedFileUrl';
import { useEffect, useState } from 'react';

interface UseAuthProtectedImageSrcResult {
  /** 可直接用于 img / antd Image 的地址 */
  displaySrc?: string;
  loading: boolean;
  error: boolean;
}

/**
 * 展示受保护文件图片：公开 URL 原样返回，/api/f/ 等需鉴权地址走 Bearer fetch + blob。
 */
export function useAuthProtectedImageSrc(
  remoteUrl: string | undefined,
): UseAuthProtectedImageSrcResult {
  const [displaySrc, setDisplaySrc] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!remoteUrl?.trim()) {
      setDisplaySrc(undefined);
      setLoading(false);
      setError(false);
      return;
    }

    if (!isAuthProtectedFileUrl(remoteUrl)) {
      setDisplaySrc(remoteUrl);
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    let blobUrl: string | undefined;

    setLoading(true);
    setError(false);
    setDisplaySrc(undefined);

    fetchAuthProtectedFileBlobUrl(remoteUrl)
      .then((objectUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        blobUrl = objectUrl;
        setDisplaySrc(objectUrl);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [remoteUrl]);

  return { displaySrc, loading, error };
}
