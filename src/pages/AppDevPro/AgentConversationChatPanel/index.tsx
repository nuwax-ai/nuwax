import { UnifiedChatSession } from '@/components/business-component';
import AgentDetailModal from '@/components/business-component/AgentDetailModal';
import type { AgentMode } from '@/components/business-component/AgentIntervention';
import ConversationPanelActions from '@/components/business-component/ConversationPanelActions';
import ConversationProgressCapsule from '@/components/business-component/UnifiedChatSession/components/ConversationProgressCapsule';
import { selectProgressCapsule } from '@/components/business-component/UnifiedChatSession/components/ConversationProgressCapsule/selectProgressCapsule';
import { isAgentVersionControlEnabled } from '@/constants/agent.constants';
import type { UseConversationRuntimeSessionResult } from '@/features/conversation/react/useConversationRuntimeSession';
import useConversationMentionFiles from '@/hooks/useConversationMentionFiles';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import { usePageModel } from '@/modelScopes/usePageModel';
import { TaskStatus } from '@/types/enums/agent';
import type { AgentSelectedComponentInfo } from '@/types/interfaces/agent';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useLocation, useParams } from 'umi';

/**
 * Props 类型定义
 */
export interface AgentConversationChatPanelProps {
  active?: boolean;
  /** 常驻页面的固定路由快照，隐藏时不读取其他页面的 URL。 */
  routeSnapshot?: {
    conversationId: number;
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
  active = true,
  routeSnapshot,
  onChangeSelectedComputerId,
  selectedComputerId,
  runtimeLine,
  onConversationEnd,
}) => {
  const location = useLocation();
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

  // 会话输入框已选择组件。此前面板未接选中态：工具 chips 永不点亮、
  // 首页上框带过来的工具选中态丢失、发送恒带全量 manualComponents（禅道 bug2352）
  const {
    selectedComponentList,
    setSelectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  } = useSelectedComponent();

  // 选中态初始化（按 location.key 一次性应用，对齐 Chat 页语义）：
  // - 跳转时明确传入 infos（含空数组）→ 恢复上个输入框的工具选中态；
  // - 直进页面 → 按智能体 manualComponents 的默认选中初始化。
  // 不能像 Chat 页那样随 manualComponents 引用重放：AppDevPro 详情 5s 轮询会
  // 反复刷新 manualComponents 引用，重放会把用户正在挑选的选中态重置。
  const selectionInitKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = routeKey || '';
    if (!key || selectionInitKeyRef.current === key) {
      return;
    }
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
  const params = useParams();
  const queryConversationId =
    routeSnapshot?.conversationId ?? Number(params.conversationId);
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

  const [progressOpen, setProgressOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const effectiveMessages =
    runtimeLine?.conversationProps.messageList ?? messageList;
  const capsuleModel = selectProgressCapsule(
    effectiveMessages,
    effectiveIsActive,
  );
  useEffect(() => {
    setProgressOpen(false);
    setDetailOpen(false);
  }, [queryConversationId, active]);

  return (
    <div
      className={classNames(
        'flex',
        'flex-col',
        'h-full',
        'overflow-hide',
        className,
      )}
      style={{ minHeight: 0 }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          flexShrink: 0,
          padding: '0 8px 4px',
        }}
      >
        <ConversationPanelActions
          progress={
            capsuleModel
              ? {
                  open: progressOpen,
                  running: capsuleModel.running,
                  onClick: () => setProgressOpen((value) => !value),
                }
              : undefined
          }
          detail={
            conversationInfo?.agent?.agentId
              ? { open: detailOpen, onClick: () => setDetailOpen(true) }
              : undefined
          }
        />
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          containerType: 'size',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <UnifiedChatSession
          conversationId={conversationInfo?.id}
          messageList={messageList}
          isLoading={
            loadingConversation &&
            !(
              messageList?.length &&
              conversationInfo?.id === queryConversationId
            )
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
        <ConversationProgressCapsule
          conversationId={queryConversationId}
          messageList={effectiveMessages}
          active={effectiveIsActive}
          enableVersionControl={isAgentVersionControlEnabled(
            conversationInfo?.agent?.enableVersionControl,
          )}
          open={active && progressOpen}
          onClose={() => setProgressOpen(false)}
        />
      </div>
      <AgentDetailModal
        open={active && detailOpen}
        onClose={() => setDetailOpen(false)}
        agentId={conversationInfo?.agent?.agentId || 0}
        agentDetail={conversationInfo?.agent}
        loading={loadingConversation}
      />
    </div>
  );
};

export default AgentConversationChatPanel;
