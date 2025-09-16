import Constant from '@/constants/codes.constants';
import service from '@/services/workflow';
import { UpdateEdgeType } from '@/types/enums/node';
import { ChildNode } from '@/types/interfaces/graph';
import { cloneDeep } from '@/utils/common';

interface UpdateNodeEdgesParams {
  type: UpdateEdgeType;
  targetId: string;
  sourceNode: ChildNode;
  id?: string;
  graphUpdateNode: (nodeId: string, newData: ChildNode | null) => void;
  graphDeleteEdge: (id: string) => void;
  callback: () => Promise<boolean> | void;
}
export const updateNodeEdges = async ({
  type,
  targetId,
  sourceNode,
  id,
  graphUpdateNode,
  graphDeleteEdge,
  callback,
}: UpdateNodeEdgesParams): Promise<number[] | false> => {
  const _nextNodeIds =
    sourceNode.nextNodeIds === null ? [] : (sourceNode.nextNodeIds as number[]);
  const beforeNextNodeIds = cloneDeep(_nextNodeIds);
  const updateNodeId = String(sourceNode.id);
  let _params = {
    nodeId: [..._nextNodeIds],
    sourceId: Number(sourceNode.id),
  };
  const isCreated = type === UpdateEdgeType.created;
  // 根据类型判断，如果type是created，那么就添加边，如果type是deleted，那么就删除边
  if (isCreated) {
    // 如果有这条边了
    if (_nextNodeIds.includes(Number(targetId))) {
      return false;
    } else {
      // 组装参数
      _params.nodeId.push(Number(targetId));
    }
  } else if (type === UpdateEdgeType.deleted) {
    // 删除边
    _params.nodeId = _params.nodeId.filter(
      (item) => Number(item) !== Number(targetId),
    );
  }

  graphUpdateNode(updateNodeId, {
    // 先前端更新节点数据
    ...sourceNode,
    nextNodeIds: [..._params.nodeId],
  });

  try {
    const _res = await service.apiAddEdge(_params);
    // 如果接口不成功，就需要还原节点数据
    if (_res.code !== Constant.success) {
      graphUpdateNode(updateNodeId, {
        // 先前端更新节点数据
        ...sourceNode,
        nextNodeIds: beforeNextNodeIds,
      });
      if (isCreated) {
        // 如果是通过边创建的节点，那么就需要删除边
        // 接口返回失败就是把之前添加的边删除
        graphDeleteEdge(String(id));
      }
      return false;
    } else {
      callback?.();
      // graphUpdateNode(updateNodeId, _res.data);
      // getNodeConfig(sourceNode.id);
      return _params.nodeId;
    }
  } catch (error) {
    console.error('Failed to add edge:', error);
    graphUpdateNode(updateNodeId, {
      // 如果接口不成功，就需要还原节点数据
      ...sourceNode,
      nextNodeIds: beforeNextNodeIds,
    });
    if (isCreated) {
      // 如果是通过边创建的节点，那么就需要删除边
      // 接口返回失败就是把之前添加的边删除
      graphDeleteEdge(String(id));
    }
    return false;
  }
};
