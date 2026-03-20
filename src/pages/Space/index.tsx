import Loading from '@/components/custom/Loading';
import { PATH_URL } from '@/constants/home.constants';
import { updatePathUrlToLocalStorage } from '@/layouts/DynamicMenusLayout/utils';
import { RoleEnum } from '@/types/enums/common';
import { AllowDevelopEnum } from '@/types/enums/space';
import { MenuItemDto } from '@/types/interfaces/menu';
import { SpaceInfo } from '@/types/interfaces/workspace';
import React, { useEffect } from 'react';
import { history, useModel } from 'umi';

const Space: React.FC = () => {
  const {
    currentSpaceInfo,
    loadingSpaceList,
    asyncSpaceListFun,
    getSpaceId,
    spaceList,
  } = useModel('spaceModel');

  const { getSecondLevelMenus } = useModel('menuModel');

  useEffect(() => {
    asyncSpaceListFun();
  }, []);

  // 1. 增加“开发者功能”【tips：关闭后，用户将无法看见“智能体开发”和“组件库”，创建者和管理员不受影响】
  // 2. 增加“接受来自外部空间的发布”，【tips：打开后，拥有该空间权限的用户在其他空间完成开发的智能体、插件、工作流，可以发布到该空间的广场上】
  // 开发者功能如果关闭，首次进入空间菜单选中“空间广场”；管理员还是全部可见

  useEffect(() => {
    // 当前空间id
    const spaceId = getSpaceId();
    if (!spaceId) {
      return;
    }
    const secondMenus = getSecondLevelMenus('workspace');

    try {
      // 从缓存中获取当前路径，如果存在且匹配当前菜单，则直接跳转
      const pathUrl = localStorage.getItem(PATH_URL);
      if (pathUrl) {
        const pathUrlObj = JSON.parse(pathUrl);
        let pathUrlValue = pathUrlObj['workspace'];
        if (
          pathUrlValue &&
          !pathUrlValue.includes(':') &&
          pathUrlValue.includes('/space')
        ) {
          // 如果pathUrlValue中包含spaceId，则替换为spaceList中的spaceId
          // pathUrlValue：/space/42/develop
          // 提取pathSpaceId：42
          const pathSpaceId = pathUrlValue.split('/').filter(Boolean)[1];
          if (pathSpaceId) {
            const spaceInfo = spaceList?.find(
              (item: SpaceInfo) => item.id === Number(pathSpaceId),
            );
            // 如果pathSpaceId不存在于spaceList中，则替换为当前空间id
            if (!spaceInfo) {
              pathUrlValue = pathUrlValue.replace(pathSpaceId, spaceId);

              // 更新缓存
              updatePathUrlToLocalStorage('workspace', pathUrlValue);
            }
          }
          history.push(pathUrlValue);
          return;
        }
      }
    } catch {}

    // 普通用户开发者功能如果关闭，首次进入空间菜单选中“空间广场”；
    const defaultUrl =
      currentSpaceInfo?.currentUserRole === RoleEnum.User &&
      currentSpaceInfo?.allowDevelop === AllowDevelopEnum.Not_Allow
        ? 'space-square'
        : 'develop';

    // 从菜单 path 中提取最后一级路径段，例如 /space/:spaceId/develop -> develop
    const getLastSegment = (path?: string) => {
      if (!path) return '';
      const cleanPath = path.split('?')[0];
      const segments = cleanPath.split('/').filter(Boolean);
      return segments[segments.length - 1] || '';
    };

    // 判断当前 defaultUrl 是否在二级菜单 path 中存在
    const hasSpaceUrlInMenus = secondMenus?.some(
      (menu: MenuItemDto) => getLastSegment(menu.path) === defaultUrl,
    );

    let finalUrl = defaultUrl;

    if (!hasSpaceUrlInMenus && secondMenus && secondMenus.length > 0) {
      // 如果当前 defaultUrl 不在菜单里，则使用第一项菜单 path 的最后一级作为跳转路径
      finalUrl = getLastSegment(secondMenus[0].path) || defaultUrl;
    }

    history.push(`/space/${spaceId}/${finalUrl}`);
  }, [currentSpaceInfo]);

  return loadingSpaceList && <Loading className="h-full" />;
};

export default Space;
