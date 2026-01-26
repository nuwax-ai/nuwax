import { ModelSaveParams } from '@/types/interfaces/model';
import type { Page, RequestResponse } from '@/types/interfaces/request';
import type {
  AddSystemUserParams,
  ModelConfigDto,
  NotifyMessageSendParams,
  PublishedDto,
  SystemAgentListParams,
  SystemAgentPage,
  SystemDataTableListParams,
  SystemDataTablePage,
  SystemKnowledgeListParams,
  SystemKnowledgePage,
  SystemMcpListParams,
  SystemMcpPage,
  SystemPluginListParams,
  SystemPluginPage,
  SystemSkillListParams,
  SystemSkillPage,
  SystemSpaceListParams,
  SystemSpacePage,
  SystemUserConfig,
  SystemUserListInfo,
  SystemUserListParams,
  SystemWebappListParams,
  SystemWebappPage,
  SystemWorkflowListParams,
  SystemWorkflowPage,
  TenantConfigDto,
  UpdateSystemUserParams,
  UploadResultDto,
} from '@/types/interfaces/systemManage';
import { request } from 'umi';

// 查询用户列表
export async function apiSystemUserList(
  data: SystemUserListParams,
): Promise<RequestResponse<Page<SystemUserListInfo>>> {
  return request('/api/system/user/list', {
    method: 'POST',
    data,
  });
}

// 新增用户
export async function apiAddSystemUser(
  data: AddSystemUserParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/user/add', {
    method: 'POST',
    data,
  });
}

// 更新用户
export async function apiUpdateSystemUser(
  data: UpdateSystemUserParams,
): Promise<RequestResponse<null>> {
  return request(`/api/system/user/updateById/${data.id}`, {
    method: 'POST',
    data,
  });
}

// 启用用户
export async function apiEnableSystemUser(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/user/enable/${data.id}`, {
    method: 'POST',
    data,
  });
}

// 启用用户
export async function apiDisableSystemUser(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/user/disable/${data.id}`, {
    method: 'POST',
    data,
  });
}

// 查询用户列表
// 查询系统设置列表
export async function apiSystemConfigList(): Promise<
  RequestResponse<SystemUserConfig[]>
> {
  return request('/api/system/config/list', {
    method: 'POST',
  });
}
// 查询模型列表
export async function apiSystemModelList(): Promise<
  RequestResponse<ModelConfigDto[]>
> {
  return request('/api/system/model/list', {
    method: 'GET',
  });
}
// 添加或更新模型配置接口
export async function apiSystemModelSave(
  data: ModelSaveParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/model/save', {
    method: 'POST',
    data,
  });
}
// 删除全局模型
export async function apiSystemModelDelete(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/model/${data.id}/delete`, {
    method: 'GET',
  });
}
// 查询可选模型列表
export async function apiUseableModelList(): Promise<
  RequestResponse<ModelConfigDto[]>
> {
  return request('/api/model/list', {
    method: 'POST',
    data: {},
  });
}
// 查询可选择的智能体列表
export async function apiSystemAgentList(
  kw: string,
): Promise<RequestResponse<PublishedDto[]>> {
  return request('/api/system/publish/agent/list', {
    method: 'POST',
    data: { kw },
  });
}
// 上传文件
export async function apiSystemUploadFile(
  file: File,
): Promise<RequestResponse<UploadResultDto>> {
  const formData = new FormData();
  formData.append('file', file);
  return request('/api/file/upload', {
    method: 'POST',
    data: formData,
  });
}
// 更新配置信息
export async function apiSystemConfigUpdate(
  data: TenantConfigDto,
): Promise<RequestResponse<any>> {
  return request('/api/system/config/add', {
    method: 'POST',
    data,
  });
}

// 发送通知消息
export async function apiSystemNotifyMessageSend(
  data: NotifyMessageSendParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/user/notify/message/send', {
    method: 'POST',
    data,
  });
}

// 查询工作空间列表
export async function apiSystemResourceSpaceList(
  data: SystemSpaceListParams,
): Promise<RequestResponse<SystemSpacePage>> {
  return request('/api/system/resource/space/list', {
    method: 'POST',
    data,
  });
}

// 删除工作空间
export async function apiSystemResourceSpaceDelete(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/resource/space/delete/${data.id}`, {
    method: 'DELETE',
  });
}

