import { NodeConfig } from '@/types/interfaces/node';
import customRequest from '@/utils/customRequest';
// 工作流的接口

interface IGetModelList {
  modelType?: string;
  apiProtocol?: string;
  scope?: string;
  spaceId?: number;
}

interface IUpdateLLMNode {
  nodeId: number;
  name: string;
  description: string;
  nodeConfig: NodeConfig;
  innerStartNodeId?: number | null;
  innerEndNodeId?: number | null;
}

// 根据id查询工作流节点列表
const getNodeList = async (id: number) => {
  // 发送GET请求，使用相对路径
  return customRequest({
    url: `/api/workflow/node/list/${id}`,
    method: 'GET',
  })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('Failed to get node list:', error);
    });
};

// 查询模型列表
const getModelList = async (params: IGetModelList) => {
  // 发送GET请求，使用相对路径
  return customRequest({
    url: `/api/model/list`,
    method: 'POST',
    data: params,
  })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('Failed to get model list:', error);
    });
};

// 更新大模型的节点
const updateLLMNode = async (params: IUpdateLLMNode) => {
  // 发送GET请求，使用相对路径
  return customRequest({
    url: `/api/workflow/node/llm/update`,
    method: 'POST',
    data: params,
  })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('Failed to get modellist:', error);
    });
};

export default { getNodeList, getModelList, updateLLMNode };
