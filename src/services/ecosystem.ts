import { SUCCESS_CODE } from '@/constants/codes.constants';
import type {
  ClientConfigSaveReqDTO,
  ClientConfigUpdateDraftReqDTO,
  ClientConfigVo,
  IPageClientConfigVo,
  PageQueryVoClientConfigQueryRequest,
} from '@/types/interfaces/ecosystem';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 生态市场 - 客户端配置列表查询
export function apiEcoMarketClientConfigList(
  data: PageQueryVoClientConfigQueryRequest,
): Promise<RequestResponse<ClientConfigVo>> {
  return request('/api/system/eco/market/client/config/list', {
    method: 'POST',
    data,
  });
}

/**
 * 生态系统相关API服务
 * 提供客户端配置查询、管理等功能
 */

/**
 * 客户端配置列表查询
 * 分页查询客户端配置列表，并比对服务器配置版本
 *
 * @param params 分页查询参数
 * @returns Promise<IPageClientConfigVo> 分页查询结果
 *
 * @example
 * ```typescript
 * // 查询Plugin类型的配置列表
 * const result = await getClientConfigList({
 *   queryFilter: {
 *     dataType: 1, // Plugin
 *     subTabType: 1, // 全部
 *     name: 'search keyword'
 *   },
 *   current: 1,
 *   pageSize: 10
 * });
 * ```
 */
export async function getClientConfigList(
  params: PageQueryVoClientConfigQueryRequest,
): Promise<IPageClientConfigVo> {
  try {
    const response = (await request(
      '/api/system/eco/market/client/config/list',
      {
        method: 'POST',
        data: params,
      },
    )) as RequestResponse<IPageClientConfigVo>;

    // 返回响应数据，错误处理由全局拦截器处理
    return (
      response.data || {
        size: 0,
        records: [],
        total: 0,
        current: 1,
        pages: 0,
      }
    );
  } catch (error) {
    console.error('Failed to get client config list:', error);
    // 返回空数据结构，避免页面崩溃
    return {
      size: 0,
      records: [],
      total: 0,
      current: 1,
      pages: 0,
    };
  }
}

/**
 * 客户端配置详情查询
 * 根据UID查询客户端配置详情
 *
 * @param params 详情查询参数
 * @returns Promise<ClientConfigVo | null> 配置详情数据
 *
 * @example
 * ```typescript
 * // 查询指定UID的配置详情
 * const detail = await getClientConfigDetail({
 *   uid: 'config-uuid-123'
 * });
 *
 * if (detail) {
 *   console.log('Config name:', detail.name);
 *   console.log('Config description:', detail.description);
 * }
 * ```
 */
export async function getClientConfigDetail(
  uid: string,
): Promise<ClientConfigVo | null> {
  try {
    const response = (await request(
      '/api/system/eco/market/client/config/detail',
      {
        method: 'POST',
        data: {
          uid,
        },
      },
    )) as RequestResponse<ClientConfigVo>;

    // 返回响应数据，错误处理由全局拦截器处理
    return response.data || null;
  } catch (error) {
    console.error('Failed to get client config detail:', error);
    // 返回null，表示获取失败
    return null;
  }
}

/**
 * 删除客户端配置
 * 根据UID删除指定的客户端配置
 *
 * @param uid 配置的唯一标识
 * @returns Promise<boolean> 删除是否成功
 *
 * @example
 * ```typescript
 * // 删除指定配置
 * const success = await deleteClientConfig('config-uuid-123');
 * if (success) {
 *   console.log('Config deleted successfully');
 * } else {
 *   console.log('Config deletion failed');
 * }
 * ```
 */
export async function deleteClientConfig(uid: string): Promise<boolean> {
  if (!uid || uid.trim() === '') {
    console.warn('UID cannot be empty');
    return false;
  }

  try {
    const response = (await request(
      `/api/system/eco/market/client/config/delete/${encodeURIComponent(
        uid.trim(),
      )}`,
      {
        method: 'DELETE',
      },
    )) as RequestResponse<boolean>;

    // 返回删除结果
    return response.data === true;
  } catch (error) {
    console.error('Failed to delete client config:', error);
    return false;
  }
}

