import { ChatSampleBottomProps } from '@/types/interfaces/conversationInfo';
import { message } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import styles from './index.less';
// import shareImage from '@/assets/images/share.png';
import copyImage from '@/assets/images/copy.png';
import { formatTimeAgo } from '@/utils/common';

const cx = classNames.bind(styles);

// 聊天框底部更多操作组件
const ChatSampleBottom: React.FC<ChatSampleBottomProps> = ({ messageInfo }) => {
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
        <CopyToClipboard text={messageInfo?.text || ''} onCopy={handleCopy}>
          <span
            className={cx(
              'flex',
              'content-center',
              'items-center',
              'cursor-pointer',
            )}
          >
            <img src={copyImage} alt="" />
            <span>复制</span>
          </span>
        </CopyToClipboard>
        {/* <span
          className={cx(
            'flex',
            'content-center',
            'items-center',
            'cursor-pointer',
          )}
        >
          <img src={shareImage} alt="" />
          <span>分享</span>
        </span> */}
      </div>
      <span>{formatTimeAgo(messageInfo?.time)}</span>
    </div>
  );
};

export default ChatSampleBottom;
