import agentImage from '@/assets/images/agent_image.png';
import avatar from '@/assets/images/avatar.png';
import AttachFile from '@/components/ChatView/AttachFile';
import ConditionRender from '@/components/ConditionRender';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import CopyButton from '@/components/base/CopyButton';
import { USER_INFO } from '@/constants/home.constants';
import useMarkdownRender from '@/hooks/useMarkdownRender';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  AttachmentFile,
  ChatViewProps,
} from '@/types/interfaces/conversationInfo';
import { message, theme } from 'antd';
import classNames from 'classnames';
import { isEqual } from 'lodash';
import React, { memo, useCallback, useMemo } from 'react';
import { useModel } from 'umi';
import ChatBottomDebug from './ChatBottomDebug';
import ChatBottomMore from './ChatBottomMore';
import ChatSampleBottom from './ChatSampleBottom';
import RunOver from './RunOver';
import styles from './index.less';

const cx = classNames.bind(styles);

// 聊天视图组件
const ChatView: React.FC<ChatViewProps> = memo(
  ({ className, contentClassName, roleInfo, messageInfo, mode = 'chat' }) => {
    if (messageInfo?.text) {
      // 处理消息内容中的data属性
      messageInfo.text = messageInfo?.text?.replace(
        /data="(\{.*?\})"/g,
        (_, json) => {
          return `data='${json}'`;
        },
      );
    }

    const { userInfo } = useModel('userInfo');
    const { data } = useUnifiedTheme();
    const isDarkMode = data.antdTheme === 'dark';

    const { markdownRef, messageIdRef } = useMarkdownRender({
      answer: messageInfo?.text || '',
      thinking: messageInfo?.think || '',
      id: messageInfo?.id || '',
    });
    const _userInfo =
      userInfo || JSON.parse(localStorage.getItem(USER_INFO) as string);

    // 计算角色信息
    const info = (() => {
      const { assistant, system } = roleInfo;
      switch (messageInfo?.role) {
        case AssistantRoleEnum.USER:
          return {
            name: _userInfo?.nickName || _userInfo?.userName || '游客',
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
      message.success('复制成功');
    };

    const trim = useCallback((text: string) => {
      return text.replace(/^\s+|\s+$/g, '');
    }, []);

    const isUser = useMemo(() => {
      return messageInfo?.role === AssistantRoleEnum.USER;
    }, [messageInfo?.role]);

    const { token } = theme.useToken();

    return (
      <div className={cx(styles.container, 'flex', className)}>
        <div
          className={cx('flex-1', 'overflow-hide', {
            [styles.userContainer]: isUser,
          })}
        >
          {!isUser && (
            <div className={cx(styles['agent-title-bar'])}>
              <img
                className={cx(styles.avatar)}
                src={info?.avatar as string}
                alt=""
              />
              <div className={cx(styles.author)}>{info?.name}</div>
              <ConditionRender condition={!!messageInfo?.status}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <RunOver messageInfo={messageInfo} />
                  </div>
                </div>
              </ConditionRender>
            </div>
          )}
          {!!messageInfo?.attachments?.length && (
            <div className={cx(styles['attach-file-container'])}>
              <AttachFile
                files={messageInfo?.attachments as AttachmentFile[]}
              />
            </div>
          )}
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
                    style={{ whiteSpace: 'pre-wrap' }}
                    className="ds-markdown-paragraph ds-typed-answer"
                  >
                    {trim(messageInfo?.text)}
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
                <CopyButton
                  text={messageInfo.text || ''}
                  onCopy={handleTextCopy}
                >
                  复制
                </CopyButton>
              </div>
            </div>
          )}

          <ConditionRender
            condition={messageInfo?.role !== AssistantRoleEnum.USER}
          >
            {(!!messageInfo?.think || !!messageInfo?.text) && (
              <div className={cx(styles['inner-container'], contentClassName)}>
                <div
                  className={cx(styles['chat-content'], 'radius-6', 'w-full', {
                    [styles.typing]:
                      messageInfo.status === MessageStatusEnum.Incomplete ||
                      messageInfo.status === MessageStatusEnum.Loading,
                  })}
                >
                  <MarkdownRenderer
                    key={`${messageIdRef.current}`}
                    id={`${messageIdRef.current}`}
                    markdownRef={markdownRef}
                  />
                </div>
              </div>
            )}

            <ConditionRender
              condition={
                messageInfo &&
                (messageInfo?.status === MessageStatusEnum.Complete ||
                  !messageInfo?.status)
              }
            >
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
                  <ChatBottomDebug messageInfo={messageInfo} />
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
    return isEqual(prevProps.messageInfo, nextProps.messageInfo);
  },
);

export default ChatView;
