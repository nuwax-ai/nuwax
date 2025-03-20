import { USER_INFO } from '@/constants/home.constants';
import { apiUserInfo } from '@/services/account';
import type { UserInfo } from '@/types/interfaces/login';
import { useState } from 'react';
import { useRequest } from 'umi';

export default () => {
  const [userInfo, setUserInfo] = useState<UserInfo>();

  // 查询当前登录用户信息
  const { run: runUserInfo } = useRequest(apiUserInfo, {
    manual: true,
    debounceInterval: 500,
    onSuccess: (result: UserInfo) => {
      setUserInfo(result);
      localStorage.setItem(USER_INFO, JSON.stringify(result));
    },
  });

  return {
    userInfo,
    setUserInfo,
    runUserInfo,
  };
};
