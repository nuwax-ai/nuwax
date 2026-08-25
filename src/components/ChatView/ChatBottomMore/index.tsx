import CopyButton from '@/components/base/CopyButton';
import { stripThinkBlocks } from '@/plugins/ds-markdown-think';
import { dict } from '@/services/i18nRuntime';
import type { ChatBottomMoreProps } from '@/types/interfaces/common';
import { message } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 聊天框底部更多操作组件
const ChatBottomMore: React.FC<ChatBottomMoreProps> = ({ messageInfo }) => {
  // finalResult 自定义添加字段：chat 会话结果；
  // 复制内容与旧顶部思考区行为对齐：不含思考，剥离内联思考标签
  const copyText = stripThinkBlocks(messageInfo?.text || '');

  const handleCopy = () => {
    message.success(dict('PC.Toast.Global.copiedSuccessfully'));
  };

  // 如果消息内容为空，则不显示复制按钮
  if (!copyText) {
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
        <CopyButton text={copyText} onCopy={handleCopy}>
          {dict('PC.Common.Global.copy')}
        </CopyButton>
      </div>
    </div>
  );
};

export default ChatBottomMore;
