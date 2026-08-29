import agentImage from '@/assets/images/agent_image.png';
import avatar from '@/assets/images/avatar.png';
import CopyButton from '@/components/base/CopyButton';
import { stripMcpAskResumeDisplayArtifacts } from '@/components/business-component/AgentIntervention/utils/mcpAskResumeMessage';
import { stripOpenUiResumeDisplayArtifacts } from '@/components/business-component/OpenUiArtifactView/openUiResumeMessage';
import AttachFile from '@/components/ChatView/AttachFile';
import ConditionRender from '@/components/ConditionRender';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  collapseTerminalProcesses,
  groupMarkdownProcesses,
} from '@/components/MarkdownRenderer/utils';
import { USER_INFO } from '@/constants/home.constants';
import { useConversationDensity } from '@/hooks/useConversationDensity';
import useMarkdownRender from '@/hooks/useMarkdownRender';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { getLegacyThinkBlock } from '@/plugins/ds-markdown-think';
import { dict } from '@/services/i18nRuntime';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  AttachmentFile,
  ChatViewProps,
} from '@/types/interfaces/conversationInfo';
import { resolveDensityPolicy } from '@/utils/conversationDensity';
import { message, theme } from 'antd';
import classNames from 'classnames';
import { isEqual } from 'lodash';
import React, { memo, useMemo } from 'react';
import { useModel } from 'umi';
import ChatBottomDebug from './ChatBottomDebug';
import ChatBottomMore from './ChatBottomMore';
import ChatSampleBottom from './ChatSampleBottom';
import styles from './index.less';
import RunOver from './RunOver';
import TurnProcessCollapse from './TurnProcessCollapse';

const cx = classNames.bind(styles);

