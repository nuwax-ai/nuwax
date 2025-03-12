import personal from '@/assets/images/personal.png';
import { USER_INFO } from '@/constants/home.constants';
import { AssistantRoleEnum } from '@/types/enums/agent';
import type { ChatViewProps } from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import markdown from 'markdown-it';
import React from 'react';
import ChatBottomMore from './ChatBottomMore';
import styles from './index.less';
import RunOver from './RunOver';

const cx = classNames.bind(styles);

const md = markdown({ html: true, breaks: true });

const ChatView: React.FC<ChatViewProps> = ({
  icon,
  name,
  avatar,
  nickname,
  messageInfo,
  // agentConfigInfo,
  onCopy,
  onDebug,
}) => {
  const userInfo = JSON.parse(localStorage.getItem(USER_INFO));
  return (
    <div className={cx(styles.container, 'flex')}>
      {messageInfo.role !== AssistantRoleEnum.USER ? (
        <>
          <img className={cx(styles.avatar)} src={icon} alt="" />
          <div className={cx('flex-1')}>
            <div className={cx(styles.author)}>{name}</div>
            <RunOver />
            <div
              className={cx(styles['chat-content'], 'radius-6')}
              dangerouslySetInnerHTML={{ __html: md.render(messageInfo.text) }}
            />
            <ChatBottomMore onCopy={onCopy} onDebug={onDebug} />
          </div>
        </>
      ) : (
        <>
          <img
            className={cx(styles.avatar)}
            src={avatar || userInfo?.avatar || (personal as string)}
            alt=""
          />
          <div className={cx('flex-1')}>
            <div className={cx(styles.author)}>
              {nickname || userInfo?.nickName}
            </div>
            <div
              className={cx(styles['chat-content'], 'radius-6')}
              dangerouslySetInnerHTML={{ __html: md.render(messageInfo.text) }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatView;
