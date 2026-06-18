import { UnifiedChatSession } from '@/components/business-component';
import type { AgentMode } from '@/components/business-component/AgentIntervention';
import { TaskStatus } from '@/types/enums/agent';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useLocation, useModel } from 'umi';
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
}

/**
 * AgentConversationChatPanel — 智能体对话面板（仅聊天区，Header 由页面级渲染）
 */
const AgentConversationChatPanel: React.FC<AgentConversationChatPanelProps> = ({
  className,
  onChangeSelectedComputerId,
  selectedComputerId,
}) => {
  const location = useLocation();

  // 从新建项目页透传过来的初始 Agent 模式（yolo/ask）
  const initialAgentMode = (location.state as any)?.agentMode as
    | AgentMode
    | undefined;

  // 是否锁定电脑选择（仅在带有 selectedComputerId 且为 PUSH 跳转时生效）
  const [isSelectionLocked, setIsSelectionLocked] = useState<boolean>(false);

  // 模型ID
  const [selectedModelId, setSelectedModelId] = useState<number>(
    (location.state as any)?.modelId,
  );

  // 仅在本次会话中使用从其它页面带过来的 selectedComputerId；
  // 刷新（POP）或新建会话（REPLACE）时，不再沿用之前的选择。
  useEffect(() => {
    const passedDetails = (location.state as any)?.selectedComputerId;

    // PUSH: 正常跳转
    const isPushWithComputer = history.action === 'PUSH' && !!passedDetails;

    if (isPushWithComputer) {
      onChangeSelectedComputerId?.(passedDetails);
      setIsSelectionLocked(true);
    } else {
      onChangeSelectedComputerId?.('');
      setIsSelectionLocked(false);
    }
  }, [history.action, location.key, onChangeSelectedComputerId]);

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
    // 停止会话相关
    runStopConversation,
    loadingStopConversation,
    getCurrentConversationId,
    getCurrentConversationRequestId,
    disabledConversationActive,
    // 其它接口加载状态
    isLoadingOtherInterface,
    isConversationActive,
  } = useModel('conversationInfo');

  return (
    <div
      className={cx(styles.container, className, 'flex', 'flex-col', 'h-full')}
    >
      <UnifiedChatSession
        conversationId={conversationInfo?.id}
        messageList={messageList}
        isLoading={loadingConversation}
        loadingMore={loadingMore}
        isMoreMessage={isMoreMessage}
        isConversationActive={
          isConversationActive ||
          conversationInfo?.taskStatus === TaskStatus.EXECUTING
        }
        messageBottomMode="chat"
        chatSuggestList={chatSuggestList}
        agentInfo={{
          ...conversationInfo?.agent,
          id: conversationInfo?.agent?.agentId,
          sandboxId: selectedComputerId,
        }}
        allowOtherModel={conversationInfo?.agent?.allowOtherModel}
        initialAgentMode={initialAgentMode}
        selectedModelId={selectedModelId}
        onModelSelect={setSelectedModelId}
        isSelectionLocked={isSelectionLocked}
        onSendMessage={(
          messageInfo,
          files,
          skillIds,
          modelId,
          selectedAgentMode,
        ) => {
          const id = conversationInfo?.id;
          if (id) {
            onMessageSend({
              id,
              messageInfo,
              files,
              infos: manualComponents,
              sandboxId: selectedComputerId,
              debug: true,
              isSync: false,
              skillIds,
              modelId: modelId || selectedModelId,
              agentMode: selectedAgentMode,
            });
          }
        }}
        onLoadMoreMessage={handleLoadMoreMessage}
        manualComponents={manualComponents}
        selectedComputerId={selectedComputerId}
        onComputerSelect={(id) => {
          onChangeSelectedComputerId?.(id);
        }}
        // 原 conversationInfo model 数据，传给独立版输入组件
        runStopConversation={runStopConversation}
        loadingStopConversation={loadingStopConversation}
        getCurrentConversationId={getCurrentConversationId}
        getCurrentConversationRequestId={getCurrentConversationRequestId}
        disabledConversationActive={disabledConversationActive}
        loadingConversation={loadingConversation}
        isLoadingOtherInterface={isLoadingOtherInterface}
        conversationInfo={conversationInfo}
      />
    </div>
  );
};

export default AgentConversationChatPanel;
