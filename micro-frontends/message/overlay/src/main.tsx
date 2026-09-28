// organize-imports-ignore
// dev refresh 沙箱桩必须先于任何组件模块求值。
import './qiankun-setup';
import {
  exportQiankunLifeCycles,
  qiankunWindow,
} from '@tiny-codes/vite-plugin-qiankun';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from './App';
import './host.css';
import {
  beginMessageRuntime,
  endMessageRuntime,
  getMessagePortalRoot,
  invalidateMessageRequests,
  isMessageActive,
  updateMessageRuntime,
  type MessageHostProps,
} from './hostRuntime';
import { clearCustomEventSubscribers } from './lib/customEvents';
import { disposeImNotifications } from './lib/notify';
import { resetTitleBase } from './lib/titleBadge';
import {
  beginImEmbeddedSession,
  disposeImEmbeddedSession,
  useChatStore,
} from './store/chat';
import './styles.css';

let root: Root | null = null;
let queryClient: QueryClient | null = null;

function render(props: MessageHostProps = {}, embedded = false): void {
  if (root !== null) throw new Error('消息实例尚未卸载，拒绝重复挂载');
  const element = embedded
    ? props.container?.querySelector<HTMLElement>('#root')
    : document.getElementById('root');
  if (element === null || element === undefined)
    throw new Error('消息入口缺少应用内 #root 容器');
  beginMessageRuntime(element, props, embedded);
  beginImEmbeddedSession();
  resetTitleBase();
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
    },
  });
  root = createRoot(element);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          locale={zhCN}
          prefixCls="nuwax-im"
          iconPrefixCls="nuwax-imicon"
          getPopupContainer={getMessagePortalRoot}
          getTargetContainer={getMessagePortalRoot}
        >
          <App />
        </ConfigProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}

exportQiankunLifeCycles({
  name: 'nuwax-im-web',
  mount: async (props) => render(props as MessageHostProps, true),
  update: async (props) => {
    updateMessageRuntime(props as MessageHostProps);
    // 从其它菜单回来时补已读仍走源仓的真实焦点/可见性判据。
    if (isMessageActive()) useChatStore.getState().flushPendingRead();
  },
  unmount: async () => {
    invalidateMessageRequests();
    try {
      root?.unmount();
    } finally {
      root = null;
      try {
        await queryClient?.cancelQueries();
      } finally {
        queryClient?.clear();
        queryClient = null;
        disposeImEmbeddedSession();
        disposeImNotifications();
        clearCustomEventSubscribers();
        resetTitleBase();
        endMessageRuntime();
      }
    }
  },
});

if (!qiankunWindow.__POWERED_BY_QIANKUN__) render();
