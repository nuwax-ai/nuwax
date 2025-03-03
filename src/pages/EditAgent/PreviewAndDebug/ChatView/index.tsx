import personal from '@/assets/images/personal.png';
import { USER_INFO } from '@/constants/home.constants';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { AgentConfigInfo, MessageInfo } from '@/types/interfaces/agent';
import classNames from 'classnames';
import React from 'react';
import ChatBottomMore from './ChatBottomMore';
import styles from './index.less';
import RunOver from './RunOver';

const cx = classNames.bind(styles);

interface ChatViewProps {
  messageInfo: MessageInfo;
  agentConfigInfo: AgentConfigInfo;
  avatar: string;
  nickname: string;
  onCopy?: () => void;
  onDebug?: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({
  avatar,
  nickname,
  messageInfo,
  agentConfigInfo,
  onCopy,
  onDebug,
}) => {
  const userInfo = JSON.parse(localStorage.getItem(USER_INFO));
  return (
    <div className={cx(styles.container, 'flex')}>
      {messageInfo.role !== AssistantRoleEnum.USER ? (
        <>
          <img
            className={cx(styles.avatar)}
            src={agentConfigInfo?.icon}
            alt=""
          />
          <div className={cx('flex-1')}>
            <div className={cx(styles.author)}>{agentConfigInfo?.name}</div>
            <RunOver />
            <div className={cx(styles['chat-content'], 'radius-6')}>
              {messageInfo.text}
            </div>
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
            <span className={cx(styles['chat-content'], 'radius-6')}>
              {messageInfo.text}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatView;
