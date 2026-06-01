import classNames from 'classnames';
import React from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const GreetingHeader: React.FC = () => {
  const { userInfo } = useModel('userInfo');

  const nickname = userInfo?.nickname || userInfo?.userName || '--';

  return (
    <div className={cx(styles['greeting-header-container'])}>
      <h1 className={cx(styles['greeting-title'])}>
        嗨，{nickname}，给我一个任务，现在开始？
      </h1>
    </div>
  );
};

export default GreetingHeader;
