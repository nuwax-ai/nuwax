import { UnifiedChatSession } from '@/components/business-component';
import classNames from 'classnames';
import React from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * Props 类型定义
 */
export interface AgentConversationChatPanelProps {
  /** 自定义容器类名 */
  className?: string;
  /** 当前选中的电脑 ID */
  selectedComputerId?: string;
  /** 打开编辑智能体基础信息弹窗 */
  onEditAgent?: () => void;
}

/**
 * AgentConversationChatPanel — 智能体对话面板
 */
const AgentConversationChatPanel: React.FC<AgentConversationChatPanelProps> = ({
  className,
  selectedComputerId,
}) => {
  // ==================== 全局状态模型 ====================
  const {
    conversationInfo,
    messageList,
    chatSuggestList,
    loadingConversation,
    onMessageSend,
    manualComponents,
    isMoreMessage,
    loadingMore,
    handleLoadMoreMessage,
  } = useModel('conversationAgent');

  // ==================== 主渲染 ====================
  return (
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
        <UnifiedChatSession
          conversationId={conversationInfo?.id}
          messageList={messageList}
          isLoading={loadingConversation}
          loadingMore={loadingMore}
          isMoreMessage={isMoreMessage}
          isConversationActive={conversationInfo?.taskStatus === 'executing'}
          messageBottomMode="chat"
          chatSuggestList={chatSuggestList}
          agentInfo={{
            ...conversationInfo?.agent,
            id: conversationInfo?.agent?.agentId,
            sandboxId:
              conversationInfo?.agent?.sandboxId ||
              conversationInfo?.sandboxServerId ||
              '',
          }}
          allowOtherModel={conversationInfo?.agent?.allowOtherModel}
          onSendMessage={(messageInfo, files, skillIds) => {
            const id = conversationInfo?.id;
            if (id) {
              onMessageSend({
                id,
                messageInfo,
                files,
                infos: manualComponents,
                sandboxId:
                  conversationInfo?.agent?.sandboxId ||
                  conversationInfo?.sandboxServerId ||
                  '',
                debug: true,
                isSync: false,
                skillIds,
              });
            }
          }}
          onLoadMoreMessage={handleLoadMoreMessage}
          manualComponents={manualComponents}
          selectedComputerId={selectedComputerId}
        />
      </div>
    </div>
  );
};

export default AgentConversationChatPanel;
