import agentImage from '@/assets/images/agent_image.png';
import avatar from '@/assets/images/avatar.png';
import AttachFile from '@/components/ChatView/AttachFile';
import ConditionRender from '@/components/ConditionRender';
import { USER_INFO } from '@/constants/home.constants';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  AttachmentFile,
  ChatViewProps,
} from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import markdown from 'markdown-it';
import React, { useMemo } from 'react';
import { useModel } from 'umi';
import ChatBottomMore from './ChatBottomMore';
import ChatSampleBottom from './ChatSampleBottom';
import styles from './index.less';
import RunOver from './RunOver';

const cx = classNames.bind(styles);

const md = markdown({
  html: true,
  breaks: true,
  linkify: true,
});

const ChatView: React.FC<ChatViewProps> = ({
  className,
  contentClassName,
  roleInfo,
  messageInfo,
  mode = 'chat',
}) => {
  const { userInfo } = useModel('userInfo');
  // 当前用户信息
  const _userInfo =
    userInfo || JSON.parse(localStorage.getItem(USER_INFO) as string);

  // 角色名称和头像
  const info = useMemo(() => {
    const { assistant, system } = roleInfo;
    switch (messageInfo?.role) {
      // 用户信息
      case AssistantRoleEnum.USER:
        return {
          name: _userInfo?.nickName || _userInfo?.userName || '游客',
          avatar: _userInfo?.avatar || avatar,
        };
      // 助手信息
      case AssistantRoleEnum.ASSISTANT:
        return {
          name: assistant.name,
          avatar: assistant.avatar || agentImage,
        };
      // 系统信息
      case AssistantRoleEnum.SYSTEM:
        return {
          name: system.name,
          avatar: system.avatar || agentImage,
        };
    }
  }, [roleInfo, _userInfo, messageInfo?.role]);

  return (
    <div className={cx(styles.container, 'flex', className)}>
      <img className={cx(styles.avatar)} src={info?.avatar as string} alt="" />
      <div className={cx('flex-1')}>
        <div className={cx(styles.author)}>{info?.name}</div>
        {!!messageInfo?.attachments?.length && (
          <AttachFile files={messageInfo?.attachments as AttachmentFile[]} />
        )}
        {/*用户信息*/}
        {messageInfo?.role === AssistantRoleEnum.USER &&
          !!messageInfo?.text && (
            <div
              className={cx(
                styles['chat-content'],
                styles.user,
                'radius-6',
                contentClassName,
              )}
              dangerouslySetInnerHTML={{
                __html: md.render(messageInfo.text),
              }}
            />
          )}
        {/*助手信息或系统信息*/}
        <ConditionRender
          condition={messageInfo?.role !== AssistantRoleEnum.USER}
        >
          {/*运行状态*/}
          <ConditionRender condition={!!messageInfo?.status}>
            <RunOver messageInfo={messageInfo} />
          </ConditionRender>
          {(!!messageInfo?.think || !!messageInfo?.text) && (
            <div className={cx(styles['inner-container'], contentClassName)}>
              {/*think*/}
              {!!messageInfo?.think && !!md.render(messageInfo.think) && (
                <div
                  className={cx(styles['think-content'], 'radius-6', 'w-full')}
                  dangerouslySetInnerHTML={{
                    __html: md.render(messageInfo.think),
                  }}
                />
              )}
              {/*文本内容*/}
              {!!messageInfo?.text && (
                <div
                  className={cx(styles['chat-content'], 'radius-6', 'w-full')}
                  dangerouslySetInnerHTML={{
                    __html: md.render(messageInfo.text),
                  }}
                />
              )}
            </div>
          )}
          {/*底部区域*/}
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
};

export default ChatView;
