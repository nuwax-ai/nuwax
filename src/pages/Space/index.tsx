import Loading from '@/components/Loading';
import { SPACE_ID, SPACE_URL } from '@/constants/home.constants';
import { AllowDevelopEnum } from '@/types/enums/space';
import React, { useEffect } from 'react';
import { history, useModel } from 'umi';

const Space: React.FC = () => {
  const { currentSpaceInfo, loadingSpaceList, asyncSpaceListFun } =
    useModel('spaceModel');
  const { userInfo } = useModel('userInfo');

  useEffect(() => {
    asyncSpaceListFun();
  }, []);

  useEffect(() => {
    const spaceId = localStorage.getItem(SPACE_ID) ?? currentSpaceInfo?.id;
    if (!spaceId) {
      return;
    }
    // 开发者功能如果关闭，首次进入空间菜单选中“空间广场”；
    const defaultUrl =
      userInfo?.allowDevelop === AllowDevelopEnum.Not_Allow
        ? 'space-square'
        : 'develop';
    const spaceUrl = localStorage.getItem(SPACE_URL) ?? defaultUrl;
    history.push(`/space/${spaceId}/${spaceUrl}`);
  }, [currentSpaceInfo]);

  return loadingSpaceList && <Loading className="h-full" />;
};

export default Space;
