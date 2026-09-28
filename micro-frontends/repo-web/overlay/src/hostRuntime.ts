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
