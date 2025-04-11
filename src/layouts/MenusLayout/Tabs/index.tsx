import { TABS } from '@/constants/menus.constants';
import TabItem from '@/layouts/MenusLayout/Tabs/TabItem';
import { RoleEnum } from '@/types/enums/common';
import { TabsEnum } from '@/types/enums/menus';
import type { TabsType } from '@/types/interfaces/layouts';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { useLocation, useModel } from 'umi';

const Tabs: React.FC<TabsType> = ({ onClick }) => {
  const location = useLocation();
  const { userInfo, runUserInfo } = useModel('userInfo');

  useEffect(() => {
    // 获取用户信息
    runUserInfo();
  }, []);

  const handleActive = (type) => {
    return (
      (type === TabsEnum.Home &&
        (location.pathname === '/' || location.pathname.includes('home'))) ||
      (type === TabsEnum.Space && location.pathname.includes('space')) ||
      (type === TabsEnum.Square && location.pathname.includes('square')) ||
      (type === TabsEnum.System_Manage && location.pathname.includes('system'))
    );
  };

  return (
    <div className={classNames('flex-1', 'overflow-y', 'w-full')}>
      {TABS.map((item, index) => {
        // 管理员
        if (
          item.type === TabsEnum.System_Manage &&
          userInfo?.role !== RoleEnum.Admin
        ) {
          return null;
        }
        return (
          <TabItem
            key={index}
            {...item}
            onClick={() => onClick(item.type)}
            active={handleActive(item.type)}
          />
        );
      })}
    </div>
  );
};

export default Tabs;
