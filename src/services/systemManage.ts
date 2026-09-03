import { CategoryTypeEnum } from '@/types/enums/agent';
import { AccessControlEnum } from '@/types/enums/systemManage';
import { TaskCronInfo } from '@/types/interfaces/agentTask';
import { UpdateTimedTaskParams } from '@/types/interfaces/library';
import { ModelSaveParams } from '@/types/interfaces/model';
import type {
  Page,
  PageNum,
  RequestResponse,
} from '@/types/interfaces/request';
import type {
  AccessStatsResult,
  AddSystemUserParams,
  ApplyConnectorImportParams,
  ConnectorBindableItem,
  ConnectorBindableParams,
  ConnectorImportDiff,
  ConnectorProviderDetail,
  ConnectorProviderInfo,
  ConnectorProviderListParams,
  ConnectorProviderPageParams,
  ConnectorProviderPageResult,
  ConnectorRuntimeExecuteParams,
  ConnectorRuntimeExecuteResult,
  ConversationStatsResult,
  CreateConnectorActionParams,
  CreateConnectorProviderParams,
  DeleteConnectorActionParams,
  ExportConnectorProvidersParams,
  ModelConfigDto,
  NotifyMessageSendParams,
  PayConfigResult,
  PayConnectivityResult,
  PublishedDto,
  ResourceStatDetailParams,
  ResourceStatDTO,
  ResourceStatSummaryDTO,
  SandboxConfigItem,
  SandboxGlobalConfig,
  SaveConnectorOauthConfigParams,
  SaveConnectorOrderParams,
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
  SystemRevenueDetailInfo,
  SystemRevenueDetailParams,
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
  TenantSubscriptionConfigInfo,
  ToggleConnectorActionStatusParams,
  ToggleConnectorProviderStatusParams,
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

// 删除用户
export async function apiDeleteSystemUser(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/user/delete/${data.id}`, {
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

// 更新模型排序
export async function apiSystemModelSortUpdate(
  data: {
    id: number;
    sort: number;
  }[],
): Promise<RequestResponse<null>> {
  return request('/api/system/model/sort/update', {
    method: 'POST',
    data,
  });
}

/**
 * 获取系统连接器提供方列表（非分页，返回数组）
 * 对应接口：GET /api/system/connector/providers
 */
export async function apiSystemConnectorProviderList(
  params?: ConnectorProviderListParams,
): Promise<RequestResponse<ConnectorProviderInfo[]>> {
  return request('/api/system/connector/providers', {
    method: 'GET',
    params,
  });
}

/**
 * 新增连接器提供方
 * 对应接口：POST /api/system/connector/providers
 * 入参：service 唯一标识 + 基本信息（displayName / baseUrl / category / tags 等）
 * + 认证方式 authType 及其配置 authConfig（免鉴权传空对象）
 *
 * 用于连接器列表「新增官方连接器」抽屉的「创建连接器」按钮：
 * 创建成功后由调用方刷新连接器列表（GET /api/system/connector/providers）。
 */
export async function apiSystemConnectorProviderCreate(
  data: CreateConnectorProviderParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/connector/providers', {
    method: 'POST',
    data,
  });
}

/**
 * 保存连接器 OAuth App 配置
 * 对应接口：POST /api/system/connector/oauth-config
 * 入参：service + 平台公共 App 配置（clientId / clientSecret / authUrl /
 * tokenUrl / scopes）
 *
 * 创建 oauth2 + platform 模式的连接器（POST /api/system/connector/providers）
 * 成功后追加调用；clientSecret 不进创建接口，由此接口加密落库。
 */
export async function apiSystemConnectorOauthConfigSave(
  data: SaveConnectorOauthConfigParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/connector/oauth-config', {
    method: 'POST',
    data,
  });
}

/**
 * 更新连接器提供方元信息
 * 对应接口：PUT /api/system/connector/providers/{service}/meta
 * service 拼到 URL path 上；body 与创建接口一致（service / displayName /
 * authType / baseUrl / category / tags / authConfig，oauth2 时为顶层 oauthAppMode）
 *
 * 用于连接器列表「编辑」抽屉的「保存修改」按钮：保存成功后由调用方
 * 刷新连接器列表并打开详情抽屉。
 */
export async function apiSystemConnectorProviderUpdateMeta(
  data: CreateConnectorProviderParams,
): Promise<RequestResponse<null>> {
  return request(`/api/system/connector/providers/${data.service}/meta`, {
    method: 'PUT',
    data,
  });
}

/**
 * 保存连接器提供方排序（拖拽持久化）
 * 对应接口：PUT /api/system/connector/providers/order
 * 入参：按拖拽后顺序排列的 service 数组，数组索引即排序
 */
export async function apiSystemConnectorProviderOrder(
  data: SaveConnectorOrderParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/connector/providers/order', {
    method: 'PUT',
    data,
  });
}

/**
 * 启用/停用连接器提供方
 * 对应接口：PUT /api/system/connector/providers/{service}?enabled={boolean}
 * service 拼到 URL path 上；enabled 作为 query 参数
 */
export async function apiSystemConnectorProviderToggleStatus(
  params: ToggleConnectorProviderStatusParams,
): Promise<RequestResponse<null>> {
  const { service, enabled } = params;
  return request(`/api/system/connector/providers/${service}`, {
    method: 'PUT',
    params: { enabled },
  });
}

/**
 * 启用/停用连接器下的工具/动作
 * 对应接口：PUT /api/system/connector/actions/{id}/status?enabled={boolean}
 * id 拼到 URL path 上；enabled 作为 query 参数（Boolean）
 *
 * 用于详情抽屉工具列表中的"停用/启用"按钮：
 * - 当前 status === 'enabled' → 调 enabled=false 把它停用
 * - 当前 status !== 'enabled' → 调 enabled=true 把它启用
 */
export async function apiSystemConnectorActionToggleStatus(
  params: ToggleConnectorActionStatusParams,
): Promise<RequestResponse<null>> {
  const { id, enabled } = params;
  return request(`/api/system/connector/actions/${id}/status`, {
    method: 'PUT',
    params: { enabled },
  });
}

/**
 * 删除连接器下的工具/动作
 * 对应接口：DELETE /api/system/connector/actions/{id}
 * id 拼到 URL path 上；无 body
 *
 * 用于详情抽屉工具列表中的"删除"按钮（删除前会在 UI 层弹二次确认）。
 */
export async function apiSystemConnectorActionDelete(
  params: DeleteConnectorActionParams,
): Promise<RequestResponse<null>> {
  const { id } = params;
  return request(`/api/system/connector/actions/${id}`, {
    method: 'DELETE',
  });
}

/**
 * 新增连接器下的工具/动作
 * 对应接口：POST /api/system/connector/providers/{service}/actions
 * service 拼到 URL path 上；工具定义（actionKey / inputArgs / httpSpec 等）作为 body 提交
 *
 * 用于详情抽屉工具栏的「+ 添加工具」弹窗：
 * 创建成功后由调用方刷新工具列表与连接器列表
 * （GET /api/system/connector/providers）。
 */
export async function apiSystemConnectorActionCreate(
  params: CreateConnectorActionParams & { service: string },
): Promise<RequestResponse<null>> {
  const { service, ...data } = params;
  return request(`/api/system/connector/providers/${service}/actions`, {
    method: 'POST',
    data,
  });
}

/**
 * 更新连接器下的工具/动作
 * 对应接口：PUT /api/system/connector/providers/{service}/actions/{actionKey}
 * service / actionKey 拼到 URL path 上；body 与创建接口一致（actionKey / inputArgs / httpSpec 等）
 *
 * 用于详情抽屉工具列表的「编辑」按钮（复用「新增/编辑工具」弹窗回填后提交）。
 */
export async function apiSystemConnectorActionUpdate(
  params: CreateConnectorActionParams & { service: string },
): Promise<RequestResponse<null>> {
  const { service, ...data } = params;
  return request(
    `/api/system/connector/providers/${service}/actions/${data.actionKey}`,
    {
      method: 'PUT',
      data,
    },
  );
}

/**
 * 导出连接器提供方（POST /api/system/connector/providers/export）
 * - 不传 services：导出全部
 * - 传 services：导出所选/单行
 *
 * 返回原始响应（含 blob data + headers），由调用方处理文件名解析与下载触发。
 */
export async function apiSystemConnectorProviderExport(
  data?: ExportConnectorProvidersParams,
): Promise<any> {
  return request('/api/system/connector/providers/export', {
    method: 'POST',
    data,
    responseType: 'blob',
    getResponse: true,
    skipErrorHandler: true,
  });
}

/**
 * 预览连接器导入 diff（POST /api/connector/import）
 *
 * - 入参即导入包 JSON 内容（「导出」生成的 JSON，粘贴或选择文件带入），
 *   传解析后的对象，由 request 序列化
 * - 返回 diff 预览：importId + 四类变更计数 + items 明细，不执行导入；
 *   确认导入由后续接口引用 importId 完成
 *
 * 用于「导入官方包」抽屉的「预览导入 diff」按钮。
 */
export async function apiConnectorImport(
  data: unknown,
): Promise<RequestResponse<ConnectorImportDiff>> {
  return request('/api/connector/import', {
    method: 'POST',
    data,
  });
}

/**
 * 确认连接器导入（POST /api/connector/import/apply）
 *
 * - 入参仅 importId：引用「预览导入 diff」返回的导入会话标识，
 *   后端按预览阶段解析好的导入包执行导入
 *
 * 用于「导入官方包」抽屉的「确认导入」按钮；成功后由调用方刷新连接器列表。
 */
export async function apiConnectorImportApply(
  data: ApplyConnectorImportParams,
): Promise<RequestResponse<null>> {
  return request('/api/connector/import/apply', {
    method: 'POST',
    data,
  });
}

/**
 * 分页获取连接器提供方列表（GET /api/connector/providers?spaceId=&pageNum=&pageSize=）
 *
 * - 与系统连接器列表接口（GET /api/system/connector/providers，非分页返回数组）不同，
 *   该接口返回分页结构，列表数据在 data.records 下
 * - 调试弹窗一次拉全量（pageNum=1 & pageSize=2000），取第一条的 service
 *   再调 GET /api/connector/providers/{service} 拉详情
 *
 * 用于「工具调试」弹窗的连接器下拉数据源。
 */
export async function apiConnectorProviderPageList(
  params: ConnectorProviderPageParams,
): Promise<RequestResponse<ConnectorProviderPageResult>> {
  return request('/api/connector/providers', {
    method: 'GET',
    params,
  });
}

/**
 * 执行连接器工具调试（POST /api/connector/runtime/execute）
 *
 * - 入参：providerService（连接器下拉选中值）+ actionKey（动作下拉选中值）+
 *   args（输入参数 JSON 文本域解析出的对象）
 * - 响应 data 为执行结果体（success / message / data / errorCode / meta），
 *   无论业务成功与否均原样返回，由调试弹窗 pretty JSON 展示在「执行结果」区
 *
 * 用于「工具调试」弹窗的「执行」按钮。
 */
export async function apiConnectorRuntimeExecute(
  data: ConnectorRuntimeExecuteParams,
): Promise<RequestResponse<ConnectorRuntimeExecuteResult>> {
  return request('/api/connector/runtime/execute', {
    method: 'POST',
    data,
  });
}

/**
 * 获取连接器提供方详情（GET /api/connector/providers/{service}?spaceId=xxx&includeDisabled=xxx）
 *
 * - service 拼到 URL path 上
 * - spaceId 作为 query 参数；不传或无效值会被后端忽略
 * - includeDisabled 控制是否同时返回已停用的工具；默认 true（详情抽屉需要展示全部工具）
 *
 * 用于"查看"按钮侧滑抽屉展示该提供方的基础信息及工具列表。
 */
export async function apiSystemConnectorProviderDetail(params: {
  service: string;
  spaceId?: number | string;
  includeDisabled?: boolean;
}): Promise<RequestResponse<ConnectorProviderDetail>> {
  const { service, spaceId, includeDisabled } = params;
  return request(`/api/connector/providers/${service}`, {
    method: 'GET',
    params: {
      // 只在 spaceId 是有限数时透传，避免传 undefined / NaN
      spaceId: Number.isFinite(Number(spaceId)) ? Number(spaceId) : undefined,
      // 默认传 true —— 详情抽屉需要展示已停用的工具（"已停用" tag + "启用" 按钮）
      includeDisabled: includeDisabled ?? true,
    },
  });
}

/**
 * 获取可绑定的插件/工作流列表（GET /api/connector/bindable?type=plugin|workflow&spaceId=xxx）
 *
 * 用于「新增工具」弹窗执行类型 = 绑定插件 / 绑定工作流时：
 * 按当前空间筛选可绑定项（仅已发布）；切换空间、切换执行类型或点「刷新列表」时重新调用。
 */
export async function apiConnectorBindable(
  params: ConnectorBindableParams,
): Promise<RequestResponse<ConnectorBindableItem[]>> {
  const { type, spaceId } = params;
  return request('/api/connector/bindable', {
    method: 'GET',
    params: {
      type,
      // 只在 spaceId 是有限数时透传，避免传 undefined / NaN
      spaceId: Number.isFinite(Number(spaceId)) ? Number(spaceId) : undefined,
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

// 更新主题配置
export async function apiSystemConfigUpdate(
  data: TenantConfigDto,
): Promise<RequestResponse<any>> {
  return request('/api/system/config/update-theme', {
    method: 'POST',
    data,
  });
}

// 更新配置信息
export async function apiSystemSubscriptionConfigSave(
  data: TenantSubscriptionConfigInfo,
): Promise<RequestResponse<null>> {
  return request('/api/system/config/save', {
    method: 'POST',
    data,
  });
}

export async function apiQueryPayConfig(): Promise<
  RequestResponse<PayConfigResult>
> {
  return request('/api/system/pay/config/query', {
    method: 'POST',
  });
}

export async function apiCheckPayConnectivity(): Promise<
  RequestResponse<PayConnectivityResult>
> {
  return request('/api/system/pay/config/check-connectivity', {
    method: 'POST',
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

// 更新知识库管控状态
export async function apiSystemResourceKnowledgeAccessControl(
  id: number,
  status: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/resource/knowledge/access/${id}/${status}`, {
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
  maxAgentCount?: number;
}): Promise<RequestResponse<null>> {
  return request('/api/sandbox/config/update', {
    method: 'POST',
    data,
  });
}

/**
 * 创建个人电脑（客户端配置）
 */
export async function apiCreateSandboxUserConfig(data: {
  name: string;
  description?: string;
  maxAgentCount?: number;
}): Promise<RequestResponse<null>> {
  return request('/api/sandbox/config/create', {
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
 * @param sandboxId 选择的沙盒配置ID，'-1' 表示云电脑
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

/**
 * 查询收益明细
 */
export async function apiSystemRevenueDetail(
  params: SystemRevenueDetailParams,
): Promise<RequestResponse<Page<SystemRevenueDetailInfo>>> {
  return request('/api/system/bill/revenue/detail', {
    method: 'GET',
    params,
  });
}

/**
 * 获取资源统计汇总
 */
export async function apiGetResourceStatSummary(params?: {
  userId?: number;
  dtStart?: string;
  dtEnd?: string;
}): Promise<RequestResponse<ResourceStatSummaryDTO>> {
  return request('/api/system/bill/resource-stat/summary', {
    method: 'GET',
    params,
  });
}

/**
 * 获取资源统计明细
 */
export async function apiGetResourceStatDetail(
  params: ResourceStatDetailParams,
): Promise<RequestResponse<PageNum<ResourceStatDTO>>> {
  return request('/api/system/bill/resource-stat/detail', {
    method: 'GET',
    params,
  });
}

/**
 * 获取当前用户资源统计汇总
 */
export async function apiGetMyResourceStatSummary(params?: {
  dtStart?: string;
  dtEnd?: string;
}): Promise<RequestResponse<ResourceStatSummaryDTO>> {
  return request('/api/bill/resource-stat/my-summary', {
    method: 'GET',
    params: { ...params, type: 'CONSUMPTION' },
  });
}

/**
 * 获取当前用户资源统计明细
 */
export async function apiGetMyResourceStatDetail(params: {
  dtStart?: string;
  dtEnd?: string;
  pageNum?: number;
  pageSize?: number;
}): Promise<RequestResponse<PageNum<ResourceStatDTO>>> {
  return request('/api/bill/resource-stat/my', {
    method: 'GET',
    params: { ...params, type: 'CONSUMPTION' },
  });
}
