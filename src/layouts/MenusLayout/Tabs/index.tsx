import { TABS } from '@/constants/menus.constants';
import TabItem from '@/layouts/MenusLayout/Tabs/TabItem';
import { TabsEnum } from '@/types/enums/menus';
import type { TabsType } from '@/types/interfaces/layouts';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { useLocation, useModel } from 'umi';

const Tabs: React.FC<TabsType> = ({ onClick }) => {
  const location = useLocation();
  const { userInfo, refreshUserInfo } = useModel('userInfo');
  const { handleShowHoverMenu, handleHideHoverMenu, isSecondMenuCollapsed } =
    useModel('layout');

  useEffect(() => {
    // 获取用户信息
    refreshUserInfo();
  }, []);

  const handleActive = (type: TabsEnum) => {
    const isActive =
      (type === TabsEnum.Home &&
        (location.pathname === '/' ||
          location.pathname.includes('home') ||
          location.pathname.includes('agent'))) ||
      (type === TabsEnum.Space && location.pathname.includes('/space/')) ||
      (type === TabsEnum.Square && location.pathname.includes('/square')) ||
      (type === TabsEnum.Ecosystem_Market &&
        location.pathname.includes('/ecosystem/')) ||
      (type === TabsEnum.System_Manage &&
        location.pathname.includes('/system/'));
    return isActive;
  };

  return (
    <div className={classNames('flex-1', 'overflow-y', 'w-full')}>
      {TABS.map((item, index) => {
        const isAdminRole = userInfo?.role === 'Admin';
        // 管理员
        if (item.type === TabsEnum.System_Manage && !isAdminRole) {
          return null;
        }
        // 非管理员不能访问生态市场
        if (item.type === TabsEnum.Ecosystem_Market && !isAdminRole) {
          return null;
        }

        return (
          <TabItem
            key={index}
            {...item}
            onClick={() => onClick(item.type)}
            active={handleActive(item.type)}
            onMouseEnter={() => {
              if (item.type !== TabsEnum.NewChat) {
                handleShowHoverMenu(item.type);
              }
            }}
            onMouseLeave={handleHideHoverMenu}
            isSecondMenuCollapsed={isSecondMenuCollapsed}
          />
        );
      })}
    </div>
  );
};

export default Tabs;
