// organize-imports-ignore：qiankun dev refresh 桩必须先于任何 JSX 依赖求值。
import './qiankun-setup';
import {
  exportQiankunLifeCycles,
  qiankunWindow,
} from '@tiny-codes/vite-plugin-qiankun';
import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from './App';
import './host.css';
import HostRouter from './HostRouter';
import { resetLibraryNavCache } from './components/LibraryNav';
import {
  beginRepoRuntime,
  endRepoRuntime,
  updateRepoRuntime,
  type RepoHostProps,
} from './hostRuntime';
import './index.css';
import { initTreeBroadcast } from './lib/treeBroadcast';

let root: Root | null = null;
let disposeBroadcast: (() => void) | null = null;

function render(props: RepoHostProps = {}, embedded = false): void {
  if (root !== null) throw new Error('资料库实例尚未卸载，拒绝重复挂载');
  const element = embedded
    ? props.container?.querySelector<HTMLElement>('#root')
    : document.getElementById('root');
  if (element === null || element === undefined)
    throw new Error('资料库入口缺少应用内 #root 容器');
  // Vite ESM 模块在卸载后仍可能复用；只在真正重挂时清账户数据缓存，隐藏保活不受影响。
  resetLibraryNavCache();
  beginRepoRuntime(element, props, embedded);
  disposeBroadcast = initTreeBroadcast();
  root = createRoot(element);
  root.render(
    <StrictMode>
      <HostRouter embedded={embedded}>
        <App />
      </HostRouter>
    </StrictMode>,
  );
}

exportQiankunLifeCycles({
  name: 'nuwax-repo-web',
  mount: async (props) => render(props as RepoHostProps, true),
  update: async (props) => updateRepoRuntime(props as RepoHostProps),
  unmount: async () => {
    try {
      root?.unmount();
    } finally {
      root = null;
      disposeBroadcast?.();
      disposeBroadcast = null;
      endRepoRuntime();
    }
  },
});

if (!qiankunWindow.__POWERED_BY_QIANKUN__) render();
