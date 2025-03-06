import { NodeTypeEnum } from '@/types/enums/common';
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
  id?: number;
  name: string;
  description: string;
  icon: string;
}

interface IAddNode {
  workflowId: number;
  type: string;
  loopNodeId?: number;
  typeId?: number;
  extension?: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
}

interface IAddEdge {
  nodeId: number[];
  sourceId: number | string;
}

// 新增节点的返回
interface AddNodeResponse {
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
  modified: string;
  name: string;
  nodes: ChildNode[];
  outputArgs: InputAndOutConfig[];
  publishStatus: string;
  spaceId: number;
  startNode: ChildNode;
  innerEndNode?: boolean;
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

// 根据id查询工作流节点列表
export async function getNodeList(id: number): Promise<RequestResponse<any>> {
  return request(`/api/workflow/node/list/${id}`, {
    method: 'GET',
  });
}

// 给工作流添加节点
export async function addNode(
  data: IAddNode,
): Promise<RequestResponse<AddNodeResponse>> {
  return request(`/api/workflow/node/add`, {
    method: 'POST',
    data,
  });
}

// 复制工作流
export async function copyNode(
  id: string | number,
): Promise<RequestResponse<AddNodeResponse>> {
  return request(`/api/workflow/node/copy/${id}`, {
    method: 'POST',
  });
}

// 删除工作流的节点
export async function deleteNode(
  id: string | number,
): Promise<RequestResponse<null>> {
  return request(`/api/workflow/node/delete/${id}`, {
    method: 'POST',
  });
}

// 添加连线
export async function addEdge(data: IAddEdge): Promise<RequestResponse<null>> {
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
export async function getNodeConfig(id: number): Promise<RequestResponse<any>> {
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

export default {
  getDetails,
  updateDetails,
  getNodeList,
  addNode,
  getModelList,
  deleteNode,
  copyNode,
  addEdge,
  getModelListByWorkflowId,
  getOutputArgs,
  getNodeConfig,
  executeNode,
};
