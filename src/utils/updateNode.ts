import service from '@/services/workflow';
import { NodeTypeEnum } from '@/types/enums/common';
import { ChildNode } from '@/types/interfaces/workflow';
// 根据节点的type调用不同的方法

export const updateNode = async (params: ChildNode) => {
  console.log(params);
  switch (params.type) {
    case NodeTypeEnum.LLM: {
      const _params = {
        nodeId: params.id,
        name: params.name,
        description: params.description,
        innerStartNodeId: params.innerStartNodeId,
        innerEndNodeId: params.innerEndNodeId,
        nodeConfig: params.nodeConfig,
      };
      return await service.updateLLMNode(_params);
    }
    case NodeTypeEnum.Plugin: {
      const _params = {
        nodeId: params.id,
        name: params.name,
        description: params.description,
        innerStartNodeId: params.innerStartNodeId,
        innerEndNodeId: params.innerEndNodeId,
        nodeConfig: params.nodeConfig,
      };
      return await service.updatePluginNode(_params);
    }
    default:
      break;
  }
};
