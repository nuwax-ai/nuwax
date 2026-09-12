import type { AgentInterventionRespondRequest } from '@/components/business-component/AgentIntervention';
import type { RcoderNotifyResolvedRequest } from '@/types/interfaces/acpPermission';
import {
  AgentAddParams,
  AgentAddResult,
  AgentCardInfo,
  AgentComponentAddParams,
  AgentComponentEventUpdateParams,
  AgentComponentHookUpdateParams,
  AgentComponentInfo,
  AgentComponentKnowledgeUpdateParams,
  AgentComponentMcpUpdateParams,
  AgentComponentModelUpdateParams,
  AgentComponentPluginUpdateParams,
  AgentComponentSkillUpdateParams,
  AgentComponentSubAgentUpdateParams,
  AgentComponentTableUpdateParams,
  AgentComponentVariableUpdateParams,
  AgentComponentWorkflowUpdateParams,
  AgentConfigHistoryInfo,
  AgentConfigInfo,
  AgentConfigUpdateParams,
  AgentConversationShareParams,
  AgentConversationUpdateParams,
  AgentPageUpdateParams,
  AgentPublishApplyParams,
  ApiAgentConversationChatPageResultParams,
  ConversationMessageListParams,
  ModelOptionDto,
} from '@/types/interfaces/agent';
import { BindConfigWithSub } from '@/types/interfaces/common';
import type {
  ConversationChatSuggestParams,
  ConversationCreateParams,
  ConversationInfo,
  ConversationListParams,
  MessageInfo,
  ShareFileInfo,
} from '@/types/interfaces/conversationInfo';
import type { RequestResponse } from '@/types/interfaces/request';
import { isConversationMockPage } from '@/utils/isConversationMockPage';
import { request } from 'umi';

/** 开发验收页（含 /app/mock-chat）的会话接口走同源 Umi mock，不受全局远端 baseURL 影响。 */
const conversationApiUrl = (path: string) =>
  isConversationMockPage() ? `${window.location.origin}${path}` : path;

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

// 更新智能体页面配置
export async function apiAgentPageUpdate(
  data: AgentPageUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/component/page/update', {
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

// 更新Hook配置
export async function apiAgentComponentHookUpdate(
  data: AgentComponentHookUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/component/hook/update', {
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

// 更新技能组件配置
export async function apiAgentComponentSkillUpdate(
  data: AgentComponentSkillUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/component/skill/update', {
    method: 'POST',
    data,
  });
}

