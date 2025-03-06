import personal from '@/assets/images/personal.png';
import { USER_INFO } from '@/constants/home.constants';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageInfo } from '@/types/interfaces/agent';
import classNames from 'classnames';
import React from 'react';
import ChatBottomMore from './ChatBottomMore';
import styles from './index.less';
import RunOver from './RunOver';

const cx = classNames.bind(styles);

interface ChatViewProps {
  messageInfo: MessageInfo;
  // 智能体图标
  icon: string;
  // 智能体名称
  name: string;
  // 用户头像
  avatar?: string;
  // 用户昵称
  nickname?: string;
  onCopy?: () => void;
  onDebug?: () => void;
}

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
