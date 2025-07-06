import agentImage from '@/assets/images/agent_image.png';
import avatar from '@/assets/images/avatar.png';
import copyImage from '@/assets/images/copy.png';
import AttachFile from '@/components/ChatView/AttachFile';
import ConditionRender from '@/components/ConditionRender';
import { ChatMarkdownRenderer } from '@/components/MarkdownRenderer';
import { USER_INFO } from '@/constants/home.constants';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  AttachmentFile,
  ChatViewProps,
} from '@/types/interfaces/conversationInfo';
import { message } from 'antd';
import classNames from 'classnames';
import { isEqual } from 'lodash';
import React, { memo } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useModel } from 'umi';
import ChatBottomMore from './ChatBottomMore';
import ChatSampleBottom from './ChatSampleBottom';
import RunOver from './RunOver';
import styles from './index.less';

const cx = classNames.bind(styles);

// 聊天视图组件
const ChatView: React.FC<ChatViewProps> = memo(
  ({ className, contentClassName, roleInfo, messageInfo, mode = 'chat' }) => {
    const { userInfo } = useModel('userInfo');
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

    // 自定义 CSS 类名配置，复用 ChatView 的样式
    const markdownConfig = {
      cssClasses: {
        codeBlockWrapper: 'code-block-wrapper',
        codeHeader: 'code-header',
        extBox: 'ext-box',
        copyImg: 'copy-img',
        customTable: 'custom-table',
        imageOverlay: 'image-overlay',
      },
      // 确保全局函数正确启用，包括代码折叠功能
      globalFunctions: {
        handleClipboard: true,
        showImageInModal: true,
        toggleCodeCollapse: true,
      },
    };

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
                  )}
                >
                  <ChatMarkdownRenderer
                    id={`text-${messageInfo?.id}`}
                    content={messageInfo.text}
                    config={markdownConfig}
                    onCopy={handleCodeCopy}
                  />
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
              <RunOver messageInfo={messageInfo} />
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
                    <ChatMarkdownRenderer
                      id={`think-${messageInfo?.id}`}
                      content={messageInfo.think}
                      config={markdownConfig}
                      onCopy={handleCodeCopy}
                    />
                  </div>
                )}
                {!!messageInfo?.text && (
                  <div
                    className={cx(styles['chat-content'], 'radius-6', 'w-full')}
                  >
                    <ChatMarkdownRenderer
                      id={`text-${messageInfo?.id}`}
                      content={messageInfo.text}
                      config={markdownConfig}
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
                <ChatBottomMore messageInfo={messageInfo} />
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
