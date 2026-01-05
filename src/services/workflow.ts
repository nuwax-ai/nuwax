import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { NodeTypeEnum, PermissionsEnum } from '@/types/enums/common';
import { PluginPublishScopeEnum } from '@/types/enums/plugin';
import { CreatorInfo } from '@/types/interfaces/agent';
import { DefaultObjectType } from '@/types/interfaces/common';
import { ChildNode } from '@/types/interfaces/graph';
import type { ModelListItemProps } from '@/types/interfaces/model';
import {
  InputAndOutConfig,
  NodeConfig,
  NodePreviousAndArgMap,
} from '@/types/interfaces/node';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 工作流的接口

interface IGetModelList {
  modelType?: string;
  apiProtocol?: string;
  scope?: string;
  spaceId?: number;
}

export interface IUpdateDetails {
  id?: number | string;
  name?: string;
  description?: string;
  icon?: string;
  extension: {
    size: number;
  };
}

interface IAddNode {
  workflowId: number;
  type: string;
  loopNodeId?: number;
  typeId?: number;
  name?: string;
  shape?: string;
  description?: string;
  extension?: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  nodeConfigDto?: {
    knowledgeBaseConfigs?: {
      knowledgeBaseId: number;
      name: string;
      description: string;
      icon: string;
      type: string;
    }[];
    toolName?: string;
    mcpId?: number;
  };
}

interface IAddEdge {
  nodeId: number[];
  sourceId: number | string;
}

// 新增节点的返回
export interface AddNodeResponse {
  created: string;
  description: string;
  id: number;
  innerEndNode: boolean;
  innerEndNodeId?: number | null;
  innerNodes?: ChildNode[] | null;
  innerStartNodeId?: number | null;
  loopNodeId?: number;
  modified: string;
  name: string;
  nextNodeIds: number[] | null;
  nextNodes: number[] | null;
  nodeConfig: NodeConfig;
  preNodes: number[] | null;
  type: NodeTypeEnum;
  unreachableNextNodeIds: number[] | null;
  virtualExecute: boolean;
  workflowId: number;
  key?: string;
  icon: string;
}

// 获取详情的返回
export interface IgetDetails {
  creator: CreatorInfo;
  created: string;
  description: string;
  endNode: ChildNode;
  icon: string;
  id: number;
  inputArgs: InputAndOutConfig[];
  modified?: string;
  name: string;
  nodes: ChildNode[];
  outputArgs: InputAndOutConfig[];
  publishStatus: string;
  spaceId: number;
  startNode: ChildNode;
  innerEndNode?: boolean;
  publishDate?: string;
  extension: {
    size?: number | string;
  };
  scope: PluginPublishScopeEnum | null;
  // 发布分类
  category?: string;
  // 权限列表
  permissions?: PermissionsEnum[];
  // 系统变量列表（后端返回）
  systemVariables?: InputAndOutConfig[];
  // 编辑版本号（用于版本冲突检测）
  editVersion?: number;
}

// 工作流保存请求参数
export interface ISaveWorkflowParams {
  workflowConfig: IgetDetails;
  // 编辑版本号
  editVersion?: number;
  // 是否强制提交: 0-检测版本冲突, 1-强制提交
  forceCommit?: 0 | 1;
}

// 工作流保存响应
export interface ISaveWorkflowResponse {
  // 新版本号
  editVersion: number;
}
// 试运行所有节点
export interface ITestRun {
  workflowId: number | string;
  requestId: string;
  params?: DefaultObjectType;
  answer?: string;
}
// 试运行单个节点
interface IExecuteNode {
  nodeId: number | string;
  requestId?: number | string;
  params?: DefaultObjectType;
}

// 发布工作流
export interface IPublish {
  workflowId?: number;
  scope: PluginPublishScopeEnum;
  remark?: string;
}

// 校验工作流
export interface IVolidWorkfow {
  nodeId: number;
  success: boolean;
  messages: string[];
}

// 工作流配置历史信息
export interface IWorkflowConfigHistory {
  id: number;
  // 可用值:Agent,Plugin,Workflow,Knowledge,Table
  targetType: AgentComponentTypeEnum;
  targetId: number;
  // 操作类型,Add 新增, Edit 编辑, Publish 发布,可用值:Add,Edit,Publish,PublishApply,PublishApplyReject,OffShelf,AddComponent,EditComponent,DeleteComponent,AddNode,EditNode,DeleteNode
  type: string;
  // 当时的配置信息
  config: unknown;
  // 操作描述
  description: string;
  // 操作人
  opUser: CreatorInfo;
  modified: string;
  created: string;
}

