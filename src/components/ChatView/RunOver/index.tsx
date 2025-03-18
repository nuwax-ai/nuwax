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
const RunOver: React.FC<RunOverProps> = ({ messageInfo }) => {
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

  // 查询过程信息 - 最后一个
  const lastProcessInfo = useMemo(() => {
    const len = processingList?.length || 0;
    if (len > 0) {
      return processingList?.[len - 1];
    }
    return null;
  }, [processingList]);

  return (
    <Popover
      placement="bottomLeft"
      overlayInnerStyle={{
        padding: 0,
      }}
      content={
        <div className={cx(styles['pop-content'])}>
          {processingList?.map((info, index) => {
            return (
              info.status === ProcessingEnum.FINISHED && (
                <div
                  key={index}
                  className={cx(styles.row, 'flex', 'items-center')}
                >
                  <SolutionOutlined />
                  <span className={cx('flex-1')}>{`已调用 ${info.name}`}</span>
                  <span>{`${
                    info.result?.endTime - info.result?.startTime
                  }ms`}</span>
                </div>
              )
            );
          })}
          <span className={cx(styles.summary)}>{`运行完毕 ${runTime}s`}</span>
        </div>
      }
      arrow={false}
      trigger="hover"
    >
      <span className={cx('cursor-pointer', styles['run-success'])}>
        {messageInfo?.status === MessageStatusEnum.Loading ? (
          <>
            <LoadingOutlined />
            {lastProcessInfo && (
              <span className={cx(styles['status-name'])}>
                {lastProcessInfo.status === ProcessingEnum.EXECUTING
                  ? `正在调用 `
                  : `已调用 `}
                {lastProcessInfo.name}
              </span>
            )}
          </>
        ) : messageInfo?.status === MessageStatusEnum.Incomplete ? (
          <LoadingOutlined />
        ) : (
          <span>
            运行完毕
            <DownOutlined className={cx(styles.icon)} />
          </span>
        )}
      </span>
    </Popover>
  );
};

export default RunOver;
