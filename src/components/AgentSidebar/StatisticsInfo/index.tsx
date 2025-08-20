import SvgIcon from '@/components/base/SvgIcon';
import { StatisticsInfoProps } from '@/types/interfaces/agentTask';
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
      <SvgIcon
        name="icons-chat-close_regular"
        className={styles.close}
        onClick={onClose}
        style={{
          display: visible ? 'block' : 'none',
          fontSize: 24,
        }}
      />
    </header>
  );
};

export default StatisticsInfo;
