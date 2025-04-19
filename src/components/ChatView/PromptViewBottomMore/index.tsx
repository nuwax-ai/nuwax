import ConditionRender from '@/components/ConditionRender';
import { MessageInfo } from '@/types/interfaces/conversationInfo';
import { CopyOutlined } from '@ant-design/icons';
import { Button, message, Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import styles from './index.less';

const cx = classNames.bind(styles);

// 聊天框底部更多操作组件
export interface PromptViewBottomMoreProps {
  onReplace: (text?: string) => void;
  messageInfo: MessageInfo;
}

// 优化提示词框底部更多操作组件
const PromptViewBottomMore: React.FC<PromptViewBottomMoreProps> = ({
  messageInfo,
  onReplace,
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
          <Button
            onClick={() => onReplace(text)}
            size="small"
            type="primary"
          >{`替换`}</Button>
          <ConditionRender condition={!!finalResult?.totalTokens}>
            <span className={cx(styles['vertical-line'])} />
            <span>{`${finalResult?.totalTokens} Tokens`}</span>
          </ConditionRender>
        </ConditionRender>
      </div>
      <div className={cx('flex', styles['more-action'])}>
        <CopyToClipboard text={text || ''} onCopy={handleCopy}>
          <Tooltip title="复制">
            <span
              className={cx(
                'hover-box',
                'flex',
                'content-center',
                'items-center',
                'cursor-pointer',
              )}
            >
              <CopyOutlined />
            </span>
          </Tooltip>
        </CopyToClipboard>
      </div>
    </div>
  );
};

export default PromptViewBottomMore;
