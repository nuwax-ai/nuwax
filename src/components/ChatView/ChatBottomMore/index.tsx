import CopyButton from '@/components/base/CopyButton';
import { dict } from '@/services/i18nRuntime';
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
    message.success(dict('PC.Toast.Global.copiedSuccessfully'));
  };

  // 如果消息内容为空，则不显示复制按钮
  if (!text) {
    return null;
  }

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
          {dict('PC.Common.Global.copy')}
        </CopyButton>
      </div>
    </div>
  );
};

export default ChatBottomMore;
