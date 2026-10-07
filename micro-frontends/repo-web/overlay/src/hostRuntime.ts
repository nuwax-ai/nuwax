/** 宿主适配只在隔离产物内生效，不向业务 main 写入平台假设。 */
export const REPO_BASE = '/repo';

export interface RepoHostProps {
  container?: HTMLElement;
  path?: string;
  active?: boolean;
  onNavigate?: (path: string, replace: boolean) => void;
  onAuthExpired?: (target: string) => void;
}

interface HostSnapshot {
  path: string;
  active: boolean;
  command: number;
}

let snapshot: HostSnapshot = { path: '/repo/', active: true, command: 0 };
let root: HTMLElement | null = null;
let embedded = false;
let onNavigate: RepoHostProps['onNavigate'];
let onAuthExpired: RepoHostProps['onAuthExpired'];
let runtimeGeneration = 0;
const listeners = new Set<() => void>();

/** 仅接受本应用路径；宿主其它模块路径不能落入资料库 MemoryRouter。 */
export function normalizeRepoPath(path: unknown): string | null {
  if (typeof path !== 'string' || !/^\/repo(?:\/|[?#]|$)/.test(path))
    return null;
  const url = new URL(path, window.location.origin);
  if (url.pathname !== REPO_BASE && !url.pathname.startsWith(`${REPO_BASE}/`))
    return null;
  const pathname = url.pathname === REPO_BASE ? `${REPO_BASE}/` : url.pathname;
  return `${pathname}${url.search}${url.hash}`;
}

export function toRepoRoute(path: string): string {
  return path.slice(REPO_BASE.length) || '/';
}

function publish(next: HostSnapshot): void {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export function beginRepoRuntime(
  appRoot: HTMLElement,
  props: RepoHostProps,
  isEmbedded: boolean,
): void {
  root = appRoot;
  embedded = isEmbedded;
  onNavigate = props.onNavigate;
  onAuthExpired = props.onAuthExpired;
  runtimeGeneration += 1;
  const initialPath =
    normalizeRepoPath(props.path) ??
    normalizeRepoPath(
      window.location.pathname + window.location.search + window.location.hash,
    ) ??
    '/repo/';
  snapshot = { path: initialPath, active: props.active !== false, command: 0 };
  root.setAttribute('data-repo-app-scope', '');
  root.setAttribute('data-repo-embedded', String(isEmbedded));
}

export function updateRepoRuntime(props: RepoHostProps): void {
  if (props.onNavigate !== undefined) onNavigate = props.onNavigate;
  if (props.onAuthExpired !== undefined) onAuthExpired = props.onAuthExpired;
  const active = props.active ?? snapshot.active;
  // 隐藏时忽略宿主路径，保持自己的浏览位置；重新激活才接收本应用深链。
  const path = active
    ? normalizeRepoPath(props.path) ?? snapshot.path
    : snapshot.path;
  if (active === snapshot.active && path === snapshot.path) return;
  publish({ path, active, command: snapshot.command + 1 });
}

export function recordRepoNavigation(path: string, replace: boolean): void {
  const next = normalizeRepoPath(path);
  if (next === null || next === snapshot.path) return;
  const active = snapshot.active;
  publish({ ...snapshot, path: next });
  if (active) onNavigate?.(next, replace);
}

export const getRepoHostSnapshot = (): HostSnapshot => snapshot;
export const subscribeRepoHost = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const isRepoEmbedded = (): boolean => embedded;
export const getRepoPortalRoot = (): HTMLElement => root ?? document.body;

/** fixed 弹层的包含块是内嵌子根；独立页继续使用浏览器视口。 */
export function getRepoPortalViewport() {
  if (!embedded || root === null) {
    return {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
  const rect = root.getBoundingClientRect();
  return {
    left: rect.left + root.clientLeft,
    top: rect.top + root.clientTop,
    width: root.clientWidth,
    height: root.clientHeight,
  };
}

export function toRepoPortalPoint(clientX: number, clientY: number) {
  const viewport = getRepoPortalViewport();
  return { left: clientX - viewport.left, top: clientY - viewport.top };
}

export function toRepoPortalRect(
  rect: Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>,
) {
  const viewport = getRepoPortalViewport();
  return {
    left: rect.left - viewport.left,
    right: rect.right - viewport.left,
    top: rect.top - viewport.top,
    bottom: rect.bottom - viewport.top,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
  };
}

/** 保留 main 的预留空间，嵌入小容器时额外防止负坐标落到根外。 */
export function limitRepoPortalOffset(
  value: number,
  reserve: number,
  axis: 'x' | 'y',
) {
  const viewport = getRepoPortalViewport();
  const next = Math.min(
    value,
    (axis === 'x' ? viewport.width : viewport.height) - reserve,
  );
  return embedded ? Math.max(0, next) : next;
}

export function getRepoMentionPosition(
  rect: Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>,
  width: number,
  height: number,
) {
  const local = toRepoPortalRect(rect);
  const viewport = getRepoPortalViewport();
  const margin = 8;
  const left = Math.max(
    margin,
    Math.min(local.left, viewport.width - width - margin),
  );
  let top = local.bottom + 4;
  if (embedded) {
    if (
      top + height > viewport.height - margin &&
      local.top - height - 4 >= margin
    ) {
      top = local.top - height - 4;
    }
    top = Math.max(margin, Math.min(top, viewport.height - height - margin));
  }
  return { left, top };
}
/** 内嵌的快捷键/复制限制只绑定自己的内容树；保活隐藏后不会拦截主站输入。 */
export const getRepoInputRoot = (): Pick<
  Document,
  'addEventListener' | 'removeEventListener'
> =>
  (embedded && root !== null ? root : document) as unknown as Pick<
    Document,
    'addEventListener' | 'removeEventListener'
  >;

/** 嵌入时 title 归宿主；独立模式保持 main 的站点/文档标题行为。 */
export function setRepoDocumentTitle(title: string): void {
  if (!embedded) document.title = title;
}

/** 每次请求捕获自己的实例；旧账号迟到的 401 不能使新实例/新登录态失效。 */
export function captureRepoAuthRedirect(): (target: string) => void {
  const generation = runtimeGeneration;
  const callback = onAuthExpired;
  const isEmbedded = embedded;
  return (target) => {
    if (root === null || runtimeGeneration !== generation) return;
    if (isEmbedded) callback?.(target);
    else window.location.href = target;
  };
}

export function endRepoRuntime(): void {
  root?.removeAttribute('data-repo-app-scope');
  root?.removeAttribute('data-repo-embedded');
  root = null;
  embedded = false;
  onNavigate = undefined;
  onAuthExpired = undefined;
  runtimeGeneration += 1;
  listeners.clear();
  snapshot = { path: '/repo/', active: true, command: 0 };
}
