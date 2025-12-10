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
  /**
   * 提供最新的 nextNodeIds，避免因旧快照覆盖新边
   */
  overrideNextNodeIds?: number[];
}
export const updateNodeEdges = async ({
  type,
  targetId,
  sourceNode,
  id,
  graphUpdateNode,
  graphDeleteEdge,
  callback,
  overrideNextNodeIds,
}: UpdateNodeEdgesParams): Promise<number[] | false> => {
  const baseNextNodeIds =
    overrideNextNodeIds ??
    (sourceNode.nextNodeIds === null
      ? []
      : (sourceNode.nextNodeIds as number[]) || []);
  const _nextNodeIds = [...baseNextNodeIds];
  const beforeNextNodeIds = cloneDeep(_nextNodeIds);
  const updateNodeId = String(sourceNode.id);
  let _params = {
    nodeId: [..._nextNodeIds],
    sourceId: Number(sourceNode.id),
  };
  const isCreated = type === UpdateEdgeType.created;

  console.groupCollapsed('[workflow][edge] updateNodeEdges', {
    type,
    targetId,
    sourceId: sourceNode.id,
    overrideNextNodeIds,
    beforeNextNodeIds,
  });

  // 根据类型判断，如果type是created，那么就添加边，如果type是deleted，那么就删除边
  if (isCreated) {
    // 如果有这条边了
    if (_nextNodeIds.includes(Number(targetId))) {
      console.log('[workflow][edge] skip duplicate edge', {
        targetId,
        _nextNodeIds,
      });
      console.groupEnd();
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

  console.log('[workflow][edge] request payload', _params);

  try {
    const _res = await service.apiAddEdge(_params);
    console.log('[workflow][edge] response', _res);
    // 如果接口不成功，就需要还原节点数据
    if (_res.code !== Constant.success) {
      graphUpdateNode(updateNodeId, {
        // 先前端更新节点数据
        ...sourceNode,
        nextNodeIds: beforeNextNodeIds,
      });
      console.warn('[workflow][edge] apiAddEdge failed, rollback applied');
      if (isCreated) {
        // 如果是通过边创建的节点，那么就需要删除边
        // 接口返回失败就是把之前添加的边删除
        graphDeleteEdge(String(id));
      }
      return false;
    } else {
      console.log('[workflow][edge] apiAddEdge success');
      callback?.();
      // graphUpdateNode(updateNodeId, _res.data);
      // getNodeConfig(sourceNode.id);
      return _params.nodeId;
    }
  } catch (error) {
    console.error('[workflow][edge] apiAddEdge exception', error);
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
  } finally {
    console.groupEnd();
  }
};
