import CopyButton from '@/components/base/CopyButton';
import type { ChatBottomMoreProps } from '@/types/interfaces/common';
import { message } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 聊天框底部更多操作组件
const ChatBottomMore: React.FC<ChatBottomMoreProps> = ({ messageInfo }) => {
  // finalResult 自定义添加字段：chat 会话结果
  const { text } = messageInfo || {};

  const handleCopy = () => {
    message.success('复制成功');
  };

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
        <CopyButton text={text || ''} onCopy={handleCopy}>
          复制
        </CopyButton>
      </div>
    </div>
  );
};

export default ChatBottomMore;
