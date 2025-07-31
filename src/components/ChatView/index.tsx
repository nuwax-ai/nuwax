import agentImage from '@/assets/images/agent_image.png';
import avatar from '@/assets/images/avatar.png';
import copyImage from '@/assets/images/copy.png';
import AttachFile from '@/components/ChatView/AttachFile';
import ConditionRender from '@/components/ConditionRender';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { USER_INFO } from '@/constants/home.constants';
import useMarkdownRender from '@/hooks/useMarkdownRender';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  AttachmentFile,
  ChatViewProps,
} from '@/types/interfaces/conversationInfo';
import { message } from 'antd';
import classNames from 'classnames';
import { isEqual } from 'lodash';
import React, { memo, useCallback } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
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
    const { userInfo } = useModel('userInfo');
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

    const handleCodeCopy = () => {
      message.success('代码复制成功');
    };

    const trim = useCallback((text: string) => {
      return text.replace(/^\s+|\s+$/g, '');
    }, []);

    return (
      <div className={cx(styles.container, 'flex', className)}>
        <img
          className={cx(styles.avatar)}
          src={info?.avatar as string}
          alt=""
        />
        <div className={cx('flex-1', 'overflow-hide')}>
          <div className={cx(styles.author)}>{info?.name}</div>
          {!!messageInfo?.attachments?.length && (
            <AttachFile files={messageInfo?.attachments as AttachmentFile[]} />
          )}
          {messageInfo?.role === AssistantRoleEnum.USER &&
            !!messageInfo?.text && (
              <>
                <div
                  className={cx(
                    styles['chat-content'],
                    styles.user,
                    'radius-6',
                    contentClassName,
                    'ds-markdown',
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
                  <CopyToClipboard
                    text={messageInfo.text || ''}
                    onCopy={handleTextCopy}
                  >
                    <span
                      className={cx(
                        'flex',
                        'items-center',
                        'cursor-pointer',
                        styles['copy-btn'],
                      )}
                    >
                      <img
                        className={cx(styles['copy-image'])}
                        src={copyImage}
                        alt=""
                      />
                      <span>复制</span>
                    </span>
                  </CopyToClipboard>
                </div>
              </>
            )}

          <ConditionRender
            condition={messageInfo?.role !== AssistantRoleEnum.USER}
          >
            <ConditionRender condition={!!messageInfo?.status}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <RunOver messageInfo={messageInfo} />
                </div>
              </div>
            </ConditionRender>
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
                    onCopy={handleCodeCopy}
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
                <div style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
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
