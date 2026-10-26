import type { LocalFilesCapabilities } from '@/types/interfaces/hostBridge';
import { hostBridge } from '@/utils/hostBridge';

export type LocalDirectorySelection =
  | { canceled: true }
  | { canceled: false; path: string };

let directoryPickQueue: Promise<void> = Promise.resolve();

function matchesComputer(
  caps: LocalFilesCapabilities | null | undefined,
  sandboxId: string,
) {
  return (
    caps?.available === true &&
    Number.isInteger(caps.apiVersion) &&
    caps.apiVersion >= 1 &&
    caps.sandboxId === sandboxId
  );
}

function throwIfAborted(signal: AbortSignal) {
  // 旧浏览器已有 AbortController，但未必实现较新的 signal.throwIfAborted。
  if (signal.aborted)
    throw new DOMException('Directory selection canceled', 'AbortError');
}

/** null 才允许旧目录弹窗；命中本机后的失败和取消不会改变路线。 */
export async function pickLocalWorkspaceDirectory(
  sandboxId: string,
  signal: AbortSignal,
): Promise<LocalDirectorySelection | null> {
  throwIfAborted(signal);
  const api = hostBridge.localFiles.getApi();
  if (
    !sandboxId ||
    typeof api?.getCapabilities !== 'function' ||
    typeof api.pickDirectory !== 'function'
  )
    return null;
  let caps: LocalFilesCapabilities;
  try {
    caps = await api.getCapabilities();
  } catch {
    throwIfAborted(signal);
    return null;
  }
  throwIfAborted(signal);
  if (!matchesComputer(caps, sandboxId)) return null;

  const checkIdentity = async () => {
    throwIfAborted(signal);
    if (
      hostBridge.localFiles.getApi() !== api ||
      !matchesComputer(await api.getCapabilities!(), sandboxId)
    ) {
      throw new Error('Local directory picker identity expired');
    }
    throwIfAborted(signal);
  };
  // 原生对话框不能由页面取消；旧请求结束后才能打开下一次，结果仍按各自 signal 隔离。
  const pending = directoryPickQueue.then(async () => {
    await checkIdentity();
    const result = await api.pickDirectory!();
    throwIfAborted(signal);
    if (result.canceled) return { canceled: true } as const;
    await checkIdentity();
    const path = result.paths?.[0];
    if (typeof path !== 'string' || !/^(?:\/|[a-z]:[\\/]|\\\\)/i.test(path)) {
      throw new Error('Local directory picker returned no absolute path');
    }
    return { canceled: false, path } as const;
  });
  directoryPickQueue = pending.then(
    () => undefined,
    () => undefined,
  );
  return pending;
}
