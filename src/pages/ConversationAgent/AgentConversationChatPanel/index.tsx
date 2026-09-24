import { UnifiedChatSession } from '@/components/business-component';
import type { AgentMode } from '@/components/business-component/AgentIntervention';
import type { UseConversationRuntimeSessionResult } from '@/features/conversation/react/useConversationRuntimeSession';
import useConversationMentionFiles from '@/hooks/useConversationMentionFiles';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import { usePageModel } from '@/modelScopes/usePageModel';
import { TaskStatus } from '@/types/enums/agent';
import type { AgentSelectedComponentInfo } from '@/types/interfaces/agent';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { history, useLocation } from 'umi';

/**
 * Props 类型定义
 */
export interface AgentConversationChatPanelProps {
  /** 常驻页面提供的入页路由快照，避免隐藏实例读取另一页的 URL。 */
  routeSnapshot?: {
    search: string;
    key: string;
    state?: unknown;
    action: 'PUSH' | 'POP' | 'REPLACE';
  };
  /** 自定义容器类名 */
  className?: string;
  /** 沙箱电脑 ID 变更回调 */
  onChangeSelectedComputerId?: (id: string) => void;
  /** 当前选中的电脑 ID */
  selectedComputerId?: string;
  /**
   * 页面级 V2 runtime 线（bug 2477）：页面用 URL id 外提创建（供进页自动发送
   * 直发 runtime store），面板消费同一实例不自建；flag 关时为 null（旧线原行为）。
   */
  runtimeLine?: UseConversationRuntimeSessionResult | null;
  /** 会话结束后回调（用于刷新文件树、Git 状态、智能体编排等） */
  onConversationEnd?: () => void;
}

/**
 * AgentConversationChatPanel — 智能体对话面板（仅聊天区，Header 由页面级渲染）
 */
const AgentConversationChatPanel: React.FC<AgentConversationChatPanelProps> = ({
  className,
  routeSnapshot,
  onChangeSelectedComputerId,
  selectedComputerId,
  runtimeLine,
  onConversationEnd,
}) => {
  const location = useLocation();
  const routeSearch = routeSnapshot?.search ?? location.search;
  const routeKey = routeSnapshot?.key ?? location.key;
  const routeState = routeSnapshot ? routeSnapshot.state : location.state;
  const routeAction = routeSnapshot?.action ?? history.action;

  // 从新建项目页透传过来的初始 Agent 模式（yolo/ask）
  const initialAgentMode = (routeState as any)?.agentMode as
    | AgentMode
    | undefined;

  // 是否锁定电脑选择（仅在带有 selectedComputerId 且为 PUSH 跳转时生效）
  const [isSelectionLocked, setIsSelectionLocked] = useState<boolean>(false);

  // 模型ID
  const [selectedModelId, setSelectedModelId] = useState<number>(
    (routeState as any)?.modelId,
  );

  // 仅在本次会话中使用从其它页面带过来的 selectedComputerId；
  // 刷新（POP）或新建会话（REPLACE）时，不再沿用之前的选择。
  useEffect(() => {
    const passedDetails = (routeState as any)?.selectedComputerId;

    // PUSH: 正常跳转
    const isPushWithComputer = routeAction === 'PUSH' && !!passedDetails;

    if (isPushWithComputer) {
      onChangeSelectedComputerId?.(passedDetails);
      setIsSelectionLocked(true);
    } else {
      onChangeSelectedComputerId?.('');
      setIsSelectionLocked(false);
    }
  }, [routeAction, routeKey, onChangeSelectedComputerId]);

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
  } = usePageModel('conversationInfo');

  const {
    selectedComponentList,
    setSelectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  } = useSelectedComponent();
  const selectionInitKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = routeKey || '';
    if (!key || selectionInitKeyRef.current === key) return;
    const state = routeState as
      | { messageSourceType?: string; infos?: AgentSelectedComponentInfo[] }
      | undefined;
    if (
      state?.messageSourceType !== 'new_chat' &&
      Array.isArray(state?.infos)
    ) {
      selectionInitKeyRef.current = key;
      setSelectedComponentList(state.infos);
      return;
    }
    if (manualComponents.length > 0) {
      selectionInitKeyRef.current = key;
      initSelectedComponentList(manualComponents);
    }
  }, [routeKey, routeState, manualComponents]);

  // @ 文件提及数据源：URL 会话 id 进页即得——若等会话详情回填 conversationInfo，
  // 进入后一段时间内 @ 会是纯文本；开发会话均为任务型智能体，文件按会话维度取数，
  // 无需 agent 类型门槛
  const queryConversationId = useMemo(() => {
    const id = new URLSearchParams(routeSearch).get('conversationId');
    return id ? Number(id) : undefined;
  }, [routeSearch]);
  const mentionConversationId = conversationInfo?.id ?? queryConversationId;
  const fetchMentionFiles = useConversationMentionFiles(mentionConversationId);
  const mentionFilesEnabled = !!mentionConversationId;

  // 双线分派（docs/conversation/conversation-dual-track-plan.md）：flag 开启时新线会话面 props 覆盖；
  // 关闭（默认）为空对象，旧线原值原行为。session 由页面级外提（URL id 即建，bug 2477），
  // 面板经 runtimeLine prop 消费同一实例。
  // 结束沿必须消费「实际生效」的活跃态：V2 下 onSendMessage 被 conversationProps
  // 覆盖走 runtime 线，model 的置位点不再执行——生效值以 runtime 线合成的
  // effectiveIsActive 为准（session.getState + taskStatus，即传给 UnifiedChatSession
  // 的同一值），V1（无 runtime 线）回落 model 值（原行为）。
  // 监听 true → false 触发会话结束回调（页面刷文件树/Git/编排的唯一触发点）。
  const effectiveIsActive =
    runtimeLine?.effectiveIsActive ?? isConversationActive;
  useEffect(() => {
    if (prevIsActiveRef.current && !effectiveIsActive) {
      onConversationEnd?.();
    }
    prevIsActiveRef.current = effectiveIsActive;
  }, [effectiveIsActive, onConversationEnd]);

  return (
    <div className={classNames('flex', 'flex-col', 'h-full', className)}>
      <UnifiedChatSession
        conversationId={conversationInfo?.id}
        messageList={messageList}
        isLoading={
          loadingConversation &&
          !(messageList?.length && conversationInfo?.id === queryConversationId)
        }
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
        {...(runtimeLine?.conversationProps ?? {})}
      />
    </div>
  );
};

export default AgentConversationChatPanel;
