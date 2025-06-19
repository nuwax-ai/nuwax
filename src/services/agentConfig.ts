import type {
  AgentAddParams,
  AgentCardInfo,
  AgentComponentAddParams,
  AgentComponentInfo,
  AgentComponentKnowledgeUpdateParams,
  AgentComponentMcpUpdateParams,
  AgentComponentModelUpdateParams,
  AgentComponentPluginUpdateParams,
  AgentComponentTableUpdateParams,
  AgentComponentTriggerAddParams,
  AgentComponentTriggerUpdateParams,
  AgentComponentVariableUpdateParams,
  AgentComponentWorkflowUpdateParams,
  AgentConfigHistoryInfo,
  AgentConfigInfo,
  AgentConfigUpdateParams,
  AgentConversationUpdateParams,
  AgentPublishApplyParams,
  TriggerTimeZone,
} from '@/types/interfaces/agent';
import type {
  ConversationChatSuggestParams,
  ConversationCreateParams,
  ConversationInfo,
  ConversationListParams,
} from '@/types/interfaces/conversationInfo';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 智能体迁移接口
export function apiAgentTransfer(
  agentId: number,
  targetSpaceId: number,
): Promise<RequestResponse<null>> {
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
  agentId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/agent/delete/${agentId}`, {
    method: 'POST',
  });
}

// 复制到空间接口
export async function apiAgentCopyToSpace(
  agentId: number,
  targetSpaceId: number,
): Promise<RequestResponse<number>> {
  return request(`/api/agent/copy/${agentId}/${targetSpaceId}`, {
    method: 'POST',
  });
}

// 更新智能体基础配置信息
export async function apiAgentConfigUpdate(
  data: AgentConfigUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/config/update', {
    method: 'POST',
    data,
  });
}

// 更新工作流组件配置
export async function apiAgentComponentWorkflowUpdate(
  data: AgentComponentWorkflowUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/component/workflow/update', {
    method: 'POST',
    data,
  });
}

// 更新数据表组件配置
export async function apiAgentComponentTableUpdate(
  data: AgentComponentTableUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/component/table/update', {
    method: 'POST',
    data,
  });
}

// 更新变量配置
export async function apiAgentComponentVariableUpdate(
  data: AgentComponentVariableUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/component/variable/update', {
    method: 'POST',
    data,
  });
}

// 更新触发器组件配置
export async function apiAgentComponentTriggerUpdate(
  data: AgentComponentTriggerUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/component/trigger/update', {
    method: 'POST',
    data,
  });
}

// 新增智能体触发器配置
export async function apiAgentComponentTriggerAdd(
  data: AgentComponentTriggerAddParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/component/trigger/add', {
    method: 'POST',
    data,
  });
}

// 更新插件组件配置
export async function apiAgentComponentPluginUpdate(
  data: AgentComponentPluginUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/component/plugin/update', {
    method: 'POST',
    data,
  });
}

// 更新MCP组件配置
export async function apiAgentComponentMcpUpdate(
  data: AgentComponentMcpUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/component/mcp/update', {
    method: 'POST',
    data,
  });
}

// 更新模型组件配置
export async function apiAgentComponentModelUpdate(
  data: AgentComponentModelUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/component/model/update', {
    method: 'POST',
    data,
  });
}

// 更新知识库组件配置
export async function apiAgentComponentKnowledgeUpdate(
  data: AgentComponentKnowledgeUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/component/knowledge/update', {
    method: 'POST',
    data,
  });
}

// 删除智能体组件配置
export async function apiAgentComponentDelete(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/agent/component/delete/${id}`, {
    method: 'POST',
  });
}

// 新增智能体插件、工作流、知识库组件配置
export async function apiAgentComponentAdd(
  data: AgentComponentAddParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/component/add', {
    method: 'POST',
    data,
  });
}

// 新增智能体接口
export async function apiAgentAdd(
  data: AgentAddParams,
): Promise<RequestResponse<number>> {
  return request('/api/agent/add', {
    method: 'POST',
    data,
  });
}

// 查询智能体配置信息
export async function apiAgentConfigInfo(
  agentId: number,
): Promise<RequestResponse<AgentConfigInfo>> {
  return request(`/api/agent/${agentId}`, {
    method: 'GET',
  });
}

// 触发器定时任务时区数据
export async function apiAgentTriggerTimeZone(): Promise<
  RequestResponse<TriggerTimeZone>
> {
  return request('/api/agent/trigger/timeZone/data', {
    method: 'GET',
  });
}

// 查询空间智能体列表接口
export async function apiAgentConfigList(
  spaceId: number,
): Promise<RequestResponse<AgentConfigInfo[]>> {
  return request(`/api/agent/list/${spaceId}`, {
    method: 'GET',
  });
}

// 查询智能体历史配置信息接口
export async function apiAgentConfigHistoryList(
  agentId: number,
): Promise<RequestResponse<AgentConfigHistoryInfo[]>> {
  return request(`/api/agent/config/history/list/${agentId}`, {
    method: 'GET',
  });
}

// 查询智能体配置组件列表
export async function apiAgentComponentList(
  agentId: number,
): Promise<RequestResponse<AgentComponentInfo[]>> {
  return request(`/api/agent/component/list/${agentId}`, {
    method: 'GET',
  });
}

// 查询卡片列表
export async function apiAgentCardList(): Promise<
  RequestResponse<AgentCardInfo[]>
> {
  return request('/api/agent/card/list', {
    method: 'GET',
  });
}

// 查询会话
export async function apiAgentConversation(
  conversationId: number,
): Promise<RequestResponse<ConversationInfo>> {
  return await request(`/api/agent/conversation/${conversationId}`, {
    method: 'POST',
  });
}

// 根据用户消息更新会话主题
export async function apiAgentConversationUpdate(
  data: AgentConversationUpdateParams,
): Promise<RequestResponse<ConversationInfo>> {
  return request('/api/agent/conversation/update', {
    method: 'POST',
    data,
  });
}

// 查询用户历史会话
export async function apiAgentConversationList(
  data: ConversationListParams,
): Promise<RequestResponse<ConversationInfo[]>> {
  return request('/api/agent/conversation/list', {
    method: 'POST',
    data,
  });
}

// 删除会话
export async function apiAgentConversationDelete(
  conversationId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/agent/conversation/delete/${conversationId}`, {
    method: 'POST',
  });
}

// 创建会话
export async function apiAgentConversationCreate(
  data: ConversationCreateParams,
): Promise<RequestResponse<ConversationInfo>> {
  return request('/api/agent/conversation/create', {
    method: 'POST',
    data,
  });
}

// 智能体会话问题建议
export async function apiAgentConversationChatSuggest(
  data: ConversationChatSuggestParams,
): Promise<RequestResponse<string[]>> {
  return request('/api/agent/conversation/chat/suggest', {
    method: 'POST',
    data,
  });
}
