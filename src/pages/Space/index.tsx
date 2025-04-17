import { SPACE_ID } from '@/constants/home.constants';
import { LoadingOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { history, useModel } from 'umi';

const Space: React.FC = () => {
  const { currentSpaceInfo, loadingSpaceList } = useModel('spaceModel');

  useEffect(() => {
    const spaceId = localStorage.getItem(SPACE_ID) ?? currentSpaceInfo?.id;
    history.push(`/space/${spaceId}/develop`);
  }, [currentSpaceInfo]);

  return (
    loadingSpaceList && (
      <div
        className={classNames(
          'h-full',
          'flex',
          'items-center',
          'content-center',
        )}
      >
        <LoadingOutlined />
      </div>
    )
  );
};

export default Space;
