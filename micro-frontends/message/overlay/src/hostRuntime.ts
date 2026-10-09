/** 消息仅有 store 内会话选择，不引入新的业务路由协议。 */
export const MESSAGE_BASE = '/instant-message';

export interface MessageHostProps {
  container?: HTMLElement;
  path?: string;
  navigationRevision?: number;
  active?: boolean;
  onNavigate?: (path: string, replace: boolean) => void;
  onAuthExpired?: (target: string) => void;
}

interface MessageHostSnapshot {
  path: string;
  navigationRevision: number;
  active: boolean;
}

let snapshot: MessageHostSnapshot = {
  path: MESSAGE_BASE,
  navigationRevision: 0,
  active: true,
};
let root: HTMLElement | null = null;
let embedded = false;
let onAuthExpired: MessageHostProps['onAuthExpired'];
let disposeFocus: (() => void) | null = null;
let restoreStandaloneBody: (() => void) | null = null;
let requestGeneration = 0;
let requestsDisposed = false;

interface NativeImNotifications {
  setNotificationEnabled?: (enabled: boolean) => Promise<void>;
}

/** 微应用独立构建，不能 import 主站 utils；只消费受信 preload 的最小能力。 */
function getNativeImNotifications(): NativeImNotifications | undefined {
  if (typeof window === 'undefined') return undefined;
  return (
    window as Window & {
      NuwaClawBridge?: { im?: NativeImNotifications };
    }
  ).NuwaClawBridge?.im;
}

export function isNativeMessageNotifications(): boolean {
  return (
    typeof getNativeImNotifications()?.setNotificationEnabled === 'function'
  );
}

export function setNativeMessageNotificationEnabled(enabled: boolean): void {
  if (requestsDisposed) return;
  try {
    void getNativeImNotifications()
      ?.setNotificationEnabled?.(enabled)
      ?.catch(() => undefined);
  } catch {
    // 壳不支持或已经退出时保留本地开关，不阻断页面交互。
  }
}

/** 请求在发起时记录代次；隐藏保活不换代，真卸载立即阻止晚到的鉴权副作用。 */
export const getMessageRequestGeneration = (): number => requestGeneration;
export const isMessageRequestCurrent = (generation: number): boolean =>
  !requestsDisposed && generation === requestGeneration;
export function invalidateMessageRequests(): void {
  requestsDisposed = true;
}

export function normalizeMessagePath(path: unknown): string | null {
  if (
    typeof path !== 'string' ||
    !/^\/instant-message(?:\/|[?#]|$)/.test(path)
  ) {
    return null;
  }
  const url = new URL(path, window.location.origin);
  if (
    url.pathname !== MESSAGE_BASE &&
    !url.pathname.startsWith(`${MESSAGE_BASE}/`)
  ) {
    return null;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function beginMessageRuntime(
  appRoot: HTMLElement,
  props: MessageHostProps,
  isEmbedded: boolean,
): void {
  requestGeneration += 1;
  requestsDisposed = false;
  root = appRoot;
  embedded = isEmbedded;
  onAuthExpired = props.onAuthExpired;
  snapshot = {
    navigationRevision: props.navigationRevision ?? 0,
    path:
      normalizeMessagePath(props.path) ??
      normalizeMessagePath(
        window.location.pathname +
          window.location.search +
          window.location.hash,
      ) ??
      MESSAGE_BASE,
    active: props.active !== false,
  };
  root.setAttribute('data-message-app-scope', '');
  root.setAttribute('data-message-embedded', String(isEmbedded));
  if (isEmbedded) {
    root.tabIndex = -1;
    // 点消息区空白后焦点留在子根，⌘V 仍能被本应用捕获；不会抢编辑器或按钮焦点。
    const focusRoot = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const interactive = target?.closest(
        'input,textarea,button,a,[tabindex],[contenteditable="true"]',
      );
      if (
        snapshot.active &&
        (interactive === null ||
          interactive === undefined ||
          interactive === root)
      ) {
        root?.focus({ preventScroll: true });
      }
    };
    root.addEventListener('pointerdown', focusRoot);
    disposeFocus = () => appRoot.removeEventListener('pointerdown', focusRoot);
  } else {
    const margin = document.body.style.margin;
    document.body.style.margin = '0';
    restoreStandaloneBody = () => {
      document.body.style.margin = margin;
    };
  }
}

export function updateMessageRuntime(props: MessageHostProps): void {
  if (props.onAuthExpired !== undefined) onAuthExpired = props.onAuthExpired;
  const active = props.active ?? snapshot.active;
  snapshot = {
    active,
    navigationRevision: props.navigationRevision ?? snapshot.navigationRevision,
    // 隐藏时不吞主站/资料库路径，恢复继续保留消息自己的当前位置。
    path: active
      ? normalizeMessagePath(props.path) ?? snapshot.path
      : snapshot.path,
  };
}

export const getMessageHostSnapshot = (): MessageHostSnapshot => snapshot;
export const isMessageEmbedded = (): boolean => embedded;
export const isMessageActive = (): boolean => !embedded || snapshot.active;
export const getMessagePortalRoot = (): HTMLElement => root ?? document.body;

/** fixed 菜单以内嵌子根的 padding 包含块定位；独立页继续使用视口坐标。 */
export function toMessagePortalPoint(
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  if (!embedded || root === null) return { x: clientX, y: clientY };
  const rect = root.getBoundingClientRect();
  return {
    x: clientX - rect.left - root.clientLeft,
    y: clientY - rect.top - root.clientTop,
  };
}

// 保留 Document 的完整事件重载，输入监听实际注册在子根或独立页 document。
export const getMessageInputRoot = (): Pick<
  Document,
  'addEventListener' | 'removeEventListener'
> => (embedded && root !== null ? root : document) as Document;

export function getMessageElementById(id: string): HTMLElement | null {
  if (!embedded || root === null) return document.getElementById(id);
  return (
    Array.from(root.querySelectorAll<HTMLElement>('[id]')).find(
      (element) => element.id === id,
    ) ?? null
  );
}

export function redirectMessageAuth(target: string): void {
  if (embedded && onAuthExpired) onAuthExpired(target);
  else window.location.replace(target);
}

export function endMessageRuntime(): void {
  invalidateMessageRequests();
  disposeFocus?.();
  disposeFocus = null;
  restoreStandaloneBody?.();
  restoreStandaloneBody = null;
  root?.removeAttribute('data-message-app-scope');
  root?.removeAttribute('data-message-embedded');
  root = null;
  embedded = false;
  onAuthExpired = undefined;
  snapshot = { path: MESSAGE_BASE, navigationRevision: 0, active: true };
}
