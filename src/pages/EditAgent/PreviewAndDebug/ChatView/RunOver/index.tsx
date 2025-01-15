import {
  CheckCircleOutlined,
  DownOutlined,
  SolutionOutlined,
  UnorderedListOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { Popover } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 运行完毕
 */
const RunOver: React.FC = () => {
  return (
    <Popover
      placement="bottomLeft"
      title={null}
      overlayInnerStyle={{
        padding: 0,
      }}
      content={
        <div className={cx(styles['pop-content'])}>
          <div className={cx(styles['row'], 'flex', 'items-center')}>
            <UnorderedListOutlined />
            <span className={cx('flex-1')}>隐藏运行过程</span>
            <UpOutlined />
          </div>
          <div className={cx(styles['row'], 'flex', 'items-center')}>
            <SolutionOutlined />
            <span className={cx('flex-1')}>从长期记忆召回的内容</span>
            <span>0.2s</span>
          </div>
          <div className={cx(styles['row'], 'flex', 'items-center')}>
            <SolutionOutlined />
            <span className={cx('flex-1')}>已调用 必应搜索</span>
            <span>5.1s: 模型3.8s | 工具1.3s</span>
          </div>
          <span className={cx(styles.summary)}>
            运行完毕5.3s (LLM 3.8s | 插件1.3s | 长期记忆0.2s)
          </span>
        </div>
      }
      arrow={false}
      trigger="hover"
    >
      <div
        className={cx(
          'flex',
          'items-center',
          'cursor-pointer',
          styles['run-success'],
        )}
      >
        <CheckCircleOutlined />
        <span className={cx('flex-1')}>运行完毕</span>
        <DownOutlined />
      </div>
    </Popover>
  );
};

export default RunOver;
