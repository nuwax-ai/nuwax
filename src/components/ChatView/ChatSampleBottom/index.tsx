import CopyButton from '@/components/base/CopyButton';
import { ChatSampleBottomProps } from '@/types/interfaces/conversationInfo';
import { formatTimeAgo } from '@/utils/common';
import { message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 聊天框底部更多操作组件
const ChatSampleBottom: React.FC<ChatSampleBottomProps> = ({ messageInfo }) => {
  const [createTime, setCreateTime] = useState<string>('');
  // 定时器ID
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);

  // 复制消息
  const handleCopy = () => {
    message.success('复制成功');
  };

  // 更新时间的函数
  const updateTime = () => {
    setCreateTime(formatTimeAgo(messageInfo?.time));
  };

  // 启动定时器，每分钟更新一次
  const startTimer = () => {
    // 立即更新一次
    updateTime();
    // 每分钟更新一次（60000毫秒）
    timerIdRef.current = setInterval(() => {
      updateTime();
    }, 60000);
  };

  useEffect(() => {
    if (messageInfo?.time) {
      startTimer();
    }
    return () => {
      // 停止定时器
      if (timerIdRef.current !== null) {
        clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
    };
  }, [messageInfo?.time]);

  return (
    <div
      className={cx(
        styles.container,
        'flex',
        'content-between',
        'items-center',
      )}
    >
      <div className={cx('flex', styles['more-action'])}>
        <CopyButton text={messageInfo?.text || ''} onCopy={handleCopy}>
          复制
        </CopyButton>
      </div>
      <span>{createTime}</span>
    </div>
  );
};

export default ChatSampleBottom;
