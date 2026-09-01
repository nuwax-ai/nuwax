/**
 * ConversationRendererV2 · V2 会话消息列表渲染器（specs/nuwax-conversation-renderer-v2.md）。
 *
 * 结构：USER 原始输入（复用 ChatView 气泡，视觉零差异）→ 整轮工作轨迹
 * （两级折叠）→ 最终回答常显。待回答审批/提问卡仍由
 * AgentInterventionChatLayer dock 独立置顶，不在本渲染器内。
 *
 * 安全边界：投影或渲染出现未捕获异常时，整份会话回退 V1（逐消息 ChatView）
 * 并记录诊断，禁止白屏或半套混渲。
 */
import agentImage from '@/assets/images/agent_image.png';
import ChatView from '@/components/ChatView';
import RunOver from '@/components/ChatView/RunOver';
import { PureMarkdownRenderer } from '@/components/MarkdownRenderer';
import { useConversationRendererPreference } from '@/hooks/useConversationRendererPreference';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { AssistantRoleEnum } from '@/types/enums/agent';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { projectConversation } from '../projectConversation';
import type {
  ConversationPresentationV2,
  ConversationRenderPreferencesV2,
  ConversationTurnPresentationV2,
} from '../types';
import FinalAnswerBlock from './FinalAnswerBlock';
import UserBubbleCollapse from './UserBubbleCollapse';
import WorkTraceDisclosure from './WorkTraceDisclosure';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 中间正文段（过程说明）直出渲染：轻量 Markdown（与节点详情同款）+ 探针标记 */
const NarrationText: React.FC<{
  narrationId: string;
  children: string;
}> = ({ narrationId, children }) => {
  const { data } = useUnifiedTheme();
  return (
    <div data-testid="v2-narration" data-narration-id={narrationId}>
      <PureMarkdownRenderer
        id={`v2-narration-${narrationId}`}
        theme={data.antdTheme === 'dark' ? 'dark' : 'light'}
        disableTyping
      >
        {children}
      </PureMarkdownRenderer>
    </div>
  );
};

export interface ConversationRendererV2Props {
  messageList?: MessageInfo[];
  conversationId?: number | string;
  roleInfo: RoleInfo;
  messageBottomMode?: 'none' | 'home' | 'chat';
  showDebug?: boolean;
  showStatusDesc?: boolean;
  /** 测试/调试可注入偏好；缺省走用户偏好 hook */
  preferences?: ConversationRenderPreferencesV2;
  /** 投影结果观察口（e2e 断言与单测使用） */
  onPresentation?: (presentation: ConversationPresentationV2 | null) => void;
}

/** 与 ChatContentArea.getChatMessageRenderKey 同规则（复制实现避免循环依赖） */
const getRenderKey = (message: MessageInfo, fallbackIndex: number): string => {
  const id = message.clientRenderKey || message.id;
  if (id !== null && id !== undefined && String(id).trim() !== '') {
    return `message-${String(id)}`;
  }
  return `message-fallback-${message.role}-${message.index ?? fallbackIndex}`;
};

/** V1 回退：与 ChatContentArea 未传 messageRenderer 时的分支同构 */
const V1FallbackList: React.FC<
  Omit<ConversationRendererV2Props, 'preferences' | 'onPresentation'>
> = ({
  messageList = [],
  conversationId,
  roleInfo,
  messageBottomMode,
  showDebug,
  showStatusDesc,
}) => (
  <div className={cx(styles['fallback-list'])} data-v2-fallback="v1">
    {messageList.map((item, idx) => (
      <ChatView
        key={getRenderKey(item, idx)}
        conversationId={conversationId}
        messageInfo={item}
        roleInfo={roleInfo}
        mode={messageBottomMode}
        showDebug={showDebug}
        showStatusDesc={showStatusDesc}
      />
    ))}
  </div>
);

