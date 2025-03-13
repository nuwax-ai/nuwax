import { MessageStatusEnum } from '@/types/enums/common';
import type { RunOverProps } from '@/types/interfaces/common';
import { DownOutlined, LoadingOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 运行状态组件：进行中、运行完毕
 */
const RunOver: React.FC<RunOverProps> = ({ messageInfo }) => {
  const { finalResult } = messageInfo;

  // 运行时间
  const runTime = useMemo(() => {
    if (finalResult) {
      return ((finalResult?.endTime - finalResult?.startTime) / 1000).toFixed(
        1,
      );
    }
    return 0;
  }, [finalResult]);

  return (
    <Popover
      placement="bottomLeft"
      overlayInnerStyle={{
        padding: 0,
      }}
      content={
        <div className={cx(styles['pop-content'])}>
          {/*<div className={cx(styles['row'], 'flex', 'items-center')}>*/}
          {/*  <UnorderedListOutlined />*/}
          {/*  <span className={cx('flex-1')}>隐藏运行过程</span>*/}
          {/*  <UpOutlined />*/}
          {/*</div>*/}
          {/*<div className={cx(styles['row'], 'flex', 'items-center')}>*/}
          {/*  <SolutionOutlined />*/}
          {/*  <span className={cx('flex-1')}>从长期记忆召回的内容</span>*/}
          {/*  <span>0.2s</span>*/}
          {/*</div>*/}
          {/*<div className={cx(styles['row'], 'flex', 'items-center')}>*/}
          {/*  <SolutionOutlined />*/}
          {/*  <span className={cx('flex-1')}>已调用 必应搜索</span>*/}
          {/*  <span>5.1s: 模型3.8s | 工具1.3s</span>*/}
          {/*</div>*/}
          <span className={cx(styles.summary)}>
            {/*{`运行完毕${runTime}s (LLM 3.8s | 插件1.3s | 长期记忆0.2s)`}*/}
            {`运行完毕 ${runTime}s`}
          </span>
        </div>
      }
      arrow={false}
      trigger="hover"
    >
      <span className={cx('cursor-pointer', styles['run-success'])}>
        {messageInfo?.status === MessageStatusEnum.Loading ? (
          <LoadingOutlined />
        ) : messageInfo?.status === MessageStatusEnum.Incomplete ? (
          <span>已从海量知识库中搜索到结果</span>
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
