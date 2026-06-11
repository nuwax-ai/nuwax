import { UnifiedChatSession } from '@/components/business-component';
import { TaskStatus } from '@/types/enums/agent';
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
  /** 沙箱电脑 ID 变更回调 */
  onChangeSelectedComputerId?: (id: string) => void;
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
  onChangeSelectedComputerId,
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
  } = useModel('conversationInfo');

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
          isConversationActive={
            conversationInfo?.taskStatus === TaskStatus.EXECUTING
          }
          messageBottomMode="chat"
          chatSuggestList={chatSuggestList}
          agentInfo={{
            ...conversationInfo?.agent,
            id: conversationInfo?.agent?.agentId,
            sandboxId: selectedComputerId,
            // selectedComputerId ||
            // conversationInfo?.agent?.sandboxId ||
            // conversationInfo?.sandboxServerId ||
            // '',
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
                sandboxId: selectedComputerId,
                // selectedComputerId ||
                // conversationInfo?.agent?.sandboxId ||
                // conversationInfo?.sandboxServerId ||
                // '',
                debug: true,
                isSync: false,
                skillIds,
              });
            }
          }}
          onLoadMoreMessage={handleLoadMoreMessage}
          manualComponents={manualComponents}
          selectedComputerId={selectedComputerId}
          onComputerSelect={(id) => {
            onChangeSelectedComputerId?.(id);
          }}
        />
      </div>
    </div>
  );
};

export default AgentConversationChatPanel;
