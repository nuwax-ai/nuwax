import CopyButton from '@/components/base/CopyButton';
import ConditionRender from '@/components/ConditionRender';
import { MessageInfo } from '@/types/interfaces/conversationInfo';
import { CopyOutlined } from '@ant-design/icons';
import { message } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 聊天框底部更多操作组件
export interface PromptViewBottomMoreProps {
  messageInfo: MessageInfo;
}

// 优化提示词框底部更多操作组件
const PromptViewBottomMore: React.FC<PromptViewBottomMoreProps> = ({
  messageInfo,
}) => {
  // finalResult 自定义添加字段：chat 会话结果
  const { text, finalResult } = messageInfo || {};

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
      <div className={cx('flex', 'items-center', styles['elapsed-time'])}>
        <ConditionRender condition={!!finalResult}>
          {/* {ifShowReplace && (
            <Button className={cx(styles['replace-btn'])} onClick={() => onReplace?.(text)}>{`替换`}</Button>
          )} */}
          <ConditionRender condition={!!finalResult?.totalTokens}>
            <span className={cx(styles['vertical-line'])} />
            <span>{`${finalResult?.totalTokens} Tokens`}</span>
          </ConditionRender>
        </ConditionRender>
      </div>
      <div className={cx('flex', styles['more-action'])}>
        <CopyButton
          text={text || ''}
          onCopy={handleCopy}
          icon={<CopyOutlined />}
        >
          复制
        </CopyButton>
      </div>
    </div>
  );
};

export default PromptViewBottomMore;
