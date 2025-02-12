import { USER_INFO } from '@/constants/home.constants';
import { apiUserInfo } from '@/services/account';
import type { UserInfo } from '@/types/interfaces/login';
import { useRequest } from 'umi';

const useUserInfo = () => {
  // 查询当前登录用户信息
  const { run: runUserInfo } = useRequest(apiUserInfo, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: UserInfo) => {
      localStorage.setItem(USER_INFO, JSON.stringify(result));
    },
  });

  return {
    runUserInfo,
  };
};

export default useUserInfo;
