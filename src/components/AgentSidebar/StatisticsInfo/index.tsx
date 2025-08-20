import { StatisticsInfoProps } from '@/types/interfaces/agentTask';
import {
  CloseOutlined,
  PlayCircleOutlined,
  StarFilled,
  UserOutlined,
} from '@ant-design/icons';
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
      {/*用户人数*/}
      <span className={cx(styles.text, 'flex')}>
        <UserOutlined />
        <span>0</span>
      </span>
      {/*会话次数*/}
      <span className={cx(styles.text, 'flex')}>
        <PlayCircleOutlined />
        <span>0</span>
      </span>
      {/*收藏次数*/}
      <span className={cx(styles.text, 'flex')}>
        <StarFilled />
        <span>0</span>
      </span>
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
