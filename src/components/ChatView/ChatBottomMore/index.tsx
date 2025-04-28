import debugImage from '@/assets/images/debug_image.png';
import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/TooltipIcon';
import { TooltipTitleTypeEnum } from '@/types/enums/common';
import type { ChatBottomMoreProps } from '@/types/interfaces/common';
import { CopyOutlined } from '@ant-design/icons';
import { message, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

// 聊天框底部更多操作组件
const ChatBottomMore: React.FC<ChatBottomMoreProps> = ({ messageInfo }) => {
  // finalResult 自定义添加字段：chat 会话结果
  const { text, finalResult } = messageInfo || {};
  const { handleDebug } = useModel('conversationInfo');

  const handleCopy = () => {
    message.success('复制成功');
  };

  // 运行时间
  const runTime = useMemo(() => {
    if (!!finalResult) {
      return ((finalResult?.endTime - finalResult?.startTime) / 1000).toFixed(
        1,
      );
    }
    return 0;
  }, [finalResult]);

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
          <span>{`${runTime}s`}</span>
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
        <ConditionRender condition={!!finalResult}>
          <TooltipIcon
            className={styles.icon}
            icon={<img src={debugImage as string} alt="" />}
            onClick={() => handleDebug(messageInfo)}
            title="调试"
            type={TooltipTitleTypeEnum.White}
          />
        </ConditionRender>
      </div>
    </div>
  );
};

export default ChatBottomMore;
