import Loading from '@/components/custom/Loading';
import { SPACE_ID, SPACE_URL } from '@/constants/home.constants';
import { RoleEnum } from '@/types/enums/common';
import { AllowDevelopEnum } from '@/types/enums/space';
import React, { useEffect } from 'react';
import { history, useModel } from 'umi';

const Space: React.FC = () => {
  const { currentSpaceInfo, loadingSpaceList, asyncSpaceListFun } =
    useModel('spaceModel');

  useEffect(() => {
    asyncSpaceListFun();
  }, []);

  // 1. 增加“开发者功能”【tips：关闭后，用户将无法看见“智能体开发”和“组件库”，创建者和管理员不受影响】
  // 2. 增加“接受来自外部空间的发布”，【tips：打开后，拥有该空间权限的用户在其他空间完成开发的智能体、插件、工作流，可以发布到该空间的广场上】
  // 开发者功能如果关闭，首次进入空间菜单选中“空间广场”；管理员还是全部可见

  useEffect(() => {
    const spaceId = localStorage.getItem(SPACE_ID) ?? currentSpaceInfo?.id;
    if (!spaceId) {
      return;
    }
    // 普通用户开发者功能如果关闭，首次进入空间菜单选中“空间广场”；
    const defaultUrl =
      currentSpaceInfo?.currentUserRole === RoleEnum.User &&
      currentSpaceInfo?.allowDevelop === AllowDevelopEnum.Not_Allow
        ? 'space-square'
        : 'develop';
    const spaceUrl = localStorage.getItem(SPACE_URL) ?? defaultUrl;
    history.push(`/space/${spaceId}/${spaceUrl}`);
  }, [currentSpaceInfo]);

  return loadingSpaceList && <Loading className="h-full" />;
};

export default Space;
