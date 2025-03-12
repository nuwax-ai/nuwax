import agentImage from '@/assets/images/agent_image.png';
import personal from '@/assets/images/personal.png';
import ConditionRender from '@/components/ConditionRender';
import { USER_INFO } from '@/constants/home.constants';
import { AssistantRoleEnum } from '@/types/enums/agent';
import type { ChatViewProps } from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import markdown from 'markdown-it';
import React, { useMemo } from 'react';
import ChatBottomMore from './ChatBottomMore';
import styles from './index.less';
import RunOver from './RunOver';

const cx = classNames.bind(styles);

const md = markdown({ html: true, breaks: true });

const ChatView: React.FC<ChatViewProps> = ({
  roleInfo,
  messageInfo,
  onDebug,
}) => {
  // 当前用户信息
  const userInfo = JSON.parse(localStorage.getItem(USER_INFO));

  const info = useMemo(() => {
    const { user, assistant, system } = roleInfo;
    switch (messageInfo?.role) {
      // 用户信息
      case AssistantRoleEnum.USER:
        return {
          name: user.name || userInfo.nickName,
          avatar: user.avatar || userInfo.avatar || personal,
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
  }, [roleInfo, messageInfo]);

  const handleCopy = () => {
    console.log('复制文本');
  };

  return (
    <div className={cx(styles.container, 'flex')}>
      <img className={cx(styles.avatar)} src={info?.avatar as string} alt="" />
      <div className={cx('flex-1')}>
        <div className={cx(styles.author)}>{info?.name}</div>
        <ConditionRender
          condition={
            messageInfo.role === AssistantRoleEnum.USER && !!messageInfo?.text
          }
        >
          <div
            className={cx(styles['chat-content'], 'radius-6')}
            dangerouslySetInnerHTML={{
              __html: md.render(messageInfo?.text?.toString()),
            }}
          />
        </ConditionRender>
        <ConditionRender
          condition={messageInfo.role !== AssistantRoleEnum.USER}
        >
          <RunOver messageInfo={messageInfo} />
          <ConditionRender condition={!!messageInfo?.text}>
            <div
              className={cx(styles['chat-content'], 'radius-6')}
              dangerouslySetInnerHTML={{
                __html: md.render(messageInfo?.text?.toString()),
              }}
            />
          </ConditionRender>
          <ConditionRender condition={!!messageInfo?.finalResult}>
            <ChatBottomMore onCopy={handleCopy} onDebug={onDebug} />
          </ConditionRender>
        </ConditionRender>
      </div>
    </div>
  );
};

export default ChatView;
