import { TabsEnum, UserOperatorAreaEnum } from '@/types/enums/menus';
import { useModel } from '@umijs/max';
import classNames from 'classnames';
import React, { useState } from 'react';
import Header from './Header';
import HomeSection from './HomeSection';
import styles from './index.less';
import Tabs from './Tabs';
import User from './User';
import UserOperateArea from './UserOperateArea';

const cx = classNames.bind(styles);

/**
 * 菜单布局组件
 */
const MenusLayout: React.FC = () => {
  const { setOpenHistoryModal } = useModel('layout');
  const [tabType, setTabType] = useState<TabsEnum>(TabsEnum.Home);
  const [loading, setLoading] = useState<boolean>(false);
  // 切换tab
  const handleTabsClick = (type: TabsEnum) => {
    // todo
    console.log(type);
    setTabType(type);
  };

  // 用户区域操作
  const handleUserClick = (type: UserOperatorAreaEnum) => {
    console.log(type);
    // 会话记录
    if (type === UserOperatorAreaEnum.History_Conversation) {
      setOpenHistoryModal(true);
    }
  };

  return (
    <div className={cx(styles.container, 'flex')}>
      {/*一级导航菜单栏*/}
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
      {/*二级导航菜单栏*/}
      <div className={cx(styles['nav-menus'])}>
        {tabType === TabsEnum.Home ? <HomeSection /> : null}
      </div>
    </div>
  );
};

export default MenusLayout;
