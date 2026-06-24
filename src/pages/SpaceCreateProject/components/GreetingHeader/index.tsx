import { dict } from '@/services/i18nRuntime';
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
        {dict('PC.Pages.SpaceCreateProject.greetingTitle', nickname)}
      </h1>
    </div>
  );
};

export default GreetingHeader;
