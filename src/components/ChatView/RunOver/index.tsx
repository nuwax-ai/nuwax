import { dict } from '@/services/i18nRuntime';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type { RunOverProps } from '@/types/interfaces/common';
import {
  formatFinalResultElapsedSeconds,
  formatProcessingStepDurationLabel,
} from '@/utils/conversationFinalResult';
import {
  DownOutlined,
  LoadingOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import { Popover } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 运行状态组件：进行中、运行完毕
 */
const RunOver: React.FC<RunOverProps> = ({
  messageInfo,
  showStatusDesc = true,
}) => {
  const { finalResult, processingList, think, text } = messageInfo;

  // 是否存在思考
  const hasThinking = !!think && think.trim() !== '';
  // 是否思考完毕
  const isThinkingFinished = !!text && text.trim() !== '';
  // 是否正在思考
  const isThinking = hasThinking && !isThinkingFinished;

  const runTime = useMemo(
    () => formatFinalResultElapsedSeconds(finalResult ?? null),
    [finalResult],
  );

  // 查询过程信息 - 最后一个
  const lastProcessInfo = useMemo(() => {
    const len = processingList?.length || 0;
    if (len > 0) {
      return processingList?.[len - 1];
    }
    return null;
  }, [processingList]);

  // 计算 Popover content：如果 processingList 为空或没有已完成的项，则不显示 content
  const popoverContent = useMemo(() => {
    // 过滤出已完成的 processing 项（状态不为执行中）
    const completedProcesses =
      processingList?.filter(
        (info) => info.status !== ProcessingEnum.EXECUTING,
      ) || [];

    // 如果既没有已完成的 processing 项，则不显示 content
    if (completedProcesses.length === 0) {
      return null;
    }

    return (
      <div className={cx(styles['pop-content'])}>
        {completedProcesses.map((info, index) => (
          <div key={index} className={cx(styles.row, 'flex', 'items-center')}>
            <SolutionOutlined />
            <span className={cx('flex-1', 'text-ellipsis')}>
              {dict('PC.Components.RunOver.called', info.name)}
            </span>
            {/* result 在流式推送或异常数据时可能为 null，必须可选链避免读取 null.endTime */}
            <span>
              {formatProcessingStepDurationLabel(
                info.result?.endTime,
                info.result?.startTime,
              )}
            </span>
          </div>
        ))}

        {messageInfo?.status === MessageStatusEnum.Complete && (
          <span className={cx(styles.summary)}>
            {dict('PC.Components.RunOver.runComplete', String(runTime))}
          </span>
        )}

        {messageInfo?.status === MessageStatusEnum.Error && (
          <span className={cx(styles.error)}>
            {dict('PC.Components.RunOver.runError')}
          </span>
        )}
      </div>
    );
  }, [processingList, messageInfo?.status, runTime]);

  // 优化：只有在任务已完成（Complete 或 Error）且 processingList 为空时才不显示组件
  // 如果任务还在执行中（Loading 或 Incomplete），即使 processingList 为空也要显示加载状态
  if (
    !lastProcessInfo &&
    (messageInfo?.status === MessageStatusEnum.Complete ||
      messageInfo?.status === MessageStatusEnum.Error)
  ) {
    return null;
  }

  return (
    <Popover
      placement="bottomLeft"
      styles={{
        body: {
          padding: 0,
        },
      }}
      content={popoverContent}
      arrow={false}
      trigger="hover"
    >
      <div className={cx('cursor-pointer', styles['run-success'])}>
        {/* 显示loading状态 */}
        {isThinking ? (
          <>
            <LoadingOutlined className={cx(styles.successColor)} />
            <span className={cx(styles['status-name'])}>
              {dict('PC.Components.RunOver.thinking')}
            </span>
          </>
        ) : messageInfo?.status === MessageStatusEnum.Loading ||
          messageInfo?.status === MessageStatusEnum.Incomplete ? (
          <>
            <LoadingOutlined className={cx(styles.successColor)} />
            {showStatusDesc && lastProcessInfo && (
              <span className={cx(styles['status-name'])}>
                {lastProcessInfo.status === ProcessingEnum.EXECUTING
                  ? `${dict('PC.Components.RunOver.calling', '')} `
                  : `${dict('PC.Components.RunOver.called', '')} `}
                {lastProcessInfo.name}
              </span>
            )}
          </>
        ) : messageInfo?.status === MessageStatusEnum.Error ? (
          <span>{dict('PC.Components.RunOver.runError')}</span>
        ) : messageInfo?.status === MessageStatusEnum.Stopped ? null : ( // <span>已中断</span>
          <span>
            {dict('PC.Components.RunOver.runComplete')}
            <DownOutlined className={cx(styles.icon)} />
          </span>
        )}
      </div>
    </Popover>
  );
};

export default RunOver;
