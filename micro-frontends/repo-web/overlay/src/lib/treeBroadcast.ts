/** 同源目录树广播：实例卸载时显式释放通道及监听，支持同一 ESM 模块重新挂载。 */
let dispose: (() => void) | null = null;

export function initTreeBroadcast(): () => void {
  if (dispose !== null) return dispose;
  if (typeof BroadcastChannel === 'undefined') return () => {};
  let channel: BroadcastChannel;
  try {
    channel = new BroadcastChannel('repo-tree-sync');
  } catch {
    return () => {};
  }
  const onChanged = (event: Event) => {
    const spaceId =
      (event as CustomEvent<{ spaceId?: number } | undefined>).detail
        ?.spaceId ?? null;
    try {
      channel.postMessage({ spaceId });
    } catch {
      /* 尽力同步，失败不阻断保存 */
    }
  };
  window.addEventListener('repo:tree-changed', onChanged);
  channel.onmessage = (event: MessageEvent<{ spaceId?: number | null }>) => {
    const spaceId = event.data?.spaceId;
    window.dispatchEvent(
      new CustomEvent('repo:tree-remote-changed', {
        detail:
          spaceId === null || spaceId === undefined ? undefined : { spaceId },
      }),
    );
  };
  dispose = () => {
    window.removeEventListener('repo:tree-changed', onChanged);
    channel.onmessage = null;
    channel.close();
    dispose = null;
  };
  return dispose;
}
