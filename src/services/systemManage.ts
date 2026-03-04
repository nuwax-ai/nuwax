import { CategoryTypeEnum } from '@/types/enums/agent';
import { AccessControlEnum } from '@/types/enums/systemManage';
import { TaskCronInfo } from '@/types/interfaces/agentTask';
import { UpdateTimedTaskParams } from '@/types/interfaces/library';
import { ModelSaveParams } from '@/types/interfaces/model';
import type { Page, RequestResponse } from '@/types/interfaces/request';
import type {
  AccessStatsResult,
  AddSystemUserParams,
  ConversationStatsResult,
  ModelConfigDto,
  NotifyMessageSendParams,
  PublishedDto,
  SandboxConfigItem,
  SandboxGlobalConfig,
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
  SystemTaskListParams,
  SystemTaskPage,
  SystemUserConfig,
  SystemUserListInfo,
  SystemUserListParams,
  SystemWebappListParams,
  SystemWebappPage,
  SystemWorkflowListParams,
  SystemWorkflowPage,
  TenantConfigDto,
  TotalStatsResult,
  UpdateSystemUserParams,
  UploadResultDto,
  UserSandBoxSelectDto,
  UserStatsResult,
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
export async function apiSystemModelList(
  accessControl?: AccessControlEnum,
): Promise<RequestResponse<ModelConfigDto[]>> {
  return request('/api/system/model/list', {
    method: 'GET',
    params: {
      accessControl,
    },
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
// 开启/关闭模型管控
export async function apiSystemModelAccessControl(
  modelId: number,
  status: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/model/${modelId}/accessControl/${status}`, {
    method: 'POST',
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
  return request('/api/system/config/update-theme', {
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
    method: 'POST',
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
    method: 'POST',
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
    method: 'POST',
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
    method: 'POST',
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
    method: 'POST',
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
    method: 'POST',
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
    method: 'POST',
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
    method: 'POST',
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
    method: 'POST',
  });
}

/**
 * 查询访问统计数据
 */
export async function apiGetAccessStats(): Promise<
  RequestResponse<AccessStatsResult>
> {
  return request('/api/system/request/stats', {
    method: 'GET',
  });
}

/**
 * 查询用户统计数据
 */
export async function apiGetUserStats(): Promise<
  RequestResponse<UserStatsResult>
> {
  return request('/api/system/user/stats', {
    method: 'GET',
  });
}

/**
 * 获取资源概览统计数据
 */
export async function apiGetTotalStats(): Promise<
  RequestResponse<TotalStatsResult>
> {
  return request('/api/system/stats/resources/total', {
    method: 'GET',
  });
}

/**
 * 获取会话统计数据
 */
export async function apiGetConversationStats(): Promise<
  RequestResponse<ConversationStatsResult>
> {
  return request('/api/system/stats/conversations', {
    method: 'GET',
  });
}

/**
 * 查询任务列表
 */
export async function apiSystemTaskList(
  data: SystemTaskListParams,
): Promise<RequestResponse<SystemTaskPage>> {
  return request('/api/system/task/list', {
    method: 'POST',
    data,
  });
}
/**
 * 更新任务
 */
export async function apiSystemTaskUpdate(
  data: UpdateTimedTaskParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/task/update', {
    method: 'POST',
    data,
  });
}

/**
 * 手动执行任务
 */
export async function apiSystemTaskExecute(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/task/execute/${id}`, {
    method: 'POST',
  });
}
/**
 * 启用任务
 */
export async function apiSystemTaskEnable(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/task/enable/${id}`, {
    method: 'POST',
  });
}

/**
 * 停用任务
 */
export async function apiSystemTaskCancel(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/task/cancel/${id}`, {
    method: 'POST',
  });
}
/**
 * 删除任务
 */
export async function apiSystemTaskDelete(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/task/delete/${id}`, {
    method: 'POST',
  });
}

/**
 * 可选定时范围 - 系统任务
 */
export async function apiSystemTaskCronList(): Promise<
  RequestResponse<TaskCronInfo[]>
> {
  return request('/api/system/task/cron/list', {
    method: 'GET',
  });
}

/**
 * 查询沙盒全局配置
 */
export async function apiGetSandboxGlobalConfig(): Promise<
  RequestResponse<SandboxGlobalConfig>
> {
  return request('/api/system/sandbox/config/global', {
    method: 'POST',
  });
}

/**
 * 更新沙盒全局配置
 */
export async function apiUpdateSandboxGlobalConfig(
  data: SandboxGlobalConfig,
): Promise<RequestResponse<null>> {
  return request('/api/system/sandbox/config/global/update', {
    method: 'POST',
    data,
  });
}
/**
 * 查询沙盒列表
 */
export async function apiGetSandboxConfigList(): Promise<
  RequestResponse<SandboxConfigItem[]>
> {
  return request('/api/system/sandbox/config/global/list', {
    method: 'GET',
  });
}

/**
 * 创建沙盒配置
 */
export async function apiCreateSandboxConfig(
  data: Partial<SandboxConfigItem>,
): Promise<RequestResponse<null>> {
  return request('/api/system/sandbox/config/create', {
    method: 'POST',
    data,
  });
}

/**
 * 更新沙盒配置
 */
export async function apiUpdateSandboxConfig(
  data: Partial<SandboxConfigItem>,
): Promise<RequestResponse<null>> {
  return request('/api/system/sandbox/config/update', {
    method: 'POST',
    data,
  });
}

/**
 * 删除沙盒配置
 */
export async function apiDeleteSandboxConfig(
  id: number | string,
): Promise<RequestResponse<null>> {
  return request(`/api/system/sandbox/config/delete/${id}`, {
    method: 'POST',
  });
}
/**
 * 查询用户沙盒列表
 */
export async function apiGetSandboxUserConfigList(): Promise<
  RequestResponse<SandboxConfigItem[]>
> {
  return request('/api/sandbox/config/list', {
    method: 'GET',
  });
}
/**
 * 启用/禁用沙盒配置
 */
export async function apiToggleSandboxConfig(
  id: number | string,
): Promise<RequestResponse<null>> {
  return request(`/api/sandbox/config/toggle/${id}`, {
    method: 'POST',
  });
}
/**
 * 启用/停用沙盒配置（系统管理）
 */
export async function apiToggleSystemSandboxConfig(
  id: number | string,
): Promise<RequestResponse<null>> {
  return request(`/api/system/sandbox/config/toggle/${id}`, {
    method: 'POST',
  });
}
/**
 * 删除用户沙盒配置
 */
export async function apiDeleteSandboxUserConfig(
  id: number | string,
): Promise<RequestResponse<null>> {
  return request(`/api/sandbox/config/delete/${id}`, {
    method: 'POST',
  });
}
/**
 * 更新用户沙盒配置
 */
export async function apiUpdateSandboxUserConfig(data: {
  id: number;
  name: string;
  description?: string;
}): Promise<RequestResponse<null>> {
  return request('/api/sandbox/config/update', {
    method: 'POST',
    data,
  });
}

/**
 * 查询用户可选择的沙盒配置列表（用于电脑选择器）
 * 返回可选沙盒列表及各智能体的已选沙盒信息
 */
export async function apiGetUserSelectableSandboxList(): Promise<
  RequestResponse<UserSandBoxSelectDto>
> {
  return request('/api/sandbox/config/select/list', {
    method: 'GET',
  });
}

/**
 * 保存用户对某个智能体的沙盒选择
 * @param agentId 智能体ID
 * @param sandboxId 选择的沙盒配置ID，空字符串或'remote'表示选择远程电脑
 */
export async function apiSaveSelectedSandbox(
  agentId: number,
  sandboxId: string,
): Promise<RequestResponse<null>> {
  return request(`/api/sandbox/config/selected/${agentId}/${sandboxId}`, {
    method: 'POST',
  });
}

/**
 * 查询分类列表
 */
export async function apiSystemCategoryList(params: {
  type: CategoryTypeEnum;
}): Promise<RequestResponse<any[]>> {
  return request('/api/system/category/list', {
    method: 'GET',
    params,
  });
}

/**
 * 创建分类
 */
export async function apiSystemCategoryCreate(data: {
  name: string;
  code: string;
  description: string;
  type: CategoryTypeEnum | string;
}): Promise<RequestResponse<any>> {
  return request('/api/system/category/create', {
    method: 'POST',
    data,
  });
}

/**
 * 更新分类
 */
export async function apiSystemCategoryUpdate(data: {
  id: string | number;
  name: string;
  code: string;
  description: string;
  type: CategoryTypeEnum | string;
}): Promise<RequestResponse<null>> {
  return request('/api/system/category/update', {
    method: 'POST',
    data,
  });
}

/**
 * 删除分类
 */
export async function apiSystemCategoryDelete(data: {
  id: string | number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/category/delete/${data.id}`, {
    method: 'POST',
  });
}
/**
 * 沙盒连通性测试
 */
export async function apiTestSandboxConnectivity(
  id: number | string,
): Promise<RequestResponse<null>> {
  return request(`/api/system/sandbox/config/test/${id}`, {
    method: 'GET',
  });
}
