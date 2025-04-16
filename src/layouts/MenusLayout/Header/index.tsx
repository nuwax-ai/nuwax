import ConditionRender from '@/components/ConditionRender';
import { TENANT_CONFIG_INFO } from '@/constants/home.constants';
import { ICON_NEW_AGENT } from '@/constants/images.constants';
import useConversation from '@/hooks/useConversation';
import type { TenantConfigInfo } from '@/types/interfaces/login';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const Header: React.FC = () => {
  // 配置信息
  const [configInfo, setConfigInfo] = useState<TenantConfigInfo>();
  // 创建智能体会话
  const { handleCreateConversation } = useConversation();

  useEffect(() => {
    // 配置信息
    const info = localStorage.getItem(TENANT_CONFIG_INFO);
    setConfigInfo(JSON.parse(info));
  }, []);

  const handlerClick = async () => {
    if (configInfo) {
      // 创建智能体会话
      await handleCreateConversation(configInfo.defaultAgentId);
    }
  };
  return (
    <>
      <ConditionRender condition={!!configInfo?.siteLogo}>
        <img src={configInfo?.siteLogo} className={cx(styles.logo)} alt="" />
      </ConditionRender>
      <span
        className={cx(
          styles['add-agent'],
          'flex',
          'content-center',
          'items-center',
          'cursor-pointer',
          'hover-deep',
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
