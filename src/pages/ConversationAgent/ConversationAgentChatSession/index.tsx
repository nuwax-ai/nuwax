import { UnifiedChatSession } from '@/components/business-component';
import { TaskResultContext } from '@/components/MarkdownRenderer/TaskResult/context';
import type { AgentSelectedComponentInfo } from '@/types/interfaces/agent';
import classNames from 'classnames';
import React from 'react';
import {
  useConversationAgentChatSession,
  type UseConversationAgentChatSessionOptions,
} from '../hooks/useConversationAgentChatSession';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface ConversationAgentChatSessionProps
  extends UseConversationAgentChatSessionOptions {
  className?: string;
  selectedComponentList?: AgentSelectedComponentInfo[];
  onSelectComponent?: (comp: AgentSelectedComponentInfo) => void;
  onTaskResultClick?: (fileId: string) => boolean | void;
}

/**
 * ConversationAgent 嵌入式聊天会话
 * 用于编排「预览/调试」Tab；数据全部来自 conversationAgent model
 */
const ConversationAgentChatSession: React.FC<
  ConversationAgentChatSessionProps
> = (props) => {
  const { className, onTaskResultClick, ...sessionOptions } = props;
  const chatSessionProps = useConversationAgentChatSession(sessionOptions);

  return (
    <TaskResultContext.Provider value={{ onTaskResultClick }}>
      <div className={cx(styles.container, className, 'flex', 'h-full')}>
        <div
          className={cx(
            styles['main-content'],
            'flex-1',
            'flex',
            'flex-col',
            'overflow-hide',
          )}
        >
          <UnifiedChatSession {...chatSessionProps} mentionPlacement="up" />
        </div>
      </div>
    </TaskResultContext.Provider>
  );
};

export default ConversationAgentChatSession;
