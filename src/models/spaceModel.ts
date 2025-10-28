import { SUCCESS_CODE } from '@/constants/codes.constants';
import { SPACE_ID } from '@/constants/home.constants';
import { apiSpaceList } from '@/services/workspace';
import { SpaceTypeEnum } from '@/types/enums/space';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { useRequest } from 'ahooks';
import { useCallback, useState } from 'react';

function Space() {
  const [spaceList, setSpaceList] = useState<SpaceInfo[]>([]);
  const [currentSpaceInfo, setCurrentSpaceInfo] = useState<SpaceInfo>();
  const [loadingSpaceList, setLoadingSpaceList] = useState<boolean>(false);

  // 设置个人空间为当前空间
  const setPersonalSpaceInfo = useCallback((list: SpaceInfo[]) => {
    const defaultSpace = list?.find(
      (item) => item.type === SpaceTypeEnum.Personal,
    );
    setCurrentSpaceInfo(defaultSpace);
    // 保存spaceId
    const id = defaultSpace?.id || list?.[0]?.id;
    localStorage.setItem(SPACE_ID, String(id));
  }, []);

  // 设置当前工作空间
  const handleCurrentSpaceInfo = useCallback(
    (list: SpaceInfo[], spaceId: number) => {
      // 如果用户直接修改空间ID或者粘贴url在浏览器中，刷新页面浏览时
      const spaceInfo = list?.find((item) => item.id === spaceId);
      // 空间列表中存在此id的空间
      if (!!spaceInfo) {
        localStorage.setItem(SPACE_ID, spaceId.toString());
        setCurrentSpaceInfo(spaceInfo);
      } else {
        // 不存在时，设置个人空间为当前空间
        setPersonalSpaceInfo(list);
      }
    },
    [],
  );

  // 查询用户空间列表
  const { runAsync: runSpace } = useRequest(apiSpaceList, {
    manual: true,
    debounceWait: 300,
  });

  // 加载空间列表
  const asyncSpaceListFun = async () => {
    setLoadingSpaceList(true);
    // 查询空间列表
    const { code, data } = await runSpace();
    if (code === SUCCESS_CODE) {
      setSpaceList(data || []);
      // 设置个人空间为当前空间
      setPersonalSpaceInfo(data || []);
    }
    setLoadingSpaceList(false);
  };

  const getSpaceId = useCallback(() => {
    return localStorage.getItem(SPACE_ID) ?? currentSpaceInfo?.id;
  }, [currentSpaceInfo]);

  return {
    getSpaceId,
    spaceList,
    setSpaceList,
    runSpace,
    loadingSpaceList,
    setLoadingSpaceList,
    handleCurrentSpaceInfo,
    currentSpaceInfo,
    setCurrentSpaceInfo,
    asyncSpaceListFun,
  };
}

export default Space;
