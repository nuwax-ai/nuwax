import { UnifiedChatSession } from '@/components/business-component';
import type { AgentMode } from '@/components/business-component/AgentIntervention';
import useConversationMentionFiles from '@/hooks/useConversationMentionFiles';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import { TaskStatus } from '@/types/enums/agent';
import type { AgentSelectedComponentInfo } from '@/types/interfaces/agent';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
    isAwaitingChatTerminal,
    // 其它接口加载状态
    isLoadingOtherInterface,
    // 会话流式恢复(sub)
    resumeConversationStream,
    abortResumeStream,
    runAsync,
  } = useModel('conversationInfo');

  // 会话输入框已选择组件。此前面板未接选中态：工具 chips 永不点亮、
  // 首页上框带过来的工具选中态丢失、发送恒带全量 manualComponents（禅道 bug2352）
  const {
    selectedComponentList,
    setSelectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  } = useSelectedComponent();

  // 选中态初始化（按 location.key 一次性应用，对齐 Chat 页语义）：
  // - 首页携 state 透传（messageSourceType 非 new_chat）→ 恢复用户在首页选的工具；
  // - 直进页面 → 按智能体 manualComponents 的默认选中初始化。
  // 不能像 Chat 页那样随 manualComponents 引用重放：AppDevPro 详情 5s 轮询会
  // 反复刷新 manualComponents 引用，重放会把用户正在挑选的选中态重置。
  const selectionInitKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = location.key || '';
    if (!key || selectionInitKeyRef.current === key) {
      return;
    }
    const state = location.state as
      | { messageSourceType?: string; infos?: AgentSelectedComponentInfo[] }
      | undefined;
    if (state?.messageSourceType && state.messageSourceType !== 'new_chat') {
      selectionInitKeyRef.current = key;
      setSelectedComponentList(state.infos || []);
      return;
    }
    if (manualComponents.length > 0) {
      selectionInitKeyRef.current = key;
      initSelectedComponentList(manualComponents);
    }
  }, [location.key, location.state, manualComponents]);

  // 监听 isConversationActive 从 true → false，触发会话结束回调
  useEffect(() => {
    if (prevIsActiveRef.current && !isConversationActive) {
      onConversationEnd?.();
    }
    prevIsActiveRef.current = isConversationActive;
  }, [isConversationActive, onConversationEnd]);

  // @ 文件提及数据源：URL 会话 id 进页即得——若等会话详情回填 conversationInfo，
  // 进入后一段时间内 @ 会是纯文本；开发会话均为任务型智能体，文件按会话维度取数，
  // 无需 agent 类型门槛
  const queryConversationId = useMemo(() => {
    const id = new URLSearchParams(location.search).get('conversationId');
    return id ? Number(id) : undefined;
  }, [location.search]);
  const mentionConversationId = conversationInfo?.id ?? queryConversationId;
  const fetchMentionFiles = useConversationMentionFiles(mentionConversationId);
  const mentionFilesEnabled = !!mentionConversationId;

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
        isAwaitingChatTerminal={isAwaitingChatTerminal}
        messageBottomMode="chat"
        showDebug={false}
        chatSuggestList={chatSuggestList}
        agentInfo={{
          ...conversationInfo?.agent,
          id: conversationInfo?.agent?.agentId,
          sandboxId: selectedComputerId,
        }}
        allowOtherModel={conversationInfo?.agent?.allowOtherModel}
        onFetchMentionFiles={
          mentionFilesEnabled ? fetchMentionFiles : undefined
        }
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
              infos: selectedComponentList,
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
        selectedComponentList={selectedComponentList}
        onSelectComponent={handleSelectComponent}
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
        resumeDebugSource="agent-dev:left-dev-agent-session"
      />
    </div>
  );
};

export default AgentConversationChatPanel;
