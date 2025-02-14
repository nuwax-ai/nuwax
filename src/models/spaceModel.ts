import { SPACE_ID } from '@/constants/home.constants';
import { apiSpaceList } from '@/services/workspace';
import { SpaceTypeEnum } from '@/types/enums/space';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { useState } from 'react';
import { useRequest } from 'umi';

function Space() {
  const [spaceList, setSpaceList] = useState<SpaceInfo[]>([]);
  const [currentSpaceInfo, setCurrentSpaceInfo] = useState<SpaceInfo>();

  // 查询用户空间列表
  const { run: runSpace } = useRequest(apiSpaceList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: SpaceInfo[]) => {
      const spaceId = localStorage.getItem(SPACE_ID);
      // 首次进入时
      if (!spaceId) {
        const defaultSpace = result?.find(
          (item) => item.type === SpaceTypeEnum.Personal,
        );
        setCurrentSpaceInfo(defaultSpace);
        // 保存spaceId
        const _spaceId =
          (defaultSpace?.id as string) || (result?.[0]?.id as string);
        localStorage.setItem(SPACE_ID, _spaceId);
      } else {
        // 刷新页面
        const _currentSpaceInfo = result?.find(
          (item) => item.id.toString() === spaceId,
        );
        setCurrentSpaceInfo(_currentSpaceInfo);
      }
      setSpaceList(result || []);
    },
  });

  return {
    spaceList,
    setSpaceList,
    runSpace,
    currentSpaceInfo,
    setCurrentSpaceInfo,
  };
}

export default Space;