/**
 * 下线客户端配置
 * 下线已发布的客户端配置
 *
 * @param uid 配置的唯一标识
 * @returns Promise<ClientConfigVo | null> 下线后的配置详情
 *
 * @example
 * ```typescript
 * // 下线指定配置
 * const result = await offlineClientConfig('config-uuid-123');
 * if (result) {
 *   console.log('Config offline succeeded:', result.name);
 *   console.log('Offline time:', result.offlineTime);
 *   console.log('Share status:', result.shareStatus); // 应该是4(已下线)
 * } else {
 *   console.log('Config offline failed');
 * }
 * ```
 */
export async function offlineClientConfig(
  uid: string,
): Promise<ClientConfigVo | null> {
  if (!uid || uid.trim() === '') {
    console.warn('UID cannot be empty');
    return null;
  }

  try {
    const response = (await request(
      `/api/system/eco/market/client/config/offline/${encodeURIComponent(
        uid.trim(),
      )}`,
      {
        method: 'POST',
      },
    )) as RequestResponse<ClientConfigVo>;

    // 返回下线后的配置详情
    return response.data || null;
  } catch (error) {
    console.error('Failed to offline client config:', error);
    return null;
  }
}

/**
 * 撤销发布
 * 撤销已发布的客户端配置
 *
 * @param uid 配置的唯一标识
 * @returns Promise<ClientConfigVo | null> 撤销后的配置详情
 *
 * @example
 * ```typescript
 * // 撤回指定配置
 * const result = await withdrawClientConfig('config-uuid-123');
 * if (result) {
 *   console.log('Config withdrawal succeeded:', result.name);
 *   console.log('Withdrawal time:', result.modified);
 * } else {
 *   console.log('Config withdrawal failed');
 * }
 * ```
 */
export async function withdrawClientConfig(uid: string): Promise<boolean> {
  if (!uid || uid.trim() === '') {
    console.warn('UID cannot be empty');
    return false;
  }

  try {
    const response = (await request(
      `/api/system/eco/market/client/config/unpublish/${encodeURIComponent(
        uid.trim(),
      )}`,
      {
        method: 'POST',
      },
    )) as RequestResponse<ClientConfigVo>;

    // 返回撤回后的配置详情
    return response.code === SUCCESS_CODE;
  } catch (error) {
    console.error('Failed to unpublish config:', error);
    return false;
  }
}

/**
 * 创建客户端配置草稿
 * 创建一个新的客户端配置草稿
 *
 * @param params 配置保存请求参数
 * @returns Promise<ClientConfigVo | null> 创建的配置详情
 *
 * @example
 * ```typescript
 * // 创建Plugin配置草稿
 * const draft = await createClientConfigDraft({
 *   name: 'My AI Plugin',
 *   description: 'This is an AI assistant plugin',
 *   dataType: 1, // Plugin
 *   targetType: 'Plugin',
 *   author: 'Alice',
 *   useStatus: 1, // 启用
 *   icon: 'https://example.com/icon.png'
 * });
 *
 * if (draft) {
 *   console.log('Draft created successfully:', draft.name);
 *   console.log('Draft UID:', draft.uid);
 *   console.log('Share status:', draft.shareStatus); // 应该是1(草稿)
 * }
 * ```
 */
export async function createClientConfigDraft(
  params: ClientConfigSaveReqDTO,
): Promise<ClientConfigVo | null> {
  if (!params.name || params.name.trim() === '') {
    console.warn('Config name cannot be empty');
    return null;
  }

  if (!params.dataType) {
    console.warn('Data type cannot be empty');
    return null;
  }

  try {
    const response = (await request(
      '/api/system/eco/market/client/config/save/draft',
      {
        method: 'POST',
        data: params,
      },
    )) as RequestResponse<ClientConfigVo>;

    // 返回创建的配置详情
    return response.data || null;
  } catch (error) {
    console.error('Failed to create client config draft:', error);
    return null;
  }
}

/**
 * 保存客户端配置并提交审核
 * 保存配置并提交审核，配置状态会变为审核中
 *
 * @param params 配置保存请求参数
 * @returns Promise<ClientConfigVo | null> 提交审核后的配置详情
 *
 * @example
 * ```typescript
 * // 保存并提交审核
 * const result = await saveAndPublishClientConfig({
 *   name: 'My AI Plugin',
 *   description: 'This is an AI assistant plugin',
 *   dataType: 1, // Plugin
 *   targetType: 'Plugin',
 *   author: 'Alice',
 *   useStatus: 1, // 启用
 *   publishDoc: 'Plugin usage documentation',
 *   icon: 'https://example.com/icon.png'
 * });
 *
 * if (result) {
 *   console.log('Submitted for review successfully:', result.name);
 *   console.log('Config UID:', result.uid);
 *   console.log('Share status:', result.shareStatus); // 应该是2(审核中)
 * }
 * ```
 */
