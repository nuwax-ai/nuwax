import type { LocalFilesCapabilities } from '@/types/interfaces/hostBridge';
import { hostBridge } from '@/utils/hostBridge';

export type LocalDirectorySelection =
  | { canceled: true }
  | { canceled: false; path: string };

let directoryPickQueue: Promise<void> = Promise.resolve();

function matchesComputer(caps: LocalFilesCapabilities, sandboxId: string) {
  return (
    caps.available === true &&
    Number.isInteger(caps.apiVersion) &&
    caps.apiVersion >= 1 &&
    caps.sandboxId === sandboxId
  );
}

/** null 才允许旧目录弹窗；命中本机后的失败和取消不会改变路线。 */
export async function pickLocalWorkspaceDirectory(
  sandboxId: string,
  signal: AbortSignal,
): Promise<LocalDirectorySelection | null> {
  signal.throwIfAborted();
  const api = hostBridge.localFiles.getApi();
  if (!sandboxId || !api?.getCapabilities || !api.pickDirectory) return null;
  let caps: LocalFilesCapabilities;
  try {
    caps = await api.getCapabilities();
  } catch {
    signal.throwIfAborted();
    return null;
  }
  signal.throwIfAborted();
  if (!matchesComputer(caps, sandboxId)) return null;

  const checkIdentity = async () => {
    signal.throwIfAborted();
    if (
      hostBridge.localFiles.getApi() !== api ||
      !matchesComputer(await api.getCapabilities!(), sandboxId)
    ) {
      throw new Error('Local directory picker identity expired');
    }
    signal.throwIfAborted();
  };
  // 原生对话框不能由页面取消；旧请求结束后才能打开下一次，结果仍按各自 signal 隔离。
  const pending = directoryPickQueue.then(async () => {
    await checkIdentity();
    const result = await api.pickDirectory!();
    signal.throwIfAborted();
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
