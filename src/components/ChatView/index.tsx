import agentImage from '@/assets/images/agent_image.png';
import avatar from '@/assets/images/avatar.png';
import copyImage from '@/assets/images/copy.png';
import AttachFile from '@/components/ChatView/AttachFile';
import ConditionRender from '@/components/ConditionRender';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { USER_INFO } from '@/constants/home.constants';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  AttachmentFile,
  ChatViewProps,
} from '@/types/interfaces/conversationInfo';
import { message } from 'antd';
import classNames from 'classnames';
import { MarkdownCMDRef } from 'ds-markdown';
import { isEqual } from 'lodash';
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import ChatBottomDebug from './ChatBottomDebug';
import ChatBottomMore from './ChatBottomMore';
import ChatSampleBottom from './ChatSampleBottom';
import RunOver from './RunOver';
import styles from './index.less';

const cx = classNames.bind(styles);

// 聊天视图组件
const ChatView: React.FC<ChatViewProps> = memo(
  ({ className, contentClassName, roleInfo, messageInfo, mode = 'chat' }) => {
    const markdownRef = useRef<MarkdownCMDRef>(null);
    const lastTextPos = useRef(0);
    const { userInfo } = useModel('userInfo');
    const messageId = useRef(messageInfo?.id || uuidv4());
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

    const disableTyping = useMemo(() => {
      return true;
    }, []);

    useEffect(() => {
      // console.log(
      //   'messageInfo',
      //   messageInfo?.text,
      //   lastTextPos.current,
      //   messageId.current,
      //   messageInfo?.processingList,
      // );
      // console.log('disableTyping', disableTyping);
      if (messageInfo?.text) {
        //取出差量部分
        const diffText = messageInfo?.text.slice(lastTextPos.current);
        lastTextPos.current = messageInfo?.text.length;
        // 由于text 是全量的，所以需要处理增量部分
        // 处理增量渲染
        markdownRef.current?.push(diffText, 'answer');
      } else if (messageInfo?.think) {
        const diffText = messageInfo?.think.slice(lastTextPos.current);
        lastTextPos.current = messageInfo?.think.length;
        markdownRef.current?.push(diffText, 'thinking');
      } else {
        markdownRef.current?.clear();
      }
    }, [messageInfo?.text]);
    useEffect(() => {
      // console.log('messageInfo:mount', messageInfo.id, messageInfo);
      return () => {
        // console.log('messageInfo:unmount', messageInfo.id, messageInfo);
        markdownRef.current?.clear();
        lastTextPos.current = 0;
        messageId.current = '';
      };
    }, []);
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
                {!!messageInfo?.think && (
                  <div
                    className={cx(
                      styles['think-content'],
                      'radius-6',
                      'w-full',
                    )}
                  >
                    <MarkdownRenderer
                      key={`think-${messageId.current}`}
                      id={`think-${messageId.current}`}
                      markdownRef={markdownRef}
                      answerType="thinking"
                      disableTyping={disableTyping}
                      onCopy={handleCodeCopy}
                    />
                  </div>
                )}
                {!!messageInfo?.text && (
                  <div
                    className={cx(
                      styles['chat-content'],
                      'radius-6',
                      'w-full',
                      {
                        [styles.typing]:
                          messageInfo.status === MessageStatusEnum.Incomplete ||
                          messageInfo.status === MessageStatusEnum.Loading,
                      },
                    )}
                  >
                    <MarkdownRenderer
                      key={`text-${messageId.current}`}
                      id={`text-${messageId.current}`}
                      markdownRef={markdownRef}
                      answerType="answer"
                      disableTyping={disableTyping}
                      onCopy={handleCodeCopy}
                    />
                  </div>
                )}
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
