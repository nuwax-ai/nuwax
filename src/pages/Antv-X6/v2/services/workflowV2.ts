/**
 * V2 工作流服务
 * 完全独立，不依赖 v1 任何服务代码
 *
 * 使用新的接口路径：/api/workflow/v2/*
 */

import { request } from 'umi';
import type {
  ChildNodeV2,
  NodePreviousAndArgMapV2,
  SaveWorkflowRequestV2,
  SaveWorkflowResponseV2,
  ValidationResultV2,
  WorkflowDetailsV2,
} from '../types';

/**
 * 通用响应结构
 */
interface ResponseV2<T> {
  code: string;
  data: T;
  message?: string;
}

/**
 * 成功状态码
 */
const SUCCESS_CODE = '0000';

// ==================== 工作流基础接口 ====================

/**
 * 获取工作流详情
 * @param workflowId 工作流ID
 */
export async function getWorkflowDetailsV2(
  workflowId: number,
): Promise<ResponseV2<WorkflowDetailsV2>> {
  return request(`/api/workflow/${workflowId}`, {
    method: 'GET',
  });
}

/**
 * 全量保存工作流
 * 这是 V2 方案的核心接口，接收完整的工作流数据
 *
 * @param data 工作流数据（包含所有节点）
 */
export async function saveWorkflowFullV2(
  data: SaveWorkflowRequestV2,
): Promise<ResponseV2<SaveWorkflowResponseV2>> {
  return request(`/api/workflow/v2/save`, {
    method: 'POST',
    data,
  });
}

/**
 * 验证工作流配置
 * @param workflowId 工作流ID
 */
export async function validateWorkflowV2(
  workflowId: number,
): Promise<ResponseV2<ValidationResultV2[]>> {
  return request(`/api/workflow/valid/${workflowId}`, {
    method: 'GET',
  });
}

/**
 * 发布工作流
 * @param data 发布数据
 */
export async function publishWorkflowV2(data: {
  workflowId: number;
  name?: string;
  description?: string;
  category?: string;
}): Promise<ResponseV2<null>> {
  return request(`/api/workflow/publish`, {
    method: 'POST',
    data,
  });
}

// ==================== 节点相关接口 ====================

/**
 * 获取节点的上级节点参数（前端计算备用）
 * V2 方案主要在前端计算，此接口作为备用
 *
 * @param nodeId 节点ID
 */
export async function getNodePreviousArgsV2(
  nodeId: number,
): Promise<ResponseV2<NodePreviousAndArgMapV2>> {
  return request(`/api/workflow/node/previous/${nodeId}`, {
    method: 'GET',
  });
}

/**
 * 获取单个节点配置
 * @param nodeId 节点ID
 */
export async function getNodeConfigV2(
  nodeId: number,
): Promise<ResponseV2<ChildNodeV2>> {
  return request(`/api/workflow/node/${nodeId}`, {
    method: 'GET',
  });
}

// ==================== 模型相关接口 ====================

/**
 * 获取可用模型列表
 * @param data 查询参数
 */
export async function getModelListV2(data: {
  spaceId: number;
  workflowId?: number;
}): Promise<ResponseV2<any[]>> {
  return request(`/api/model/list`, {
    method: 'POST',
    data,
  });
}

// ==================== 试运行接口（使用 V1 接口）====================

/**
 * 试运行参数
 */
export interface TestRunParamsV2 {
  workflowId: number;
  params?: Record<string, any>;
  requestId: string;
  answer?: string;
}

/**
 * 节点试运行参数
 */
export interface NodeTestRunParamsV2 {
  nodeId: number;
  requestId?: string;
  params?: Record<string, any>;
}

/**
 * 试运行 SSE 端点
 * 注意：试运行使用 SSE 流式接口，需要在组件中使用 createSSEConnection 调用
 *
 * @endpoint POST /api/workflow/test/execute
 * @body TestRunParamsV2
 */
export const TEST_RUN_ENDPOINT = '/api/workflow/test/execute';

/**
 * 单节点试运行 SSE 端点
 *
 * @endpoint POST /api/workflow/test/node/execute
 * @body NodeTestRunParamsV2
 */
export const NODE_TEST_RUN_ENDPOINT = '/api/workflow/test/node/execute';

/**
 * 单节点试运行（非 SSE 接口）
 * @param data 节点试运行参数
 */
export async function executeNodeV2(
  data: NodeTestRunParamsV2,
): Promise<ResponseV2<any>> {
  return request(`/api/workflow/test/node/execute`, {
    method: 'POST',
    data,
  });
}

// ==================== 版本历史接口 ====================

/**
 * 版本历史项
 */
export interface VersionHistoryItemV2 {
  id: number;
  version: string;
  createTime: string;
  description?: string;
}

/**
 * 获取工作流版本历史
 * @param workflowId 工作流ID
 */
export async function getVersionHistoryV2(
  workflowId: number,
): Promise<ResponseV2<VersionHistoryItemV2[]>> {
  return request(`/api/workflow/config/history/list/${workflowId}`, {
    method: 'GET',
  });
}

/**
 * 还原工作流版本
 * @param historyRecordId 历史记录ID
 */
export async function restoreWorkflowVersionV2(
  historyRecordId: number,
): Promise<ResponseV2<null>> {
  return request(`/api/workflow/restore/${historyRecordId}`, {
    method: 'POST',
  });
}

// ==================== 工具函数 ====================

/**
 * 检查响应是否成功
 * @param response 响应对象
 */
export function isSuccessV2<T>(response: ResponseV2<T>): boolean {
  return response.code === SUCCESS_CODE;
}

/**
 * 提取响应数据
 * @param response 响应对象
 */
export function extractDataV2<T>(response: ResponseV2<T>): T | null {
  return isSuccessV2(response) ? response.data : null;
}

// ==================== 导出服务对象 ====================

const workflowServiceV2 = {
  // 工作流基础
  getWorkflowDetails: getWorkflowDetailsV2,
  saveWorkflowFull: saveWorkflowFullV2,
  validateWorkflow: validateWorkflowV2,
  publishWorkflow: publishWorkflowV2,

  // 节点相关
  getNodePreviousArgs: getNodePreviousArgsV2,
  getNodeConfig: getNodeConfigV2,

  // 模型相关
  getModelList: getModelListV2,

  // 试运行相关
  executeNode: executeNodeV2,
  TEST_RUN_ENDPOINT,
  NODE_TEST_RUN_ENDPOINT,

  // 版本历史
  getVersionHistory: getVersionHistoryV2,
  restoreWorkflowVersion: restoreWorkflowVersionV2,

  // 工具函数
  isSuccess: isSuccessV2,
  extractData: extractDataV2,

  // 常量
  SUCCESS_CODE,
};

export default workflowServiceV2;
