import {
  ConversationChatResponse,
  ConversationInfo,
} from '@/types/interfaces/conversationInfo';
import { RequestResponse } from '@/types/interfaces/request';
import {
  AgentTempChatDto,
  TempChatCompletionsParams,
  TempConversationCreateDto,
  TempConversationQueryDto,
} from '@/types/interfaces/tempChat';
import { request } from 'umi';

// 删除智能体临时会话链接接口
export function apiTempChatDel(
  id: number,
  agentId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/temp/chat/${agentId}/link/${id}/delete`, {
    method: 'POST',
  });
}

// 新增智能体临时会话链接接口
export function apiTempChatCreate(
  agentId: number,
): Promise<RequestResponse<AgentTempChatDto>> {
  return request(`/api/temp/chat/${agentId}/link/create`, {
    method: 'POST',
  });
}

// 修改智能体临时会话链接接口
export function apiTempChatUpdate(
  data: AgentTempChatDto,
): Promise<RequestResponse<null>> {
  return request('/api/temp/chat/link/update', {
    method: 'POST',
    data,
  });
}

// 查询临时会话详细
export function apiTempChatConversationQuery(
  data: TempConversationQueryDto,
): Promise<RequestResponse<ConversationInfo>> {
  return request('/api/temp/chat/conversation/query', {
    method: 'POST',
    data,
  });
}

// 创建临时会话
export function apiTempChatConversationCreate(
  data: TempConversationCreateDto,
): Promise<RequestResponse<ConversationInfo>> {
  return request('/api/temp/chat/conversation/create', {
    method: 'POST',
    data,
  });
}

// 临时消息会话
export function apiTempChatCompletions(
  data: TempChatCompletionsParams,
): Promise<RequestResponse<ConversationChatResponse>> {
  return request('/api/temp/chat/completions', {
    method: 'POST',
    data,
  });
}

// 查询智能体临时会话链接接口
export function apiTempChatList(
  agentId: number,
): Promise<RequestResponse<ConversationChatResponse[]>> {
  return request(`/api/temp/chat/${agentId}/link/list`, {
    method: 'GET',
  });
}
