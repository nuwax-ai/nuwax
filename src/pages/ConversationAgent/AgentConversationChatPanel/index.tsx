import { UnifiedChatSession } from '@/components/business-component';
import type { AgentMode } from '@/components/business-component/AgentIntervention';
import { TaskStatus } from '@/types/enums/agent';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useLocation, useModel } from 'umi';

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
  /** 会话结束后回调（用于刷新文件树、Git 状态、智能体编排等） */
  onConversationEnd?: () => void;
}

/**
 * AgentConversationChatPanel — 智能体对话面板（仅聊天区，Header 由页面级渲染）
 */
const AgentConversationChatPanel: React.FC<AgentConversationChatPanelProps> = ({
  className,
  onChangeSelectedComputerId,
  selectedComputerId,
  onConversationEnd,
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

  // 追踪会话活跃状态的上一次值，用于检测「活跃→非活跃」的转换
  const prevIsActiveRef = useRef<boolean>(false);

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
    // SSE 流式交互状态
    isConversationActive,
    // 其它接口加载状态
    isLoadingOtherInterface,
    // 会话流式恢复(sub)
    resumeConversationStream,
    abortResumeStream,
    runAsync,
  } = useModel('conversationInfo');

  // 监听 isConversationActive 从 true → false，触发会话结束回调
  useEffect(() => {
    if (prevIsActiveRef.current && !isConversationActive) {
      onConversationEnd?.();
    }
    prevIsActiveRef.current = isConversationActive;
  }, [isConversationActive, onConversationEnd]);

  return (
    <div className={classNames('flex', 'flex-col', 'h-full', className)}>
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
        isLocallyStreaming={isConversationActive}
        messageBottomMode="chat"
        showDebug={false}
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
        // 会话流式恢复(sub)：刷新页面/新开标签时重建 EXECUTING 会话的流式输出
        onResumeConversationStream={resumeConversationStream}
        onAbortResumeStream={abortResumeStream}
        onReloadConversationHistoryAsync={async (id) =>
          (await runAsync(Number(id)))?.data?.messageList
        }
      />
    </div>
  );
};

export default AgentConversationChatPanel;
