import ConditionRender from '@/components/ConditionRender';
import classNames from 'classnames';
import React from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const Header: React.FC = () => {
  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  return (
    <>
      <ConditionRender condition={!!tenantConfigInfo?.siteLogo}>
        <div className={cx(styles['logo-container'])}>
          <img
            src={tenantConfigInfo?.siteLogo}
            className={cx(styles.logo)}
            alt=""
          />
        </div>
      </ConditionRender>
    </>
  );
};

export default Header;
