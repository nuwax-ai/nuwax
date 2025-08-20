import { StatisticsInfoProps } from '@/types/interfaces/agentTask';
import { CloseOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 统计信息
const StatisticsInfo: React.FC<StatisticsInfoProps> = ({
  onClose,
  visible,
}) => {
  return (
    <header className={cx(styles.header, 'flex', 'items-center')}>
      <CloseOutlined
        className={cx('cursor-pointer', styles.close)}
        onClick={onClose}
        style={{
          display: visible ? 'block' : 'none',
        }}
      />
    </header>
  );
};

export default StatisticsInfo;
