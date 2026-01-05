import { useCallback } from 'react';
import { useSearchParams } from 'umi';

// 浏览器地址栏参数改变钩子
const useSearchParamsCustom = <T extends string>() => {
  // ✅ umi 中的 useSearchParams
  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ 当 select 改变时同步 URL
  const setSearchParamsCustom = useCallback(
    (key: T, value: string) => {
      // 更新 URL 参数
      const newParams = new URLSearchParams(searchParams);
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
      setSearchParams(newParams);
    },
    [searchParams],
  );

  return {
    setSearchParamsCustom,
    searchParams,
  };
};

export default useSearchParamsCustom;
