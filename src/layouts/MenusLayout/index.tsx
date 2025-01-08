import { TabsEnum, UserOperatorAreaEnum } from '@/types/enums/menus';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useModel } from 'umi';
import Header from './Header';
import HomeSection from './HomeSection';
import styles from './index.less';
import SpaceSection from './SpaceSection';
import SquareSection from './SquareSection';
import Tabs from './Tabs';
import User from './User';
import UserOperateArea from './UserOperateArea';

const cx = classNames.bind(styles);

/**
 * 菜单布局组件
 */
const MenusLayout: React.FC = () => {
  const { setOpenHistoryModal, setOpenMessage } = useModel('layout');
  const [tabType, setTabType] = useState<TabsEnum>(TabsEnum.Home);
  // 切换tab
  const handleTabsClick = (type: TabsEnum) => {
    setTabType(type);
  };

  useEffect(() => {
    switch (tabType) {
      case TabsEnum.Home:
        history.push('/home');
        break;
      case TabsEnum.Space:
        history.push('/space');
        break;
      case TabsEnum.Square:
        history.push('/square');
        break;
    }
  }, [tabType]);

  // 用户区域操作
  const handleUserClick = (type: UserOperatorAreaEnum) => {
    console.log(type);
    switch (type) {
      case UserOperatorAreaEnum.Document:
        // todo 打开文档链接
        break;
      // 会话记录
      case UserOperatorAreaEnum.History_Conversation:
        setOpenHistoryModal(true);
        break;
      case UserOperatorAreaEnum.Message:
        setOpenMessage(true);
        break;
    }
  };

  const Content: React.FC = () => {
    switch (tabType) {
      case TabsEnum.Home:
        return <HomeSection />;
      case TabsEnum.Space:
        return <SpaceSection />;
      case TabsEnum.Square:
        return <SquareSection />;
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
        <Content />
      </div>
    </div>
  );
};

export default MenusLayout;
