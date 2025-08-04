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
 * // 查询插件类型的配置列表
 * const result = await getClientConfigList({
 *   queryFilter: {
 *     dataType: 1, // 插件
 *     subTabType: 1, // 全部
 *     name: '搜索关键词'
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
    console.error('获取客户端配置列表失败:', error);
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
 *   console.log('配置名称:', detail.name);
 *   console.log('配置描述:', detail.description);
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
    console.error('获取客户端配置详情失败:', error);
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
 *   console.log('配置删除成功');
 * } else {
 *   console.log('配置删除失败');
 * }
 * ```
 */
export async function deleteClientConfig(uid: string): Promise<boolean> {
  if (!uid || uid.trim() === '') {
    console.warn('UID不能为空');
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
    console.error('删除客户端配置失败:', error);
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
 *   console.log('配置下线成功:', result.name);
 *   console.log('下线时间:', result.offlineTime);
 *   console.log('分享状态:', result.shareStatus); // 应该是4(已下线)
 * } else {
 *   console.log('配置下线失败');
 * }
 * ```
 */
export async function offlineClientConfig(
  uid: string,
): Promise<ClientConfigVo | null> {
  if (!uid || uid.trim() === '') {
    console.warn('UID不能为空');
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
    console.error('下线客户端配置失败:', error);
    return null;
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
 * // 创建插件配置草稿
 * const draft = await createClientConfigDraft({
 *   name: '我的AI插件',
 *   description: '这是一个AI助手插件',
 *   dataType: 1, // 插件
 *   targetType: '插件',
 *   author: '张三',
 *   useStatus: 1, // 启用
 *   icon: 'https://example.com/icon.png'
 * });
 *
 * if (draft) {
 *   console.log('草稿创建成功:', draft.name);
 *   console.log('草稿UID:', draft.uid);
 *   console.log('分享状态:', draft.shareStatus); // 应该是1(草稿)
 * }
 * ```
 */
export async function createClientConfigDraft(
  params: ClientConfigSaveReqDTO,
): Promise<ClientConfigVo | null> {
  if (!params.name || params.name.trim() === '') {
    console.warn('配置名称不能为空');
    return null;
  }

  if (!params.dataType) {
    console.warn('数据类型不能为空');
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
    console.error('创建客户端配置草稿失败:', error);
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
 *   name: '我的AI插件',
 *   description: '这是一个AI助手插件',
 *   dataType: 1, // 插件
 *   targetType: '插件',
 *   author: '张三',
 *   useStatus: 1, // 启用
 *   publishDoc: '插件使用说明文档',
 *   icon: 'https://example.com/icon.png'
 * });
 *
 * if (result) {
 *   console.log('提交审核成功:', result.name);
 *   console.log('配置UID:', result.uid);
 *   console.log('分享状态:', result.shareStatus); // 应该是2(审核中)
 * }
 * ```
 */
export async function saveAndPublishClientConfig(
  params: ClientConfigSaveReqDTO,
): Promise<ClientConfigVo | null> {
  if (!params.name || params.name.trim() === '') {
    console.warn('配置名称不能为空');
    return null;
  }

  if (!params.dataType) {
    console.warn('数据类型不能为空');
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
    console.error('保存并发布客户端配置失败:', error);
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
 *   name: '我的AI插件',
 *   description: '这是一个AI助手插件',
 *   dataType: 1, // 插件
 *   targetType: '插件',
 *   author: '张三',
 *   useStatus: 1, // 启用
 *   publishDoc: '插件使用说明文档',
 *   icon: 'https://example.com/icon.png'
 * });
 *
 * if (result) {
 *   console.log('提交审核成功:', result.name);
 *   console.log('配置UID:', result.uid);
 *   console.log('分享状态:', result.shareStatus); // 应该是2(审核中)
 * }
 * ```
 */
export async function updateAndPublishClientConfig(
  params: ClientConfigSaveReqDTO,
): Promise<ClientConfigVo | null> {
  if (!params.name || params.name.trim() === '') {
    console.warn('配置名称不能为空');
    return null;
  }

  if (!params.dataType) {
    console.warn('数据类型不能为空');
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
    console.error('保存并发布客户端配置失败:', error);
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
 *   name: '更新后的插件名称',
 *   description: '更新后的描述',
 *   dataType: 1, // 插件
 *   targetType: '插件',
 *   author: '张三',
 *   useStatus: 1, // 启用
 *   icon: 'https://example.com/new-icon.png'
 * });
 *
 * if (result) {
 *   console.log('草稿更新成功:', result.name);
 *   console.log('更新时间:', result.modified);
 *   console.log('分享状态:', result.shareStatus); // 应该还是1(草稿)
 * }
 * ```
 */
export async function updateClientConfigDraft(
  params: ClientConfigUpdateDraftReqDTO,
): Promise<ClientConfigVo | null> {
  if (!params.uid || params.uid.trim() === '') {
    console.warn('配置UID不能为空');
    return null;
  }

  if (!params.name || params.name.trim() === '') {
    console.warn('配置名称不能为空');
    return null;
  }

  if (!params.dataType) {
    console.warn('数据类型不能为空');
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
    console.error('更新客户端配置草稿失败:', error);
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
 *   console.log('配置禁用成功:', result.name);
 *   console.log('禁用时间:', result.modified);
 *   console.log('使用状态:', result.useStatus); // 应该是2(已禁用)
 * } else {
 *   console.log('配置禁用失败');
 * }
 * ```
 */
export async function disableClientConfig(
  uid: string,
): Promise<ClientConfigVo | null> {
  if (!uid || uid.trim() === '') {
    console.warn('UID不能为空');
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
    console.error('禁用生态市场配置失败:', error);
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
 *   console.log('配置启用成功:', result.name);
 *   console.log('启用时间:', result.modified);
 *   console.log('使用状态:', result.useStatus); // 应该是1(已启用)
 * } else {
 *   console.log('配置启用失败');
 * }
 * ```
 */
export async function enableClientConfig(
  uid: string,
): Promise<ClientConfigVo | null> {
  if (!uid || uid.trim() === '') {
    console.warn('UID不能为空');
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
    console.error('启用生态市场配置失败:', error);
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
 *   console.log('配置更新并启用成功:', result.name);
 *   console.log('更新时间:', result.modified);
 *   console.log('使用状态:', result.useStatus); // 应该是1(已启用)
 * } else {
 *   console.log('配置更新并启用失败');
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
    console.warn('配置UID不能为空');
    return null;
  }

  if (!params.configParamJson) {
    console.warn('配置参数不能为空');
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
    console.error('更新并启用生态市场配置失败:', error);
    return null;
  }
}

export async function getCategoryListApi(): Promise<any> {
  const response = (await request('/api/published/category/list', {
    method: 'GET',
  })) as RequestResponse<any>;
  return response.data || [];
}
