import type React from 'react';
import { createContext, useContext } from 'react';
import type { ConversationWorkspaceActions } from './workspaceActions';

const ConversationWorkspaceContext =
  createContext<ConversationWorkspaceActions | null>(null);

/** 可由任意会话入口提供工作区动作，无需旧 conversationInfo model。 */
export function ConversationWorkspaceProvider({
  actions,
  children,
}: {
  actions: ConversationWorkspaceActions;
  children: React.ReactNode;
}) {
  return (
    <ConversationWorkspaceContext.Provider value={actions}>
      {children}
    </ConversationWorkspaceContext.Provider>
  );
}

/** null 表示入口尚未迁移，由可选兼容边界接入旧工作区动作。 */
export function useConversationWorkspaceActions(): ConversationWorkspaceActions | null {
  return useContext(ConversationWorkspaceContext);
}