// 聊天视图组件
const ChatView: React.FC<ChatViewProps> = memo(
  ({
    className,
    contentClassName,
    roleInfo,
    messageInfo,
    mode = 'chat',
    conversationId = '',
    showStatusDesc = true,
    showDebug = true,
    turnPresentation,
  }) => {
    const { userInfo } = useModel('userInfo');
    const { data } = useUnifiedTheme();
    const isDarkMode = data.antdTheme === 'dark';

    // 会话密度（P1-6）：compact 流式也收起 / normal 现行 / detailed 恒展开不聚合
    const { density } = useConversationDensity();
    const densityPolicy = useMemo(
      () => resolveDensityPolicy(density),
      [density],
    );

    // 任务终态（非流式中）：终态聚合只展示最后一段正文，其余统一进「执行过程」折叠区
    const isTerminalStatus = useMemo(
      () =>
        messageInfo?.status !== MessageStatusEnum.Incomplete &&
        messageInfo?.status !== MessageStatusEnum.Loading,
      [messageInfo?.status],
    );

    // 工具组默认收起：compact 恒收起；normal 终态收起；detailed 恒展开
    const groupDefaultCollapsed =
      densityPolicy.collapseDuringStreaming ||
      (isTerminalStatus && densityPolicy.collapseTerminal);

    const processedText = useMemo(() => {
      const rawText =
        turnPresentation?.summaryMarkdown ?? messageInfo?.text ?? '';
      const grouped = groupMarkdownProcesses(rawText);
      // 思考按流式位置内联渲染：新消息 text 已含 markdown-custom-think 标签；
      // 存量历史消息只有聚合 think 字段（无位置信息），合成为消息开头的内联块，
      // 与新消息形态统一。
      const withLegacyThink =
        !rawText.includes('markdown-custom-think') && messageInfo?.think
          ? `${getLegacyThinkBlock(messageInfo.think)}${grouped}`
          : grouped;
      return !turnPresentation &&
        isTerminalStatus &&
        densityPolicy.terminalAggregate
        ? collapseTerminalProcesses(withLegacyThink)
        : withLegacyThink;
    }, [
      messageInfo?.text,
      messageInfo?.think,
      isTerminalStatus,
      densityPolicy.terminalAggregate,
      turnPresentation,
    ]);

    // text 含内联思考标签（含历史合成）时不再走旧顶部思考区，避免双份渲染
    const hasInlineThink = useMemo(
      () => processedText.includes('markdown-custom-think'),
      [processedText],
    );

    const userDisplayText = useMemo(() => {
      return stripOpenUiResumeDisplayArtifacts(
        stripMcpAskResumeDisplayArtifacts(messageInfo?.text),
      );
    }, [messageInfo?.text]);

    const userCopyText = userDisplayText;

    const { markdownRef, messageIdRef } = useMarkdownRender({
      answer: processedText,
      thinking: hasInlineThink ? '' : messageInfo?.think || '',
      id: messageInfo?.clientRenderKey || messageInfo?.id || '',
    });
    const _userInfo =
      userInfo || JSON.parse(localStorage.getItem(USER_INFO) as string);

    // 计算角色信息
    const info = (() => {
      const { assistant, system } = roleInfo;
      switch (messageInfo?.role) {
        case AssistantRoleEnum.USER:
          return {
            name:
              _userInfo?.nickName ||
              _userInfo?.userName ||
              dict('PC.Components.ChatView.guest'),
            avatar: _userInfo?.avatar || avatar,
          };
        case AssistantRoleEnum.ASSISTANT:
          return {
            name: assistant.name,
            avatar: assistant.avatar || agentImage,
          };
        case AssistantRoleEnum.SYSTEM:
          return {
            name: system.name,
            avatar: system.avatar || agentImage,
          };
      }
    })();

    const handleTextCopy = () => {
      message.success(dict('PC.Toast.Global.copiedSuccessfully'));
    };

    const isUser = useMemo(() => {
      return messageInfo?.role === AssistantRoleEnum.USER;
    }, [messageInfo?.role]);

    const { token } = theme.useToken();

    return (
      <div
        className={cx(styles.container, 'flex', className)}
        // 与 React key 使用同一客户端稳定标识；服务端快照补齐 id 时不再让 DOM 身份跳变。
        data-message-id={messageInfo?.clientRenderKey || messageInfo?.id}
        data-server-message-id={messageInfo?.id}
      >
        <div
          className={cx('flex-1', 'overflow-hide', {
            [styles.userContainer]: isUser,
          })}
        >
          {/* ASSISTANT 角色消息 */}
          {!isUser && (
            <div className={cx(styles['agent-title-bar'])}>
              <img
                className={cx(styles.avatar)}
                src={info?.avatar as string}
                alt=""
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = agentImage;
                }}
              />
              <div className={cx(styles.author)}>{info?.name}</div>
              <ConditionRender condition={!!messageInfo?.status}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 12,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <RunOver
                      messageInfo={messageInfo}
                      showStatusDesc={showStatusDesc}
                    />
                  </div>
                </div>
              </ConditionRender>
            </div>
          )}

          {/* USER 角色消息附件 */}
          {!!messageInfo?.attachments?.length && (
            <div className={cx(styles['attach-file-container'])}>
              <AttachFile files={messageInfo.attachments as AttachmentFile[]} />
            </div>
          )}

          {/* USER 角色消息 */}
          {isUser && !!messageInfo?.text && (
            <div className={cx(styles['user-content'])}>
              <div
                className={cx(
                  styles['chat-content'],
                  styles.user,
                  'radius-6',
                  contentClassName,
                  'ds-markdown',
                  {
                    'ds-markdown-dark': isDarkMode,
                  },
                )}
              >
                <div className="ds-markdown-answer">
                  <div
                    className="ds-markdown-paragraph ds-typed-answer"
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    {userDisplayText}
                  </div>
                </div>
              </div>
              <div
                className={cx(
                  styles['user-action-box'],
                  'flex',
                  'items-center',
                )}
              >
                <CopyButton text={userCopyText} onCopy={handleTextCopy}>
                  {dict('PC.Components.ChatView.copy')}
                </CopyButton>
              </div>
            </div>
          )}

          {/* ASSISTANT 角色会话消息 */}
          <ConditionRender
            condition={messageInfo?.role !== AssistantRoleEnum.USER}
          >
            {!!turnPresentation?.processMarkdown && (
              <TurnProcessCollapse
                id={turnPresentation.key}
                conversationId={conversationId}
                markdown={turnPresentation.processMarkdown}
                metrics={turnPresentation.metrics}
                isTerminal={turnPresentation.isTerminal}
              />
            )}
            {/* 内容区域: 思考内容、会话内容 */}
            {(!!messageInfo?.think || !!messageInfo?.text) && (
              <div className={cx(styles['inner-container'], contentClassName)}>
                <div
                  className={cx(styles['chat-content'], 'radius-6', 'w-full', {
                    [styles.typing]:
                      messageInfo.status === MessageStatusEnum.Incomplete ||
                      messageInfo.status === MessageStatusEnum.Loading,
                  })}
                >
                  {/* 思考内容 */}
                  <MarkdownRenderer
                    key={`${messageIdRef.current}`}
                    id={`${messageIdRef.current}`}
                    markdownRef={markdownRef}
                    conversationId={conversationId}
                    answer={processedText}
                    thinking={hasInlineThink ? '' : messageInfo?.think}
                    status={messageInfo?.status}
                    thinkingFinished={messageInfo?.thinkingFinished}
                    collapseProcessGroups={groupDefaultCollapsed}
                    autoCollapseEnabled={densityPolicy.autoCollapseEnabled}
                  />
                </div>
              </div>
            )}

            {/* 底部区域: 复制按钮、运行时间 */}
            <ConditionRender
              condition={
                messageInfo &&
                (messageInfo?.status === MessageStatusEnum.Complete ||
                  messageInfo?.status === MessageStatusEnum.Stopped ||
                  messageInfo?.status === MessageStatusEnum.Error ||
                  !messageInfo?.status)
              }
            >
              {/* 聊天模式 */}
              {mode === 'chat' ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 12,
                    padding: `0 ${token.paddingXS}px`,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <ChatBottomMore messageInfo={messageInfo} />
                  </div>
                  {showDebug !== false && (
                    <ChatBottomDebug messageInfo={messageInfo} />
                  )}
                </div>
              ) : mode === 'home' ? (
                <ChatSampleBottom messageInfo={messageInfo} />
              ) : null}
            </ConditionRender>
          </ConditionRender>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      isEqual(prevProps.messageInfo, nextProps.messageInfo) &&
      prevProps.conversationId === nextProps.conversationId
    );
  },
);

export default ChatView;
