import type { AnalyzeStatisticsProps } from '@/types/interfaces/common';
import { Modal } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const AnalyzeStatistics: React.FC<AnalyzeStatisticsProps> = ({
  open,
  onCancel,
  title,
  list,
}) => {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={title}
      footer={false}
      width={556}
    >
      <div className={cx('flex', 'flex-wrap', styles['analyze-wrapper'])}>
        {list?.map((item, index) => (
          <div
            key={index}
            className={cx(styles['analyze-box'], 'flex', 'flex-col')}
          >
            <span>{item.label}</span>
            <div className={cx('flex', 'items-center', 'content-center')}>
              {item.value as string}
            </div>
          </div>
        ))}
        <div className={cx(styles['row-line'])} />
        <div className={cx(styles['vertical-line'])} />
      </div>
    </Modal>
  );
};

export default AnalyzeStatistics;
