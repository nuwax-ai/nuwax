import debugImage from '@/assets/images/debug_image.png';
import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { TooltipTitleTypeEnum } from '@/types/enums/common';
import { EditAgentShowType } from '@/types/enums/space';
import { ChatBottomDebugProps } from '@/types/interfaces/common';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

// 聊天框底部更多操作组件
const ChatBottomDebug: React.FC<ChatBottomDebugProps> = ({ messageInfo }) => {
  // finalResult 自定义添加字段：chat 会话结果
  const { finalResult } = messageInfo || {};
  const { handleDebug, showType } = useModel('conversationInfo');

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
        {(showType === EditAgentShowType.Version_History ||
          showType === EditAgentShowType.Show_Stand ||
          showType === EditAgentShowType.Hide) && (
          <ConditionRender condition={!!finalResult}>
            <TooltipIcon
              className={styles.icon}
              icon={<img src={debugImage as string} alt="" />}
              onClick={() => handleDebug(messageInfo)}
              title="调试"
              type={TooltipTitleTypeEnum.White}
            />
          </ConditionRender>
        )}
      </div>
    </div>
  );
};

export default ChatBottomDebug;