export async function saveAndPublishClientConfig(
  params: ClientConfigSaveReqDTO,
): Promise<ClientConfigVo | null> {
  if (!params.name || params.name.trim() === '') {
    console.warn('Config name cannot be empty');
    return null;
  }

  if (!params.dataType) {
    console.warn('Data type cannot be empty');
    return null;
  }

  try {
    const response = (await request(
      '/api/system/eco/market/client/config/save/publish',
      {
        method: 'POST',
        data: params,
      },
    )) as RequestResponse<ClientConfigVo>;

    // 返回提交审核后的配置详情
    return response.data || null;
  } catch (error) {
    console.error('Failed to save and publish client config:', error);
    return null;
  }
}

/**
 * 更新客户端配置并提交审核
 * 更新配置并提交审核，配置状态会变为审核中
 *
 * @param params 配置保存请求参数
 * @returns Promise<ClientConfigVo | null> 提交审核后的配置详情
 *
 * @example
 * ```typescript
 * // 保存并提交审核
 * const result = await saveAndPublishClientConfig({
 *   uid: 'config-uuid-123',
 *   name: 'My AI Plugin',
 *   description: 'This is an AI assistant plugin',
 *   dataType: 1, // Plugin
 *   targetType: 'Plugin',
 *   author: 'Alice',
 *   useStatus: 1, // 启用
 *   publishDoc: 'Plugin usage documentation',
 *   icon: 'https://example.com/icon.png'
 * });
 *
 * if (result) {
 *   console.log('Submitted for review successfully:', result.name);
 *   console.log('Config UID:', result.uid);
 *   console.log('Share status:', result.shareStatus); // 应该是2(审核中)
 * }
 * ```
 */
export async function updateAndPublishClientConfig(
  params: ClientConfigSaveReqDTO,
): Promise<ClientConfigVo | null> {
  if (!params.name || params.name.trim() === '') {
    console.warn('Config name cannot be empty');
    return null;
  }

  if (!params.dataType) {
    console.warn('Data type cannot be empty');
    return null;
  }

  try {
    const response = (await request(
      '/api/system/eco/market/client/config/update/publish',
      {
        method: 'POST',
        data: params,
      },
    )) as RequestResponse<ClientConfigVo>;

    // 返回提交审核后的配置详情
    return response.data || null;
  } catch (error) {
    console.error('Failed to save and publish client config:', error);
    return null;
  }
}

/**
 * 更新客户端配置草稿
 * 根据UID更新客户端配置草稿
 *
 * @param params 配置更新草稿请求参数
 * @returns Promise<ClientConfigVo | null> 更新后的配置详情
 *
 * @example
 * ```typescript
 * // 更新配置草稿
 * const result = await updateClientConfigDraft({
 *   uid: 'config-uuid-123',
 *   name: 'Updated plugin name',
 *   description: 'Updated description',
 *   dataType: 1, // Plugin
 *   targetType: 'Plugin',
 *   author: 'Alice',
 *   useStatus: 1, // 启用
 *   icon: 'https://example.com/new-icon.png'
 * });
 *
 * if (result) {
 *   console.log('Draft updated successfully:', result.name);
 *   console.log('Updated time:', result.modified);
 *   console.log('Share status:', result.shareStatus); // 应该还是1(草稿)
 * }
 * ```
 */
export async function updateClientConfigDraft(
  params: ClientConfigUpdateDraftReqDTO,
): Promise<ClientConfigVo | null> {
  if (!params.uid || params.uid.trim() === '') {
    console.warn('Config UID cannot be empty');
    return null;
  }

  if (!params.name || params.name.trim() === '') {
    console.warn('Config name cannot be empty');
    return null;
  }

  if (!params.dataType) {
    console.warn('Data type cannot be empty');
    return null;
  }

  try {
    const response = (await request(
      '/api/system/eco/market/client/config/update/draft',
      {
        method: 'POST',
        data: params,
      },
    )) as RequestResponse<ClientConfigVo>;

    // 返回更新后的配置详情
    return response.data || null;
  } catch (error) {
    console.error('Failed to update client config draft:', error);
    return null;
  }
}

