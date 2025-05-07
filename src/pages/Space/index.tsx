import Loading from '@/components/Loading';
import { SPACE_ID, SPACE_URL } from '@/constants/home.constants';
import React, { useEffect } from 'react';
import { history, useModel } from 'umi';

const Space: React.FC = () => {
  const { currentSpaceInfo, loadingSpaceList, asyncSpaceListFun } =
    useModel('spaceModel');

  useEffect(() => {
    asyncSpaceListFun();
  }, []);

  useEffect(() => {
    const spaceId = localStorage.getItem(SPACE_ID) ?? currentSpaceInfo?.id;
    if (!spaceId) {
      return;
    }
    const spaceUrl = localStorage.getItem(SPACE_URL) ?? 'develop';
    history.push(`/space/${spaceId}/${spaceUrl}`);
  }, [currentSpaceInfo]);

  return loadingSpaceList && <Loading className="h-full" />;
};

export default Space;
