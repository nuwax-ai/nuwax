import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type { RunOverProps } from '@/types/interfaces/common';
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
  const { finalResult, processingList } = messageInfo;

  // 运行时间
  const runTime = useMemo(() => {
    if (finalResult) {
      return ((finalResult?.endTime - finalResult?.startTime) / 1000).toFixed(
        1,
      );
    }
    return 0;
  }, [finalResult]);

  const getTime = (endTime: number, startTime: number) => {
    // Safety check: ensure both timestamps are valid numbers
    if (!endTime || !startTime || endTime <= 0 || startTime <= 0) {
      return '';
    }
    const time = endTime - startTime;
    // Handle negative time (invalid data)
    if (time < 0) {
      return '';
    }
    if (time < 1000) {
      return `${time}ms`;
    } else {
      return `${(time / 1000).toFixed(1)}s`;
    }
  };

  // 查询过程信息 - 最后一个
  const lastProcessInfo = useMemo(() => {
    const len = processingList?.length || 0;
    if (len > 0) {
      return processingList?.[len - 1];
    }
    return null;
  }, [processingList]);

  // 如果最后一个过程信息为空，则显示loading状态
  if (!lastProcessInfo) {
    return <LoadingOutlined className={cx(styles.successColor)} />;
  }

  return (
    <Popover
      placement="bottomLeft"
      styles={{
        body: {
          padding: 0,
        },
      }}
      content={
        <div className={cx(styles['pop-content'])}>
          {processingList?.map((info, index) => {
            return (
              // 状态不为执行中时：即完成或者失败状态
              info.status !== ProcessingEnum.EXECUTING && (
                <div
                  key={index}
                  className={cx(styles.row, 'flex', 'items-center')}
                >
                  <SolutionOutlined />
                  <span
                    className={cx('flex-1', 'text-ellipsis')}
                  >{`已调用 ${info.name}`}</span>
                  <span>
                    {getTime(info.result.endTime, info.result.startTime)}
                  </span>
                </div>
              )
            );
          })}

          {messageInfo?.status === MessageStatusEnum.Complete && (
            <span className={cx(styles.summary)}>{`运行完毕 ${runTime}s`}</span>
          )}

          {messageInfo?.status === MessageStatusEnum.Error && (
            <span className={cx(styles.error)}>运行错误</span>
          )}
        </div>
      }
      arrow={false}
      trigger="hover"
    >
      <div className={cx('cursor-pointer', styles['run-success'])}>
        {/* 显示loading状态 */}
        {messageInfo?.status === MessageStatusEnum.Loading ||
        messageInfo?.status === MessageStatusEnum.Incomplete ? (
          <>
            <LoadingOutlined className={cx(styles.successColor)} />
            {showStatusDesc && lastProcessInfo && (
              <span className={cx(styles['status-name'])}>
                {lastProcessInfo.status === ProcessingEnum.EXECUTING
                  ? `正在调用 `
                  : `已调用 `}
                {lastProcessInfo.name}
              </span>
            )}
          </>
        ) : messageInfo?.status === MessageStatusEnum.Error ? (
          <span>运行错误</span>
        ) : (
          <span>
            运行完毕
            <DownOutlined className={cx(styles.icon)} />
          </span>
        )}
      </div>
    </Popover>
  );
};

export default RunOver;