/**
 * 禁用生态市场配置
 * 根据UID禁用指定的生态市场配置
 *
 * @param uid 配置的唯一标识
 * @returns Promise<ClientConfigVo | null> 禁用后的配置详情
 *
 * @example
 * ```typescript
 * // 禁用指定配置
 * const result = await disableClientConfig('config-uuid-123');
 * if (result) {
 *   console.log('Config disabled successfully:', result.name);
 *   console.log('Disabled time:', result.modified);
 *   console.log('Usage status:', result.useStatus); // 应该是2(已禁用)
 * } else {
 *   console.log('Config disable failed');
 * }
 * ```
 */
export async function disableClientConfig(
  uid: string,
): Promise<ClientConfigVo | null> {
  if (!uid || uid.trim() === '') {
    console.warn('UID cannot be empty');
    return null;
  }

  try {
    const response = (await request(
      `/api/system/eco/market/client/publish/config/disable?uid=${encodeURIComponent(
        uid.trim(),
      )}`,
      {
        method: 'POST',
        data: {
          uid,
        },
      },
    )) as RequestResponse<ClientConfigVo>;

    // 返回禁用后的配置详情
    return response.data || null;
  } catch (error) {
    console.error('Failed to disable eco-market config:', error);
    return null;
  }
}

/**
 * 启用生态市场配置
 * 根据UID启用指定的生态市场配置
 *
 * @param uid 配置的唯一标识
 * @returns Promise<ClientConfigVo | null> 启用后的配置详情
 *
 * @example
 * ```typescript
 * // 启用指定配置
 * const result = await enableClientConfig('config-uuid-123');
 * if (result) {
 *   console.log('Config enabled successfully:', result.name);
 *   console.log('Enabled time:', result.modified);
 *   console.log('Usage status:', result.useStatus); // 应该是1(已启用)
 * } else {
 *   console.log('Config enable failed');
 * }
 * ```
 */
export async function enableClientConfig(
  uid: string,
): Promise<ClientConfigVo | null> {
  if (!uid || uid.trim() === '') {
    console.warn('UID cannot be empty');
    return null;
  }

  try {
    const response = (await request(
      `/api/system/eco/market/client/publish/config/enable?uid=${encodeURIComponent(
        uid.trim(),
      )}`,
      {
        method: 'POST',
      },
    )) as RequestResponse<ClientConfigVo>;

    // 返回启用后的配置详情
    return response.data || null;
  } catch (error) {
    console.error('Failed to enable eco-market config:', error);
    return null;
  }
}

/**
 * 更新并启用生态市场配置
 * 更新配置参数并启用指定的生态市场配置
 *
 * @param params 更新并启用配置请求参数
 * @returns Promise<ClientConfigVo | null> 更新并启用后的配置详情
 *
 * @example
 * ```typescript
 * // 更新并启用配置
 * const result = await updateAndEnableClientConfig({
 *   uid: 'config-uuid-123',
 *   configParamJson: JSON.stringify({
 *     // 配置参数
 *   })
 * });
 * if (result) {
 *   console.log('Config updated and enabled successfully:', result.name);
 *   console.log('Updated time:', result.modified);
 *   console.log('Usage status:', result.useStatus); // 应该是1(已启用)
 * } else {
 *   console.log('Config update-and-enable failed');
 * }
 * ```
 */
export async function updateAndEnableClientConfig(params: {
  uid: string;
  configParamJson: string;
  // MCP配置json，可选
  configJson?: string;
}): Promise<ClientConfigVo | null> {
  if (!params.uid || params.uid.trim() === '') {
    console.warn('Config UID cannot be empty');
    return null;
  }

  if (!params.configParamJson) {
    console.warn('Config params cannot be empty');
    return null;
  }

  try {
    const response = (await request(
      '/api/system/eco/market/client/publish/config/updateAndEnable',
      {
        method: 'POST',
        data: params,
      },
    )) as RequestResponse<ClientConfigVo>;

    // 返回更新并启用后的配置详情
    return response.data || null;
  } catch (error) {
    console.error('Failed to update and enable eco-market config:', error);
    return null;
  }
}

export async function getCategoryListApi(): Promise<any> {
  const response = (await request('/api/published/category/list', {
    method: 'GET',
  })) as RequestResponse<any>;
  return response.data || [];
}

// 删除配置
export async function apiEcoMarketClientConfigDelete(
  uid: string,
): Promise<RequestResponse<null>> {
  return request(`/api/system/eco/market/client/config/delete/${uid}`, {
    method: 'POST',
  });
}
