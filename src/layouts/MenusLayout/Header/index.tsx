import logo from '@/assets/images/logo.png';
import { TENANT_CONFIG_INFO } from '@/constants/home.constants';
import { ICON_NEW_AGENT } from '@/constants/images.constants';
import type { TenantConfigInfo } from '@/types/interfaces/login';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const Header: React.FC = () => {
  // 配置信息
  const [configInfo, setConfigInfo] = useState<TenantConfigInfo>();

  useEffect(() => {
    // 配置信息
    const info = localStorage.getItem(TENANT_CONFIG_INFO);
    setConfigInfo(JSON.parse(info));
  }, []);

  const handlerClick = () => {
    console.log('header link');
  };
  return (
    <>
      <img
        src={configInfo?.siteLogo || (logo as string)}
        className={cx(styles.logo)}
        alt=""
      />
      <span
        className={cx(
          styles['add-agent'],
          'flex',
          'content-center',
          'items-center',
          'cursor-pointer',
          'hover-box',
        )}
        onClick={handlerClick}
      >
        <ICON_NEW_AGENT />
      </span>
      <div className={cx(styles['divider-horizontal'])} />
    </>
  );
};

export default Header;
