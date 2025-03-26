import agentImage from '@/assets/images/agent_image.png';
import personal from '@/assets/images/personal.png';
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
  canDebug,
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
          name: _userInfo?.nickName || _userInfo?.userName,
          avatar: _userInfo?.avatar || personal,
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
                'radius-6',
                contentClassName,
              )}
              dangerouslySetInnerHTML={{
                __html: md.render(messageInfo?.text),
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
          {/*think*/}
          {!!messageInfo?.think && !!md.render(messageInfo?.think) && (
            <div
              className={cx(
                styles['chat-content'],
                styles['mb-10'],
                'radius-6',
                'w-full',
                contentClassName,
              )}
              dangerouslySetInnerHTML={{
                __html: md.render(messageInfo?.think),
              }}
            />
          )}
          {/*文本内容*/}
          {!!messageInfo?.text && (
            <div
              className={cx(
                styles['chat-content'],
                'radius-6',
                'w-full',
                contentClassName,
              )}
              dangerouslySetInnerHTML={{
                __html: md.render(messageInfo?.text),
              }}
            />
          )}
          {/*底部区域*/}
          <ConditionRender
            condition={
              messageInfo &&
              (messageInfo?.status === MessageStatusEnum.Complete ||
                !messageInfo?.status)
            }
          >
            <ChatBottomMore messageInfo={messageInfo} canDebug={canDebug} />
          </ConditionRender>
        </ConditionRender>
      </div>
    </div>
  );
};

export default ChatView;
