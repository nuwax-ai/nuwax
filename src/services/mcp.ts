import {
  McpCreateParams,
  McpDetailInfo,
  McpTestParams,
  McpTestResult,
  McpUpdateParams,
} from '@/types/interfaces/mcp';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// MCP服务更新
export function apiMcpUpdate(
  data: McpUpdateParams,
): Promise<RequestResponse<McpDetailInfo>> {
  return request('/api/mcp/update', {
    method: 'POST',
    data,
  });
}

// MCP试运行
export function apiMcpTryRun(
  data: McpTestParams,
): Promise<RequestResponse<McpTestResult>> {
  return request('/api/mcp/test', {
    method: 'POST',
    data,
  });
}

// MCP停用
export function apiMcpStop(id: number): Promise<RequestResponse<null>> {
  return request(`/api/mcp/stop/${id}`, {
    method: 'POST',
  });
}

// MCP服务重新生成配置
export function apiMcpServerConfigRefresh(
  id: number,
): Promise<RequestResponse<string>> {
  return request(`/api/mcp/server/config/refresh/${id}`, {
    method: 'POST',
  });
}

// MCP服务导出
export function apiMcpServerConfigExport(
  id: number,
): Promise<RequestResponse<string>> {
  return request(`/api/mcp/server/config/export/${id}`, {
    method: 'POST',
  });
}

// MCP删除
export function apiMcpDelete(id: number): Promise<RequestResponse<null>> {
  return request(`/api/mcp/delete/${id}`, {
    method: 'POST',
  });
}

// MCP服务创建
export function apiMcpCreate(
  data: McpCreateParams,
): Promise<RequestResponse<McpDetailInfo>> {
  return request('/api/mcp/create', {
    method: 'POST',
    data,
  });
}

// MCP详情查询
export function apiMcpDetail(
  id: number,
): Promise<RequestResponse<McpDetailInfo>> {
  return request(`/api/mcp/${id}`, {
    method: 'GET',
  });
}

// MCP列表（官方服务）
export function apiMcpOfficialList(): Promise<
  RequestResponse<McpDetailInfo[]>
> {
  return request('/api/mcp/official/list', {
    method: 'GET',
  });
}

// MCP管理列表
export function apiMcpList(
  spaceId: number,
): Promise<RequestResponse<McpDetailInfo[]>> {
  return request(`/api/mcp/list/${spaceId}`, {
    method: 'GET',
  });
}

// MCP已发布服务列表（弹框使用）
export function apiMcpDeployedList(
  spaceId: number,
): Promise<RequestResponse<McpDetailInfo[]>> {
  return request(`/api/mcp/deployed/list/${spaceId}`, {
    method: 'GET',
  });
}
