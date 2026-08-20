/**
 * CopilotKitChat - CopilotKit/AG-UI panel for the general Chat page.
 *
 * Replaces UnifiedChatSession with CopilotKit's CopilotChat component when
 * the user toggles to "CopilotKit" mode. Shares the same agent/conversation
 * context so the runtime can bridge to nuwax's SSE backend.
 */
import { CopilotKit, CopilotChat } from '@copilotkit/react-core/v2';
import '@copilotkit/react-core/v2/styles.css';
import React from 'react';
import styles from './index.less';

export interface CopilotKitChatProps {
  agentId: number;
  conversationId: number;
  agentInfo?: {
    name?: string;
    type?: string;
    icon?: string;
    openingChatMsg?: string;
    guidQuestionDtos?: any[];
  };
  messageList?: any[];
  selectedModelId?: number;
  onSendMessage?: (text: string) => void;
  onModelSelect?: (modelId: number) => void;
  onClearContext?: () => void;
}

const CopilotInner: React.FC<CopilotKitChatProps> = ({
  agentId,
  conversationId,
  agentInfo,
}) => {





return (
  <div className={styles.copilotChatWrap}>
     <div className="dark" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
       <CopilotChat
         instructions={
           'You are an AI assistant integrated into the Nuwax chat platform. ' +
           'You are helping the user interact with agent ' +
           (agentInfo?.name || String(agentId)) +
          ' (type: ' +
          (agentInfo?.type || 'general') +
          ', conversation: ' +
          conversationId +
          '). You can see the recent conversation history and agent metadata. ' +
          'Use sendSuggestion to propose prompts, clearContext to reset, ' +
          'and searchConversation to find past messages.'
         }
         labels={{
           title: agentInfo?.name || 'AI Assistant',
           initial:
            'CopilotKit mode active. I can see your agent context and recent messages. Ask me anything.',
         }}
         className={styles.copilotChat}
       />
     </div>
  </div>
);
};

const CopilotKitChat: React.FC<CopilotKitChatProps> = (props) => {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      agent="default"
      useSingleEndpoint={false}
      headers={() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('ACCESS_TOKEN') || '' : '';
        return {
          'X-Nuwax-Token': token,
          'X-Nuwax-ConversationId': String(props.conversationId || ''),
          'X-Nuwax-ModelId': props.selectedModelId ? String(props.selectedModelId) : '',
          'X-Nuwax-AgentMode': 'yolo',
        };
      }}
    >
      <CopilotInner {...props} />
    </CopilotKit>
  );
};

export default CopilotKitChat;
