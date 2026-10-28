import {
  getLocalFileReference,
  getLocalFilesContextKey,
  prepareLocalFilePreview,
  retryLocalFilesContext,
  useLocalFilesRevision,
  type LocalFileReference,
} from '@/features/client-shell/localFileService';
import { useCallback, useEffect, useState } from 'react';

/** 授权只活在当前预览实例；切源、刷新和卸载均撤销，迟到响应也立即撤销。 */
export function useLocalPreviewSource(
  source?: string | ArrayBuffer | Blob | File,
  localFile?: LocalFileReference,
  refreshKey?: number | string,
) {
  const [state, setState] = useState<{
    key: string;
    source?: typeof source;
    url?: string;
    baseUrl?: string;
    localFile?: LocalFileReference;
    error?: Error;
  }>();
  useLocalFilesRevision();
  const reference =
    localFile ??
    (typeof source === 'string' ? getLocalFileReference(source) : undefined) ??
    // 已授权的同一来源失效时用旧引用触发 expired，不能静默重新拉云端。
    (state?.source === source ? state?.localFile : undefined);
  const candidate =
    reference ??
    (typeof source === 'string' && /\/api\/computer\/static\/\d+\//.test(source)
      ? source
      : undefined);
  const identity = reference
    ? JSON.stringify([reference.contextId, reference.cId, reference.path])
    : '';
  const [retry, setRetry] = useState(0);
  const key = `${identity}\0${String(source)}\0${
    refreshKey ?? ''
  }\0${retry}\0${getLocalFilesContextKey(reference?.cId)}`;
  useEffect(() => {
    if (!candidate) return;
    let disposed = false;
    let release: (() => void) | undefined;
    void prepareLocalFilePreview(candidate)
      .then((preview) => {
        if (disposed) {
          preview?.release();
          return;
        }
        release = preview?.release;
        setState({
          key,
          source,
          url: preview?.url,
          baseUrl: preview?.baseUrl,
          localFile: preview
            ? reference ?? getLocalFileReference(String(source))
            : undefined,
        });
      })
      .catch((reason) => {
        if (!disposed)
          setState({
            key,
            source,
            localFile: reference,
            error: reason instanceof Error ? reason : new Error(String(reason)),
          });
      });
    return () => {
      disposed = true;
      release?.();
    };
    // reference 的内容身份已包含在 key，避免每次渲染创建对象重新授权。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return {
    source: candidate
      ? state?.key === key && !state.error
        ? state.url ?? source
        : undefined
      : source,
    baseUrl: state?.key === key ? state.baseUrl : undefined,
    isLocal: Boolean(state?.key === key && state.url),
    localFile: state?.key === key ? state.localFile : reference,
    loading: Boolean(candidate && state?.key !== key),
    error: state?.key === key ? state.error : undefined,
    refresh: useCallback(() => {
      retryLocalFilesContext(candidate);
      setRetry((value) => value + 1);
    }, [candidate]),
  };
}
