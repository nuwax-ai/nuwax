import logo from '@/assets/images/logo.png';
import { TENANT_CONFIG_INFO } from '@/constants/home.constants';
import { ICON_NEW_AGENT } from '@/constants/images.constants';
import type { TenantConfigInfo } from '@/types/interfaces/login';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';
import { history, useRequest } from '@@/exports';
import { apiAgentConversationCreate } from '@/services/agentConfig';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';

const cx = classNames.bind(styles);

const Header: React.FC = () => {
  // 配置信息
  const [configInfo, setConfigInfo] = useState<TenantConfigInfo>();

  useEffect(() => {
    // 配置信息
    const info = localStorage.getItem(TENANT_CONFIG_INFO);
    setConfigInfo(JSON.parse(info));
  }, []);


  // 创建会话
  const { run: runConversationCreate } = useRequest(
    apiAgentConversationCreate,
    {
      manual: true,
      debounceWait: 300,
      onSuccess: (result: ConversationInfo) => {
        history.push(`/home/chat/${result.id}`);
      },
    },
  );

  const handlerClick = () => {
    // 配置信息
    const info = JSON.parse(
      localStorage.getItem(TENANT_CONFIG_INFO),
    ) as TenantConfigInfo;

    runConversationCreate({
      agentId: info?.defaultAgentId,
      devMode: false,
    });
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
