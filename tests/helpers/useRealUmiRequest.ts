import { createRequire } from 'node:module';
import { dirname } from 'node:path';

// 使用当前 Umi 随装的真实依赖与生成 wrapper 相同的 formatResult，避免 mock 轮询生命周期。
const require = createRequire(import.meta.url);
const entry = require.resolve('@ahooksjs/use-request', {
  paths: [dirname(require.resolve('@umijs/max'))],
});
const useRequest = require(entry).default;

export function useRealUmiRequest(
  service: (...args: any[]) => Promise<any>,
  options: any,
) {
  return useRequest(service, {
    formatResult: (result: any) => result?.data,
    ...options,
  });
}
