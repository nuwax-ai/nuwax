import type { MenuItemDto } from '@/types/interfaces/menu';
import React, { useEffect } from 'react';
import { history, useModel } from 'umi';
import { OpenTypeEnum } from '../SystemManagement/MenuPermission/types/menu-manage';

/*
  根据菜单树重定向到第一个有 path的菜单或它第一个有 path 的子菜单
*/
const Index: React.FC = () => {
  const { firstLevelMenus } = useModel('menuModel');

  /**
   * 递归查找第一个有 path 的子菜单
   * @param menu 菜单项
   * @returns 第一个有 path 的菜单项，如果没有则返回 null
   */
  const findFirstChildWithPath = (menu: MenuItemDto): MenuItemDto | null => {
    // 如果当前菜单有 path，直接返回
    if (menu.path) {
      return menu;
    }

    // 如果没有子菜单，返回 null
    if (!menu.children?.length) {
      return null;
    }

    // 获取第一个子菜单
    const firstChild = menu.children[0];

    // 递归查找第一个子菜单的 path
    return findFirstChildWithPath(firstChild);
  };

  /**
   * 打开URL
   * @param path 路径
   * @param openType 打开方式，默认应用内打开
   */
  const handleOpenUrl = (
    path: string,
    openType: OpenTypeEnum = OpenTypeEnum.CurrentTab,
  ) => {
    if (openType === OpenTypeEnum.NewTab) {
      window.open(path, '_blank');
      return;
    }
    history.push(`/open-iframe-page?url=${encodeURIComponent(path)}`);
  };

  const handleMenuPath = (currentMenu: MenuItemDto) => {
    // 如果第一个菜单有 path，直接跳转
    if (currentMenu.path) {
      // http开头的路径，直接打开
      if (currentMenu.path.includes('http')) {
        handleOpenUrl(currentMenu.path, currentMenu?.openType);
      } else {
        // 其他路径，跳转路由
        history.replace(currentMenu.path);
      }
      return;
    }

    // 如果第一个菜单没有 path，递归查找第一个子菜单的 path
    const firstPathMenu = findFirstChildWithPath(currentMenu);
    if (firstPathMenu?.path) {
      // http开头的路径，直接打开
      if (firstPathMenu.path.includes('http')) {
        handleOpenUrl(firstPathMenu.path, firstPathMenu?.openType);
      } else {
        // 其他路径，跳转路由
        history.replace(firstPathMenu.path);
      }
    } else {
      console.log('第一级菜单以及其子菜单都没有设置path路径');
    }
  };

  useEffect(() => {
    if (firstLevelMenus.length > 0) {
      const firstLevelMenu = firstLevelMenus[0];

      // 新对话,特殊处理，因为新对话时，不能选中新对话的菜单，需要跳转到下一个菜单
      if (firstLevelMenu.code === 'new_conversation') {
        // 只有当存在第二项时，才执行跳转逻辑
        if (firstLevelMenus.length > 1 && firstLevelMenus[1]) {
          handleMenuPath(firstLevelMenus[1]);
        }
        return;
      }

      handleMenuPath(firstLevelMenu);
    }
  }, [firstLevelMenus]);

  return null;
};

export default Index;
