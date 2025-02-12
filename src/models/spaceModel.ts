import { SPACE_ID } from '@/constants/home.constants';
import { apiSpaceList } from '@/services/workspace';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { useState } from 'react';
import { useRequest } from 'umi';

function Space() {
  const [spaceList, setSpaceList] = useState<SpaceInfo[]>([]);

  // 查询用户空间列表
  const { run: runSpace } = useRequest(apiSpaceList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: SpaceInfo[]) => {
      const spaceId = localStorage.getItem(SPACE_ID);
      if (!spaceId) {
        const _spaceId = result?.[0]?.id as string;
        localStorage.setItem(SPACE_ID, _spaceId);
      }
      setSpaceList(result || []);
    },
  });

  return {
    spaceList,
    runSpace,
    setSpaceList,
  };
}

export default Space;
