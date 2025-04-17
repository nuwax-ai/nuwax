import Loading from '@/components/Loading';
import { SPACE_ID, SPACE_URL } from '@/constants/home.constants';
import React, { useEffect } from 'react';
import { history, useModel } from 'umi';

const Space: React.FC = () => {
  const { currentSpaceInfo, loadingSpaceList } = useModel('spaceModel');

  useEffect(() => {
    const spaceId = localStorage.getItem(SPACE_ID) ?? currentSpaceInfo?.id;
    const spaceUrl = localStorage.getItem(SPACE_URL) ?? 'develop';
    history.push(`/space/${spaceId}/${spaceUrl}`);
  }, [currentSpaceInfo]);

  return loadingSpaceList && <Loading className="h-full" />;
};

export default Space;