/** 单轮展示块：标题栏 + 工作轨迹 + 最终回答 */
const TurnBlock: React.FC<{
  turn: ConversationTurnPresentationV2;
  roleInfo: RoleInfo;
  conversationId?: number | string;
  messageBottomMode?: 'none' | 'home' | 'chat';
  showDebug?: boolean;
  showStatusDesc?: boolean;
  preferences: ConversationRenderPreferencesV2;
}> = ({
  turn,
  roleInfo,
  conversationId,
  messageBottomMode,
  showDebug,
  showStatusDesc,
  preferences,
}) => {
  const [manualExpanded, setManualExpanded] = useState<boolean | undefined>(
    undefined,
  );
  // 状态栏参考最后一条 ASSISTANT 消息（assistantMessages 含 SYSTEM/FUNCTION）
  const lastAssistant = [...turn.assistantMessages]
    .reverse()
    .find((message) => message.role === AssistantRoleEnum.ASSISTANT);
  // 轨迹条只在确有节点或运行中时出现：narration-only 终态轮不再渲染空轨迹条
  const showTrace = turn.nodes.length > 0 || turn.running;

  return (
    <div className={cx(styles['turn-container'])} data-turn-key={turn.key}>
      <div className={cx(styles['agent-title-bar'])}>
        <img
          className={cx(styles['avatar'])}
          src={roleInfo?.assistant?.avatar || agentImage}
          alt=""
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = agentImage;
          }}
        />
        <div className={cx(styles['author'])}>{roleInfo?.assistant?.name}</div>
        {lastAssistant && (
          <div className={cx(styles['run-over'])}>
            <RunOver
              messageInfo={lastAssistant}
              showStatusDesc={showStatusDesc !== false}
            />
          </div>
        )}
      </div>
      {showTrace && (
        <WorkTraceDisclosure
          turn={turn}
          preferences={preferences}
          conversationId={conversationId}
          manualExpanded={manualExpanded}
          onManualToggle={setManualExpanded}
        />
      )}
      {/* 中间正文段（过程说明）直出：不进轨迹、不受预设/覆盖影响，正文连续阅读流 */}
      {turn.narrations.length > 0 && (
        <div className={cx(styles['narration-block'])}>
          {turn.narrations.map((narration) => (
            <NarrationText key={narration.id} narrationId={narration.id}>
              {narration.text}
            </NarrationText>
          ))}
        </div>
      )}
      <FinalAnswerBlock
        turn={turn}
        messageBottomMode={messageBottomMode}
        showDebug={showDebug}
      />
    </div>
  );
};

class V2ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode; resetKey: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // 诊断日志：投影/渲染异常明细（生产排查依据）
    console.error(
      '[ConversationRendererV2] rendering failed, falling back to V1',
      error,
      info?.componentStack,
    );
  }

  componentDidUpdate(prevProps: Readonly<{ resetKey: string }>) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

const ConversationRendererV2Inner: React.FC<ConversationRendererV2Props> = (
  props,
) => {
  const {
    messageList,
    conversationId,
    roleInfo,
    messageBottomMode = 'chat',
    showDebug,
    showStatusDesc,
    preferences: preferencesProp,
    onPresentation,
  } = props;
  const { preferences: hookPreferences } =
    useConversationRendererPreference(conversationId);
  const preferences = preferencesProp ?? hookPreferences;

  const projection = useMemo(() => {
    try {
      return {
        data: projectConversation(messageList ?? []),
        error: null as unknown,
      };
    } catch (error) {
      return { data: null, error };
    }
  }, [messageList]);

  useEffect(() => {
    onPresentation?.(projection.data);
  }, [projection, onPresentation]);

  if (!projection.data) {
    console.error(
      '[ConversationRendererV2] projection failed, falling back to V1',
      projection.error,
    );
    return (
      <V1FallbackList
        messageList={messageList}
        conversationId={conversationId}
        roleInfo={roleInfo}
        messageBottomMode={messageBottomMode}
        showDebug={showDebug}
        showStatusDesc={showStatusDesc}
      />
    );
  }

  return (
    <>
      {projection.data.turns.map((turn) => (
        <React.Fragment key={`${conversationId ?? 'unknown'}:${turn.key}`}>
          {turn.userMessage && (
            <div className={cx(styles['user-message-wrapper'])}>
              {/* 用户气泡超限折叠（V2 专属）：内容高超 200px 默认收起可切换 */}
              <UserBubbleCollapse>
                <ChatView
                  conversationId={conversationId}
                  messageInfo={turn.userMessage}
                  roleInfo={roleInfo}
                  mode={messageBottomMode}
                  showDebug={showDebug}
                />
              </UserBubbleCollapse>
            </div>
          )}
          {turn.assistantMessages.length > 0 && (
            <TurnBlock
              turn={turn}
              roleInfo={roleInfo}
              conversationId={conversationId}
              messageBottomMode={messageBottomMode}
              showDebug={showDebug}
              showStatusDesc={showStatusDesc}
              preferences={preferences}
            />
          )}
        </React.Fragment>
      ))}
    </>
  );
};

/**
 * V2 渲染器对外出口：ErrorBoundary 兜底（渲染期异常整份回退 V1）。
 */
const ConversationRendererV2: React.FC<ConversationRendererV2Props> = (
  props,
) => (
  <V2ErrorBoundary
    resetKey={String(props.conversationId ?? 'unknown')}
    fallback={
      <V1FallbackList
        messageList={props.messageList}
        conversationId={props.conversationId}
        roleInfo={props.roleInfo}
        messageBottomMode={props.messageBottomMode}
        showDebug={props.showDebug}
        showStatusDesc={props.showStatusDesc}
      />
    }
  >
    <ConversationRendererV2Inner {...props} />
  </V2ErrorBoundary>
);

export default ConversationRendererV2;
