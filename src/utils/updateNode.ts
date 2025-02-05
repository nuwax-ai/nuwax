import service from '@/services/modifyNode';
import { ChildNode } from '@/types/interfaces/workflow';
// 根据节点的type调用不同的方法

export const updateNode = async (params: ChildNode) => {
  console.log(params);
  const _params = {
    nodeId: params.id,
    name: params.name,
    description: params.description,
    innerStartNodeId: params.innerStartNodeId,
    innerEndNodeId: params.innerEndNodeId,
    nodeConfig: params.nodeConfig,
  };

  return await service.modifyNode(_params, params.type);
};
