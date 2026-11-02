import type {
  HostLocalFilesBridge,
  LocalFilesCapabilities,
} from '@/types/interfaces/hostBridge';

let identities = new WeakMap<object, string>();

/** 服务暂不可用不代表用户选了另一台电脑；记忆仅属于当前桥和登录代次。 */
export function matchesLocalComputer(
  api: Partial<HostLocalFilesBridge>,
  caps: LocalFilesCapabilities | null | undefined,
  sandboxId: string,
): boolean {
  if (
    caps?.available &&
    Number.isInteger(caps.apiVersion) &&
    caps.apiVersion >= 1 &&
    caps.sandboxId
  )
    identities.set(api, caps.sandboxId);
  return !!sandboxId && identities.get(api) === sandboxId;
}

export function clearLocalComputerIdentity(): void {
  identities = new WeakMap();
}
