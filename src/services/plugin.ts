import { BindConfigWithSub } from '@/types/interfaces/agent';
import type {
  PluginAddParams,
  PluginCopyUpdateParams,
  PluginHttpUpdateParams,
  PluginInfo,
  PluginPublishParams,
  PluginTestParams,
  PluginTestResult,
} from '@/types/interfaces/plugin';
import { PluginAnalysisOutputParams } from '@/types/interfaces/plugin';
import type { RequestResponse } from '@/types/interfaces/request';
import type { HistoryData } from '@/types/interfaces/space';
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

// 插件发布
export async function apiPluginPublish(
  data: PluginPublishParams,
): Promise<RequestResponse<null>> {
  return request('/api/plugin/publish', {
    method: 'POST',
    data,
  });
}

// 更新HTTP插件配置接口
export async function apiPluginHttpUpdate(
  data: PluginHttpUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/plugin/http/update', {
    method: 'POST',
    data,
  });
}

// 删除插件接口
export async function apiPluginDelete(
  pluginId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/plugin/delete/${pluginId}`, {
    method: 'POST',
  });
}

// 创建副本接口
export async function apiPluginCopy(
  pluginId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/plugin/copy/${pluginId}`, {
    method: 'POST',
  });
}

// 更新代码插件配置接口
export async function apiPluginCodeUpdate(
  data: PluginCopyUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/plugin/code/update', {
    method: 'POST',
    data,
  });
}

// 自动解析插件出参
export async function apiPluginAnalysisOutput(
  data: PluginAnalysisOutputParams,
): Promise<RequestResponse<BindConfigWithSub[]>> {
  return request('/api/plugin/analysis/output', {
    method: 'POST',
    data,
  });
}

// 新增插件接口
export async function apiPluginAdd(
  data: PluginAddParams,
): Promise<RequestResponse<null>> {
  return request('/api/plugin/add', {
    method: 'POST',
    data,
  });
}

// 查询插件信息
export async function apiPluginInfo(
  pluginId: number,
): Promise<RequestResponse<PluginInfo>> {
  return request(`/api/plugin/${pluginId}`, {
    method: 'GET',
  });
}

// 查询插件历史配置信息接口
export async function apiPluginConfigHistoryList(
  pluginId: number,
): Promise<RequestResponse<HistoryData[]>> {
  return request(`/api/plugin/config/history/list/${pluginId}`, {
    method: 'GET',
  });
}
