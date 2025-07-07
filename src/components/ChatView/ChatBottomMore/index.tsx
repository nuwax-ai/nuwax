import copyImage from '@/assets/images/copy.png';
import TooltipIcon from '@/components/TooltipIcon';
import { TooltipTitleTypeEnum } from '@/types/enums/common';
import type { ChatBottomMoreProps } from '@/types/interfaces/common';
import { message } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
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
      <div className={cx('flex', 'items-center', styles['elapsed-time'])}></div>
      <div className={cx('flex', styles['more-action'])}>
        <CopyToClipboard text={text || ''} onCopy={handleCopy}>
          <TooltipIcon
            className={styles.icon}
            icon={
              <img
                className={cx(styles['copy-image'])}
                src={copyImage}
                alt=""
              />
            }
            title="复制"
            type={TooltipTitleTypeEnum.White}
          />
        </CopyToClipboard>
      </div>
    </div>
  );
};

export default ChatBottomMore;
