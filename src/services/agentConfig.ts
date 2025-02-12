import {
  AgentAddParams,
  AgentComponentInfo,
  AgentComponentModelUpdateParams,
  AgentConfigHistoryInfo,
  AgentConfigInfo,
  AgentConfigUpdateParams,
  AgentCopyParams,
  AgentDeleteParams,
  AgentPublishApplyParams,
  AgentTransferParams,
} from '@/types/interfaces/agent';
import { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 新增智能体接口
export async function apiAgentAdd(
  body: AgentAddParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/add', {
    method: 'POST',
    data: body,
  });
}

// 智能体迁移接口
export async function apiAgentTransfer(
  data: AgentTransferParams,
): Promise<RequestResponse<null>> {
  const { agentId, targetSpaceId } = data;
  return request(`/api/agent/transfer/${agentId}/space/${targetSpaceId}`, {
    method: 'POST',
  });
}

// 智能体发布申请
export async function apiAgentPublishApply(
  data: AgentPublishApplyParams,
): Promise<RequestResponse<null>> {
  const { agentId, ...body } = data;
  return request(`/api/agent/publish/apply/${agentId}`, {
    method: 'POST',
    data: body,
  });
}

// 删除智能体接口
export async function apiAgentDelete(
  data: AgentDeleteParams,
): Promise<RequestResponse<null>> {
  const { agentId } = data;
  return request(`/api/agent/delete/${agentId}`, {
    method: 'POST',
  });
}

// 创建副本接口
export async function apiAgentCopy(
  data: AgentCopyParams,
): Promise<RequestResponse<null>> {
  const { agentId } = data;
  return request(`/api/agent/copy/${agentId}`, {
    method: 'POST',
  });
}

// 更新智能体基础配置信息
export async function apiAgentConfigUpdate(
  body: AgentConfigUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/config/update', {
    method: 'POST',
    data: body,
  });
}

// 更新模型组件配置
export async function apiAgentComponentModelUpdate(
  body: AgentComponentModelUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/component/model/update', {
    method: 'POST',
    data: body,
  });
}

// 删除智能体组件配置
export async function apiAgentComponentDelete(
  id: string,
): Promise<RequestResponse<null>> {
  return request(`/api/agent/component/delete/${id}`, {
    method: 'POST',
  });
}

// 查询智能体配置信息
export async function apiAgentConfigInfo(
  agentId: string,
): Promise<RequestResponse<AgentConfigInfo>> {
  return request(`/api/agent/${agentId}`, {
    method: 'GET',
  });
}

// 查询空间智能体列表接口
export async function apiAgentConfigList(
  spaceId: string,
): Promise<RequestResponse<AgentConfigInfo[]>> {
  return request(`/api/agent/list/${spaceId}`, {
    method: 'GET',
  });
}

// 查询智能体历史配置信息接口
export async function apiAgentConfigHistoryList(
  agentId: string,
): Promise<RequestResponse<AgentConfigHistoryInfo[]>> {
  return request(`/api/agent/config/history/list/${agentId}`, {
    method: 'GET',
  });
}

// 查询智能体配置组件列表
export async function apiAgentComponentList(
  agentId: string,
): Promise<RequestResponse<AgentComponentInfo[]>> {
  return request(`/api/agent/component/list/${agentId}`, {
    method: 'GET',
  });
}

// 查询卡片列表
export async function apiAgentCardList(): Promise<RequestResponse<null>> {
  return request('/api/agent/card/list', {
    method: 'GET',
  });
}