// 更新组件子智能体配置
export async function apiAgentComponentSubAgentUpdate(
  data: AgentComponentSubAgentUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/component/subagent/update', {
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
): Promise<RequestResponse<AgentAddResult>> {
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

// 查询智能体变量列表
export async function apiAgentVariables(
  agentId: number,
): Promise<RequestResponse<BindConfigWithSub[]>> {
  return request(`/api/agent/variable/list/${agentId}`, {
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
  return await request(
    conversationApiUrl(`/api/agent/conversation/${conversationId}`),
    { method: 'POST' },
  );
}

// 查询会话消息列表
export async function apiAgentConversationMessageList(
  data: ConversationMessageListParams,
): Promise<RequestResponse<MessageInfo[]>> {
  return await request(
    conversationApiUrl('/api/agent/conversation/message/list'),
    {
      method: 'POST',
      data,
    },
  );
}

// 停止会话
export async function apiAgentConversationChatStop(
  requestId: string,
): Promise<RequestResponse<null>> {
  return request(
    conversationApiUrl(`/api/agent/conversation/chat/stop/${requestId}`),
    {
      method: 'POST',
    },
  );
}

// ACP 权限审批结果回调
export function apiResolveAcpPermission(
  data: RcoderNotifyResolvedRequest,
): Promise<RequestResponse<any> | Record<string, any>> {
  return request(conversationApiUrl('/api/computer/notify-resolved'), {
    method: 'POST',
    data,
  });
}

export function apiAgentInterventionRespond(
  data: AgentInterventionRespondRequest,
): Promise<RequestResponse<unknown>> {
  const permissionRequest = data.permission_resolve_request;
  const selected = permissionRequest?.request_permission_response.outcome
    ? 'Selected' in permissionRequest.request_permission_response.outcome
      ? permissionRequest.request_permission_response.outcome.Selected
      : null
    : null;
  const fallbackOptionId =
    permissionRequest?.request_permission_response.outcome &&
    'Cancelled' in permissionRequest.request_permission_response.outcome
      ? 'reject'
      : undefined;

  return request(
    conversationApiUrl(
      '/api/agent/conversation/chat/permission-request/response',
    ),
    {
      method: 'POST',
      // 审批结果提交的错误由 respondAcpPermission 自行处理（卡片关闭 + 友好 toast），
      // 跳过全局 errorHandler 以避免与后端原始 message（如 "permission request not
      // found or already resolved"）重复弹窗。
      skipErrorHandler: true,
      data: {
        conversationId: data.conversation_id,
        toolId: permissionRequest?.tool_call_id,
        option: {
          optionId: selected?.option_id || fallbackOptionId,
          outcome: selected ? 'selected' : 'cancelled',
        },
      },
    },
  );
}

// 停止临时会话
export async function apiTempChatConversationStop(
  requestId: string,
): Promise<RequestResponse<null>> {
  return request(`/api/temp/chat/conversation/${requestId}`, {
    method: 'POST',
  });
}

// 根据用户消息更新会话主题
export async function apiAgentConversationUpdate(
  data: AgentConversationUpdateParams,
): Promise<RequestResponse<ConversationInfo>> {
  return request(conversationApiUrl('/api/agent/conversation/update'), {
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
    // 归档过滤（all/exclude/only）。旧调用点缺省按 exclude 兜底，
    // 保持「默认不含已归档」的历史行为；需要归档视图的列表显式传 all/only。
    data: { ...data, archivedFilter: data.archivedFilter ?? 'exclude' },
  });
}

/** 会话置顶/取消置顶（pinned 必传；裸请求后端会默认设为 true） */
export async function apiAgentConversationPin(
  conversationId: number,
  pinned: boolean,
): Promise<RequestResponse<ConversationInfo>> {
  return request(`/api/agent/conversation/pin/${conversationId}`, {
    method: 'POST',
    params: { pinned },
  });
}

/** 会话归档/取消归档（archived 必传；裸请求后端会默认设为 true） */
export async function apiAgentConversationArchive(
  conversationId: number,
  archived: boolean,
): Promise<RequestResponse<ConversationInfo>> {
  return request(`/api/agent/conversation/archive/${conversationId}`, {
    method: 'POST',
    params: { archived },
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
  return request(conversationApiUrl('/api/agent/conversation/chat/suggest'), {
    method: 'POST',
    data,
  });
}

// 更新事件绑定配置
export async function apiAgentComponentEventUpdate(
  data: AgentComponentEventUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/component/event/update', {
    method: 'POST',
    data,
  });
}

// 页面请求结果回写
export async function apiAgentComponentPageResultUpdate(
  data: ApiAgentConversationChatPageResultParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/conversation/chat/page/result', {
    method: 'POST',
    data,
  });
}

// 获取桌面分享详情
export async function apiAgentConversationShare(
  data: AgentConversationShareParams,
): Promise<RequestResponse<ShareFileInfo>> {
  return request('/api/agent/conversation/share', {
    method: 'POST',
    data,
  });
}

/**
 * 会话/消息分享(markdown 产物,需求 5c)。
 * TODO(后端):真实分享接口支持会话/消息 type 后,切回
 * /api/agent/conversation/share(参数带 messageId/组装好的 markdown),
 * 删除 mock 层 conversationShareMd 三个端点即可,弹窗与落地页链路不变。
 */
export async function apiConversationShareMd(data: {
  conversationId: number | string;
  kind: 'MESSAGE' | 'CONVERSATION';
  title: string;
  markdown: string;
  expireSeconds?: number | null;
  allowDownload?: boolean;
}): Promise<RequestResponse<{ shareKey: string }>> {
  return request('/api/agent/conversation/share-md', {
    method: 'POST',
    data,
  });
}

/**
 * 智能体会话可选模型列表
 * @param agentId 智能体ID
 */
export async function apiAgentConversationModelOptions(
  agentId: number,
): Promise<RequestResponse<ModelOptionDto[]>> {
  return request(`/api/agent/conversation/model/options/${agentId}`, {
    method: 'GET',
  });
}
