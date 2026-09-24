import chatModel from '@/models/chat';
import conversationAgentModel from '@/models/conversationAgent';
import conversationInfoModel from '@/models/conversationInfo';
import React, { useContext, useMemo } from 'react';
import { PageModelScopeContext } from './usePageModel';

interface ConversationPageModelProviderProps {
  children: React.ReactNode;
  /** Agent 开发工作台还需要独立的 conversationAgent model。 */
  includeAgentModel?: boolean;
}

const ChatModelLayer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const parent = useContext(PageModelScopeContext);
  const chat = chatModel();
  const values = useMemo(() => ({ ...parent, chat }), [parent, chat]);
  return (
    <PageModelScopeContext.Provider value={values}>
      {children}
    </PageModelScopeContext.Provider>
  );
};

const ConversationInfoModelLayer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const parent = useContext(PageModelScopeContext);
  const conversationInfo = conversationInfoModel();
  const values = useMemo(
    () => ({ ...parent, conversationInfo }),
    [parent, conversationInfo],
  );
  return (
    <PageModelScopeContext.Provider value={values}>
      {children}
    </PageModelScopeContext.Provider>
  );
};

const ConversationAgentModelLayer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const parent = useContext(PageModelScopeContext);
  const conversationAgent = conversationAgentModel();
  const values = useMemo(
    () => ({ ...parent, conversationAgent }),
    [parent, conversationAgent],
  );
  return (
    <PageModelScopeContext.Provider value={values}>
      {children}
    </PageModelScopeContext.Provider>
  );
};

/** 每个完整页面实例只创建一套会话 model，跨页面并存时互不清理。 */
export const ConversationPageModelProvider: React.FC<
  ConversationPageModelProviderProps
> = ({ children, includeAgentModel = false }) => (
  <ChatModelLayer>
    <ConversationInfoModelLayer>
      {includeAgentModel ? (
        <ConversationAgentModelLayer>{children}</ConversationAgentModelLayer>
      ) : (
        children
      )}
    </ConversationInfoModelLayer>
  </ChatModelLayer>
);
