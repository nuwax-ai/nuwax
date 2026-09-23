import {
  isAuthProtectedFileUrl,
  resolveAuthProtectedFileFetchUrl,
} from '@/utils/authProtectedFileUrl';

interface UseAuthProtectedImageSrcResult {
  /** Real URL stays on the element so copy-image-address remains useful. */
  displaySrc?: string;
  loading: boolean;
  error: boolean;
}

/** Browser and Electron webview both attach their ticket cookie to image loads. */
export function useAuthProtectedImageSrc(
  remoteUrl: string | undefined,
): UseAuthProtectedImageSrcResult {
  const displaySrc = remoteUrl?.trim()
    ? isAuthProtectedFileUrl(remoteUrl)
      ? resolveAuthProtectedFileFetchUrl(remoteUrl)
      : remoteUrl
    : undefined;
  return { displaySrc, loading: false, error: false };
}
