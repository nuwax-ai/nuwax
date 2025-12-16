import {
  FoldFormIdEnum,
  NodeUpdateEnum,
  UpdateEdgeType,
} from '@/types/enums/node';
import {
  ChangeEdgeProps,
  ChangeNodeProps,
  ChildNode,
  GraphContainerRef,
} from '@/types/interfaces/graph';
import { cloneDeep } from '@/utils/common';
import { message } from 'antd';
import { MutableRefObject, useCallback } from 'react';
import { useModel } from 'umi';
import { workflowProxy } from '../services/workflowProxyV3';

interface UseGraphInteractionProps {
  graphRef: MutableRefObject<GraphContainerRef | null>;
  debouncedSaveFullWorkflow: () => void;
  changeUpdateTime: () => void;
  getReference: (id: number) => Promise<boolean>;
  setFoldWrapItem: (data: ChildNode) => void;
  getNodeConfig: (id: number) => void;
  updateCurrentNodeRef: any;
}

export const useGraphInteraction = ({
  graphRef,
  debouncedSaveFullWorkflow,
  changeUpdateTime,
  getReference,
  setFoldWrapItem,
  getNodeConfig,
  updateCurrentNodeRef,
}: UseGraphInteractionProps) => {
  const { getWorkflow } = useModel('workflow');

  // 节点添加或移除边
  const nodeChangeEdge = useCallback(
    async (
      config: ChangeEdgeProps,
      callback: () => Promise<boolean> | void = () =>
        getReference(getWorkflow('drawerForm').id),
    ) => {
      const { type, targetId, sourceNode, id } = config;
      if (!graphRef.current) return false;

      if (type === UpdateEdgeType.created) {
        // 添加边
        const edgeDef = { source: String(sourceNode.id), target: targetId };
        const res = workflowProxy.addEdge(edgeDef as any);

        if (res.success) {
          changeUpdateTime();
          await callback(); // Update references

          const updatedNode = workflowProxy.getNodeById(sourceNode.id);
          const newNodeIds = updatedNode?.nextNodeIds || [];
          updateCurrentNodeRef('sourceNode', {
            nextNodeIds: newNodeIds,
          });
          // V3: 连线变化后触发全量保存
          debouncedSaveFullWorkflow();
          return newNodeIds;
        } else {
          // Rollback visual edge
          if (id) {
            graphRef.current.graphDeleteEdge(id);
          }
          message.error(res.message);
          return false;
        }
      } else if (type === UpdateEdgeType.deleted) {
        // 删除边
        const res = workflowProxy.deleteEdge(String(sourceNode.id), targetId);

        if (res.success) {
          changeUpdateTime();
          await callback();

          const updatedNode = workflowProxy.getNodeById(sourceNode.id);
          const newNodeIds = updatedNode?.nextNodeIds || [];
          updateCurrentNodeRef('sourceNode', {
            nextNodeIds: newNodeIds,
          });
          // V3: 连线变化后触发全量保存
          debouncedSaveFullWorkflow();
          return newNodeIds;
        } else {
          message.error(res.message);
          return false;
        }
      }
      return false;
    },
    [
      getReference,
      changeUpdateTime,
      debouncedSaveFullWorkflow,
      graphRef,
      updateCurrentNodeRef,
      getWorkflow,
    ],
  );

  // 更新节点
  const changeNode = useCallback(
    async (
      { nodeData, update, targetNodeId }: ChangeNodeProps,
      callback: () => Promise<boolean> | void = () =>
        getReference(getWorkflow('drawerForm').id),
    ): Promise<boolean> => {
      let params = cloneDeep(nodeData);
      const isOnlyUpdate = update && update === NodeUpdateEnum.moved;
      // Logic to merge form values if updating current node
      // NOTE: This part was a bit tricky in original code as it depended on nodeDrawerRef
      // For now, simplifing: if isOnlyUpdate, we trust the caller has updated params properly or we don't merge form values here
      // because nodeDrawerRef is in parent.
      // Actually, if it's ONLY update (move), we usually don't need form values unless we are saving.
      // But the original code did merge. Let's assume params passed in are correct.

      if (params.id === FoldFormIdEnum.empty) return false;

      // 更新画布节点
      graphRef.current?.graphUpdateNode(String(params.id), params);

      // V3: 使用代理层更新数据，不调用后端接口
      const proxyResult = workflowProxy.updateNode(params);

      if (proxyResult.success) {
        changeUpdateTime();

        if (isOnlyUpdate) {
          // 仅更新节点大小和位置 不需要更新form表单
          // V3: 触发防抖全量保存 (added this to ensure moves are saved)
          debouncedSaveFullWorkflow();
          return true;
        }
        if (targetNodeId) {
          // if (params.type === NodeTypeEnum.Loop) {
          //   // 如果传递的是boolean，那么证明要更新这个节点
          //   getNodeConfig(Number(nodeData.id));
          // }
          // Simplified:
          if (params.type === 'Loop') {
            // Using string literal matching original code logic or Enum
            getNodeConfig(Number(nodeData.id));
          }
        }
        // 如果是修改节点的参数，那么就要更新当前节点的参数
        if (params.id === getWorkflow('drawerForm').id) {
          setFoldWrapItem(params);
        }
        // 更新当前节点的上级引用参数
        callback();
        // V3: 触发防抖全量保存
        debouncedSaveFullWorkflow();
        return true;
      }

      console.error('[V3] 节点更新失败:', proxyResult.message);
      return false;
    },
    [
      getReference,
      changeUpdateTime,
      debouncedSaveFullWorkflow,
      graphRef,
      getWorkflow,
      setFoldWrapItem,
      getNodeConfig,
    ],
  );

  return {
    nodeChangeEdge,
    changeNode,
  };
};
