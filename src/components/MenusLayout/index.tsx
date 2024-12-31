import HomeSection from '@/components/MenusLayout/HomeSection';
import { TabsEnum, UserOperatorAreaEnum } from '@/types/enums/menus';
import classNames from 'classnames';
import React, { useState } from 'react';
import Header from './Header';
import styles from './index.less';
import Tabs from './Tabs';
import User from './User';
import UserOperateArea from './UserOperateArea';

const cx = classNames.bind(styles);

const MenusLayout: React.FC = () => {
  const [tabType, setTabType] = useState<TabsEnum>(TabsEnum.Home);
  // 切换tab
  const handleTabsClick = (type: TabsEnum) => {
    // todo
    console.log(type);
    setTabType(type);
  };

  // 用户区域操作
  const handleUserClick = (type: UserOperatorAreaEnum) => {
    console.log(type);
  };

  return (
    <div className={cx(styles.container, 'flex')}>
      <div
        className={cx(
          styles['first-menus'],
          'flex',
          'flex-col',
          'items-center',
          'px-6',
          'py-16',
        )}
      >
        <Header />
        <Tabs onClick={handleTabsClick} />
        <UserOperateArea onClick={handleUserClick} />
        <User />
      </div>
      <div className={cx(styles['nav-menus'])}>
        {tabType === TabsEnum.Home ? <HomeSection /> : null}
      </div>
    </div>
  );
};

export default MenusLayout;
