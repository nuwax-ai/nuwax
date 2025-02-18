import type { RequestResponse } from '@/types/interfaces/request';
import type { PluginTestParams, PluginTestResult } from '@/types/interfaces/plugin';
import { request } from 'umi';

// 插件试运行接口
export async function apiPluginTest(
  data: PluginTestParams,
): Promise<RequestResponse<PluginTestResult>> {
  return request('/api/plugin/test', {
    method: 'POST',
    data,
  });
}