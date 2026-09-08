import ConditionRender from '@/components/ConditionRender';
import { isImmersiveShell } from '@/utils/nuwaClawBridge';
import classNames from 'classnames';
import React from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const Header: React.FC = () => {
  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  // 桌面端沉浸式：隐藏 logo（红绿灯避让由一级菜单 padding-top 下移 + nuwaclaw 工具栏承载）
  if (isImmersiveShell()) return null;

  return (
    <ConditionRender condition={!!tenantConfigInfo?.siteLogo}>
      <div className={cx(styles['logo-container'])}>
        <img
          src={tenantConfigInfo?.siteLogo}
          className={cx(styles.logo)}
          alt=""
        />
      </div>
    </ConditionRender>
  );
};

export default Header;
