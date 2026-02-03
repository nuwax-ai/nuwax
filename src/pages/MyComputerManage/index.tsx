import { Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 我的电脑管理页面
 */
const MyComputerManage: React.FC = () => {
  return (
    <div className={cx(styles.container)}>
      <Typography.Title level={3} className={cx(styles.title)}>
        我的电脑管理
      </Typography.Title>
      <div className={cx(styles.content)}>
        <Typography.Text type="secondary">
          此功能正在开发中，敬请期待...
        </Typography.Text>
      </div>
    </div>
  );
};

export default MyComputerManage;
