import classNames from 'classnames';
import React from 'react';
import ChatBottomMore from './ChatBottomMore';
import styles from './index.less';
import RunOver from './RunOver';

const cx = classNames.bind(styles);

interface ChatViewProps {
  avatar: string;
  nickname: string;
  content: React.ReactNode;
  onCopy?: () => void;
  onDebug?: () => void;
  onAsk?: () => void;
  // 重新生成事件
  onRegen?: () => void;
  onDel?: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({
  avatar,
  nickname,
  content,
  onCopy,
  onDebug,
  onAsk,
  onRegen,
  onDel,
}) => {
  return (
    <div className={cx(styles.container, 'flex')}>
      <img className={cx(styles.avatar)} src={avatar} alt="" />
      <div className={cx('flex-1')}>
        <div className={cx(styles.author)}>{nickname}</div>
        <RunOver />
        <div className={cx(styles['chat-content'], 'radius-6')}>{content}</div>
        <ChatBottomMore
          onCopy={onCopy}
          onDebug={onDebug}
          onAsk={onAsk}
          onRegen={onRegen}
          onDel={onDel}
        />
      </div>
    </div>
  );
};

export default ChatView;
