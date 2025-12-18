/**
 * V3 工作流数据管理 Hook
 *
 * 提供 React 组件使用的数据管理接口
 * 封装 workflowProxyV3 的操作，提供响应式状态
 */

import type { ChildNode, Edge } from '@/types/interfaces/graph';
import { useCallback, useState } from 'react';
import type { ProxyResult } from '../services/workflowProxyV3';
import { workflowProxy } from '../services/workflowProxyV3';
import type { EdgeV3, WorkflowDataV3 } from '../types/interfaces';

export interface UseWorkflowDataV3Return {
  // 状态
  nodes: ChildNode[];
  edges: Edge[];
  modified: string;
  isDirty: boolean;

  // 初始化
  initializeData: (data: WorkflowDataV3) => void;
  reset: () => void;

  // 节点操作
  updateNode: (node: ChildNode) => ProxyResult;
  addNode: (node: ChildNode) => ProxyResult;
  deleteNode: (nodeId: number) => ProxyResult;
  updateNodePosition: (
    nodeId: number,
    x: number,
    y: number,
    width?: number,
    height?: number,
  ) => ProxyResult;
  getNodeById: (nodeId: number) => ChildNode | null;

  // 边操作
  addEdge: (edge: EdgeV3) => ProxyResult;
  deleteEdge: (
    source: string,
    target: string,
    sourcePort?: string,
  ) => ProxyResult;
  updateNodeNextIds: (nodeId: number, nextNodeIds: number[]) => ProxyResult;

  // 数据获取
  getFullData: () => WorkflowDataV3 | null;
  hasPendingChanges: () => boolean;
}

export function useWorkflowDataV3(): UseWorkflowDataV3Return {
  const [nodes, setNodes] = useState<ChildNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [modified, setModified] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // 同步代理层数据到状态
  const syncState = useCallback(() => {
    const fullData = workflowProxy.getFullWorkflowData();
    if (fullData) {
      setNodes(fullData.nodes);
      setEdges(fullData.edges);
      setModified(fullData.modified);
      setIsDirty(workflowProxy.hasPendingChanges());
    }
  }, []);

  // 初始化数据
  const initializeData = useCallback(
    (data: WorkflowDataV3) => {
      workflowProxy.initialize(data);
      syncState();
    },
    [syncState],
  );

  // 重置
  const reset = useCallback(() => {
    workflowProxy.reset();
    setNodes([]);
    setEdges([]);
    setModified('');
    setIsDirty(false);
  }, []);

  // 更新节点
  const updateNode = useCallback(
    (node: ChildNode): ProxyResult => {
      const result = workflowProxy.updateNode(node);
      if (result.success) {
        syncState();
      }
      return result;
    },
    [syncState],
  );

  // 添加节点
  const addNode = useCallback(
    (node: ChildNode): ProxyResult => {
      const result = workflowProxy.addNode(node);
      if (result.success) {
        syncState();
      }
      return result;
    },
    [syncState],
  );

  // 删除节点
  const deleteNode = useCallback(
    (nodeId: number): ProxyResult => {
      const result = workflowProxy.deleteNode(nodeId);
      if (result.success) {
        syncState();
      }
      return result;
    },
    [syncState],
  );

  // 更新节点位置
  const updateNodePosition = useCallback(
    (
      nodeId: number,
      x: number,
      y: number,
      width?: number,
      height?: number,
    ): ProxyResult => {
      const result = workflowProxy.updateNodePosition(
        nodeId,
        x,
        y,
        width,
        height,
      );
      if (result.success) {
        syncState();
      }
      return result;
    },
    [syncState],
  );

  // 获取节点
  const getNodeById = useCallback((nodeId: number): ChildNode | null => {
    return workflowProxy.getNodeById(nodeId);
  }, []);

  // 添加边
  const addEdge = useCallback(
    (edge: EdgeV3): ProxyResult => {
      const result = workflowProxy.addEdge(edge);
      if (result.success) {
        syncState();
      }
      return result;
    },
    [syncState],
  );

  // 删除边
  const deleteEdge = useCallback(
    (source: string, target: string, sourcePort?: string): ProxyResult => {
      const result = workflowProxy.deleteEdge(source, target, sourcePort);
      if (result.success) {
        syncState();
      }
      return result;
    },
    [syncState],
  );

  // 更新节点的 nextNodeIds
  const updateNodeNextIds = useCallback(
    (nodeId: number, nextNodeIds: number[]): ProxyResult => {
      const result = workflowProxy.updateNodeNextIds(nodeId, nextNodeIds);
      if (result.success) {
        syncState();
      }
      return result;
    },
    [syncState],
  );

  // 获取全量数据
  const getFullData = useCallback((): WorkflowDataV3 | null => {
    return workflowProxy.getFullWorkflowData();
  }, []);

  // 检查是否有待发送的更改
  const hasPendingChanges = useCallback((): boolean => {
    return workflowProxy.hasPendingChanges();
  }, []);

  return {
    // 状态
    nodes,
    edges,
    modified,
    isDirty,

    // 初始化
    initializeData,
    reset,

    // 节点操作
    updateNode,
    addNode,
    deleteNode,
    updateNodePosition,
    getNodeById,

    // 边操作
    addEdge,
    deleteEdge,
    updateNodeNextIds,

    // 数据获取
    getFullData,
    hasPendingChanges,
  };
}

export default useWorkflowDataV3;
