/**
 * 团队空间 ID hook
 * @description 团队空间主 tab 的数据维度：拉取空间列表，
 * 优先取团队空间（type=Team），无团队空间时回退首个空间
 */

import { apiSpaceList } from '@/services/workspace';
import { SpaceTypeEnum } from '@/types/enums/space';
import { useEffect, useState } from 'react';

const useTeamSpaceId = () => {
  const [spaceId, setSpaceId] = useState<number | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    apiSpaceList()
      .then((res) => {
        if (cancelled) {
          return;
        }
        const list = res?.data || [];
        if (list.length === 0) {
          return;
        }
        const teamSpace =
          list.find((item) => item.type === SpaceTypeEnum.Team) || list[0];
        setSpaceId(teamSpace?.id);
      })
      .catch(() => {
        // 拉取失败时保持 undefined，团队空间列表显示加载态
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return spaceId;
};

export default useTeamSpaceId;
