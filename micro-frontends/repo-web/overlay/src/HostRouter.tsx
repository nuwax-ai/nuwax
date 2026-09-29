import {
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  BrowserRouter,
  MemoryRouter,
  useLocation,
  useNavigate,
  useNavigationType,
} from 'react-router-dom';
import {
  getRepoHostSnapshot,
  recordRepoNavigation,
  REPO_BASE,
  subscribeRepoHost,
  toRepoRoute,
} from './hostRuntime';

function HostRouteBridge() {
  const host = useSyncExternalStore(
    subscribeRepoHost,
    getRepoHostSnapshot,
    getRepoHostSnapshot,
  );
  const location = useLocation();
  const navigate = useNavigate();
  const action = useNavigationType();
  const path = `${REPO_BASE}${location.pathname}${location.search}${location.hash}`;
  const lastCommand = useRef(host.command);
  const awaitingPath = useRef<string | null>(null);
  const previousPath = useRef(path);

  // update 驱动内存路由，只在宿主下达新命令时处理，避免业务跳转和宿主回传相互覆盖。
  useLayoutEffect(() => {
    if (lastCommand.current === host.command) return;
    lastCommand.current = host.command;
    if (!host.active || host.path === path) return;
    awaitingPath.current = host.path;
    navigate(toRepoRoute(host.path), { replace: true });
  }, [host.command, host.active, host.path, navigate, path]);

  useEffect(() => {
    if (awaitingPath.current !== null) {
      if (awaitingPath.current !== path) return;
      awaitingPath.current = null;
      previousPath.current = path;
      return;
    }
    if (previousPath.current === path) return;
    previousPath.current = path;
    // 隐藏期间仍允许业务保存内部路径，runtime 不向宿主发送导航。
    recordRepoNavigation(path, action !== 'PUSH');
  }, [path, action]);

  return null;
}

export default function HostRouter({
  children,
  embedded,
}: {
  children: ReactNode;
  embedded: boolean;
}) {
  const initialPath = useRef(getRepoHostSnapshot().path);
  if (!embedded) {
    return (
      <BrowserRouter basename={REPO_BASE} useTransitions={false}>
        {children}
      </BrowserRouter>
    );
  }
  // 保留 main 的 useTransitions=false；两套 React Router 的 history 完全分开。
  return (
    <MemoryRouter
      basename={REPO_BASE}
      initialEntries={[initialPath.current]}
      useTransitions={false}
    >
      <HostRouteBridge />
      {children}
    </MemoryRouter>
  );
}