// 获取工作流的详细信息
export async function getDetails(
  id: number,
): Promise<RequestResponse<IgetDetails>> {
  return request(`/api/workflow/${id}`, {
    method: 'GET',
  });
}

// 更改工作流基础信息
export async function updateDetails(
  data: IUpdateDetails,
): Promise<RequestResponse<null>> {
  return request('/api/workflow/update', {
    method: 'POST',
    data,
  });
}

// 获取工作流的详细信息
export async function publishWorkflow(
  data: IPublish,
): Promise<RequestResponse<null>> {
  return request(`/api/workflow/publish`, {
    method: 'POST',
    data,
  });
}

// 根据id查询工作流节点列表
export async function getNodeList(id: number): Promise<RequestResponse<any>> {
  return request(`/api/workflow/node/list/${id}`, {
    method: 'GET',
  });
}

// 给工作流添加节点
export async function apiAddNode(
  data: IAddNode,
): Promise<RequestResponse<AddNodeResponse>> {
  return request(`/api/workflow/node/add`, {
    method: 'POST',
    data,
  });
}
// 给工作流添加节点(V3)
export async function apiAddNodeV3(
  data: IAddNode,
): Promise<RequestResponse<AddNodeResponse>> {
  return request(`/api/workflow/node/add`, {
    method: 'POST',
    skipErrorHandler: true, // 跳过错误处理
    data,
  });
}

// 复制工作流
export async function apiCopyNode(
  id: string | number,
): Promise<RequestResponse<AddNodeResponse>> {
  return request(`/api/workflow/node/copy/${id}`, {
    method: 'POST',
  });
}

// 删除工作流的节点
export async function apiDeleteNode(
  id: string | number,
): Promise<RequestResponse<null>> {
  return request(`/api/workflow/node/delete/${id}`, {
    method: 'POST',
  });
}

// 添加连线
export async function apiAddEdge(
  data: IAddEdge,
): Promise<RequestResponse<null>> {
  return request(`/api/workflow/node/${data.sourceId}/nextIds/update`, {
    method: 'POST',
    data: data.nodeId,
  });
}

// 查询当前工作流可以使用的模型
export async function getModelListByWorkflowId(
  data: IGetModelList,
): Promise<RequestResponse<ModelListItemProps[]>> {
  return request(`/api/model/list`, {
    method: 'POST',
    data,
  });
}

// 查询模型列表
export async function getModelList(
  data: IGetModelList,
): Promise<RequestResponse<null>> {
  return request(`/api/model/list`, {
    method: 'POST',
    data,
  });
}

// 查询上级节点的输出参数
export async function getOutputArgs(
  id: number,
): Promise<RequestResponse<NodePreviousAndArgMap>> {
  return request(`/api/workflow/node/previous/${id}`, {
    method: 'GET',
  });
}

// 查询当前节点的详细信息
export async function getNodeConfig(
  id: number,
): Promise<RequestResponse<ChildNode>> {
  return request(`/api/workflow/node/${id}`, {
    method: 'GET',
  });
}

// 试运行单个节点
export async function executeNode(
  data: IExecuteNode,
): Promise<RequestResponse<any>> {
  return request(`/api/workflow/test/node/execute`, {
    method: 'POST',
    data,
  });
}

// 验证工作流配置的完整性
export async function validWorkflow(
  id: number,
): Promise<RequestResponse<IVolidWorkfow[]>> {
  return request(`/api/workflow/valid/${id}`, {
    method: 'GET',
  });
}

// 查询工作流历史配置信息接口
export async function apiWorkflowConfigHistoryList(
  workflowId: number,
): Promise<RequestResponse<IWorkflowConfigHistory[]>> {
  return request(`/api/workflow/config/history/list/${workflowId}`, {
    method: 'GET',
  });
}

// 还原工作流版本
export async function apiRestoreWorkflowVersion(
  historyRecordId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/workflow/restore/${historyRecordId}`, {
    method: 'POST',
  });
}

// 全量保存工作流配置
export async function saveWorkflow(
  params: ISaveWorkflowParams,
): Promise<RequestResponse<ISaveWorkflowResponse | null>> {
  return request(`/api/workflow/save`, {
    method: 'POST',
    skipErrorHandler: true, // 跳过错误处理
    data: params,
  });
}

export default {
  apiDeleteNode,
  apiCopyNode,
  apiAddEdge,
  getDetails,
  apiAddNode,
  apiAddNodeV3,
  updateDetails,
  getNodeList,
  getModelList,
  getModelListByWorkflowId,
  getOutputArgs,
  getNodeConfig,
  executeNode,
  publishWorkflow,
  validWorkflow,
  apiRestoreWorkflowVersion,
  saveWorkflow,
};
