import Loading from '@/components/Loading';
import { SPACE_ID } from '@/constants/home.constants';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { history, useModel } from 'umi';

const Space: React.FC = () => {
  const { currentSpaceInfo, loadingSpaceList } = useModel('spaceModel');

  useEffect(() => {
    const spaceId = localStorage.getItem(SPACE_ID) ?? currentSpaceInfo?.id;
    history.push(`/space/${spaceId}/develop`);
  }, [currentSpaceInfo]);

  return loadingSpaceList && <Loading className={classNames('h-full')} />;
};

export default Space;