// 查询智能体列表
export async function apiSystemResourceAgentList(
  data: SystemAgentListParams,
): Promise<RequestResponse<SystemAgentPage>> {
  return request('/api/system/resource/agent/list', {
    method: 'POST',
    data,
  });
}

// 删除智能体
export async function apiSystemResourceAgentDelete(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/resource/agent/delete/${data.id}`, {
    method: 'DELETE',
  });
}

// 查询网页应用列表
export async function apiSystemResourceWebappList(
  data: SystemWebappListParams,
): Promise<RequestResponse<SystemWebappPage>> {
  return request('/api/system/resource/page/list', {
    method: 'POST',
    data,
  });
}

// 删除网页应用
export async function apiSystemResourceWebappDelete(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/resource/page/delete/${data.id}`, {
    method: 'DELETE',
  });
}

// 查询知识库列表
export async function apiSystemResourceKnowledgeList(
  data: SystemKnowledgeListParams,
): Promise<RequestResponse<SystemKnowledgePage>> {
  return request('/api/system/resource/knowledge/list', {
    method: 'POST',
    data,
  });
}

// 删除知识库
export async function apiSystemResourceKnowledgeDelete(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/resource/knowledge/delete/${data.id}`, {
    method: 'DELETE',
  });
}

// 查询数据表列表
export async function apiSystemResourceDataTableList(
  data: SystemDataTableListParams,
): Promise<RequestResponse<SystemDataTablePage>> {
  return request('/api/system/resource/table/list', {
    method: 'POST',
    data,
  });
}

// 删除数据表
export async function apiSystemResourceDataTableDelete(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/resource/table/delete/${data.id}`, {
    method: 'DELETE',
  });
}

// 查询工作流列表
export async function apiSystemResourceWorkflowList(
  data: SystemWorkflowListParams,
): Promise<RequestResponse<SystemWorkflowPage>> {
  return request('/api/system/resource/workflow/list', {
    method: 'POST',
    data,
  });
}

// 删除工作流
export async function apiSystemResourceWorkflowDelete(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/resource/workflow/delete/${data.id}`, {
    method: 'DELETE',
  });
}

// 查询插件列表
export async function apiSystemResourcePluginList(
  data: SystemPluginListParams,
): Promise<RequestResponse<SystemPluginPage>> {
  return request('/api/system/resource/plugin/list', {
    method: 'POST',
    data,
  });
}

// 删除插件
export async function apiSystemResourcePluginDelete(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/resource/plugin/delete/${data.id}`, {
    method: 'DELETE',
  });
}

/**
 * 查询 MCP 列表
 */
export async function apiSystemResourceMcpList(
  data: SystemMcpListParams,
): Promise<RequestResponse<SystemMcpPage>> {
  return request('/api/system/resource/mcp/list', {
    method: 'POST',
    data,
  });
}

/**
 * 删除 MCP
 */
export async function apiSystemResourceMcpDelete(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/resource/mcp/delete/${data.id}`, {
    method: 'DELETE',
  });
}

/**
 * 查询技能列表
 */
export async function apiSystemResourceSkillList(
  data: SystemSkillListParams,
): Promise<RequestResponse<SystemSkillPage>> {
  return request('/api/system/resource/skill/list', {
    method: 'POST',
    data,
  });
}

/**
 * 删除技能
 */
export async function apiSystemResourceSkillDelete(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/resource/skill/delete/${data.id}`, {
    method: 'DELETE',
  });
}
