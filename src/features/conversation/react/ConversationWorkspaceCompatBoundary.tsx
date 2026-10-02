import { usePageModel } from '@/modelScopes/usePageModel';
import type React from 'react';
import { useMemo } from 'react';
import {
  ConversationWorkspaceProvider,
  useConversationWorkspaceActions,
} from './ConversationWorkspaceProvider';
import type {
  ConversationFilePreviewOptions,
  ConversationWorkspaceActions,
} from './workspaceActions';

interface LegacyWorkspaceModel {
  openPreviewView: (
    conversationId: number,
    options?: ConversationFilePreviewOptions,
  ) => Promise<void>;
  setTaskAgentSelectedFileId: (fileId: string) => void;
  setTaskAgentSelectTrigger: (trigger: number) => void;
}

/** 仅旧入口挂载此组件，注入动作的入口不调用或订阅旧 model。 */
function LegacyConversationWorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    openPreviewView,
    setTaskAgentSelectedFileId,
    setTaskAgentSelectTrigger,
  } = usePageModel('conversationInfo') as LegacyWorkspaceModel;
  const actions = useMemo<ConversationWorkspaceActions>(
    () => ({
      openFile: async (conversationId, fileId, options) => {
        await openPreviewView(conversationId, options);
        setTaskAgentSelectedFileId(fileId);
        setTaskAgentSelectTrigger(Date.now());
      },
    }),
    [openPreviewView, setTaskAgentSelectedFileId, setTaskAgentSelectTrigger],
  );
  return (
    <ConversationWorkspaceProvider actions={actions}>
      {children}
    </ConversationWorkspaceProvider>
  );
}

/** props 注入优先于外层 context；未迁移的入口保留已有工作区联动。 */
export function ConversationWorkspaceCompatBoundary({
  actions,
  children,
}: {
  actions?: ConversationWorkspaceActions;
  children: React.ReactNode;
}) {
  const inheritedActions = useConversationWorkspaceActions();
  if (actions) {
    return (
      <ConversationWorkspaceProvider actions={actions}>
        {children}
      </ConversationWorkspaceProvider>
    );
  }
  if (inheritedActions) return <>{children}</>;
  return (
    <LegacyConversationWorkspaceProvider>
      {children}
    </LegacyConversationWorkspaceProvider>
  );
}
