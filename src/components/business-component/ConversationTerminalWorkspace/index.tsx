import { EVENT_TYPE } from '@/constants/event.constants';
import type { ConversationChangedEvent } from '@/types/directorySync';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import React, {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import {
  conversationTerminalStore,
  type ConversationTerminalWorkspaceProps,
} from './store';

const WorkspaceConsole = lazy(() => import('./WorkspaceConsole'));

/** 安装在应用根部；页面/预览卸载不影响门户内的 xterm、WebSocket 和容器保活。 */
export const ConversationTerminalHost: React.FC = () => {
  const entries = useSyncExternalStore(
    conversationTerminalStore.subscribe,
    conversationTerminalStore.getSnapshot,
    conversationTerminalStore.getSnapshot,
  );
  useEffect(() => {
    const deleted = (event: Event) => {
      const id = (event as CustomEvent<{ id?: number | string }>).detail?.id;
      if (id !== undefined) conversationTerminalStore.remove(Number(id));
    };
    const changed = (event: ConversationChangedEvent) => {
      if (event.operation === 'deleted')
        conversationTerminalStore.remove(Number(event.conversationId));
    };
    eventBus.on(
      EVENT_NAMES.AUTH_SESSION_CLEARED,
      conversationTerminalStore.clear,
    );
    eventBus.on(EVENT_TYPE.ConversationChanged, changed);
    window.addEventListener('conversation-deleted', deleted);
    return () => {
      eventBus.off(
        EVENT_NAMES.AUTH_SESSION_CLEARED,
        conversationTerminalStore.clear,
      );
      eventBus.off(EVENT_TYPE.ConversationChanged, changed);
      window.removeEventListener('conversation-deleted', deleted);
    };
  }, []);

  return (
    <>
      {entries.map((entry) =>
        createPortal(
          <Suspense fallback={null}>
            <WorkspaceConsole {...entry.props} />
          </Suspense>,
          entry.container,
          entry.key,
        ),
      )}
    </>
  );
};

/** 页面只持有挂载点；所有权令牌阻止旧页面 cleanup 拆掉新页面的同会话终端。 */
const ConversationTerminalWorkspace: React.FC<
  ConversationTerminalWorkspaceProps
> = (props) => {
  const mount = useRef<HTMLDivElement>(null);
  const owner = useRef<symbol>();
  const latestProps = useRef(props);
  latestProps.current = props;
  const { workspaceConversationId, sandboxId, wsUrl } = props;
  useLayoutEffect(() => {
    if (!mount.current) return;
    const token = Symbol('terminal-workspace-owner');
    owner.current = token;
    conversationTerminalStore.attach(latestProps.current, mount.current, token);
    return () =>
      conversationTerminalStore.detach(workspaceConversationId, token);
  }, [workspaceConversationId, sandboxId, wsUrl]);
  useLayoutEffect(() => {
    if (owner.current)
      conversationTerminalStore.update(
        workspaceConversationId,
        owner.current,
        props,
      );
  });
  return (
    <div
      ref={mount}
      style={{ display: 'contents' }}
      data-terminal-workspace={workspaceConversationId}
    />
  );
};

export default ConversationTerminalWorkspace;
