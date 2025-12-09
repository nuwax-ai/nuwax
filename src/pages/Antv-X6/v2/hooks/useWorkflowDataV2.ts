/**
 * V2 工作流数据管理 Hook
 *
 * 核心功能：
 * 1. 管理 nodeList 和 edgeList 作为前端唯一数据源
 * 2. 提供节点和边的增删改查方法
 * 3. 实现数据变更监听和自动保存机制（节流/防抖）
 * 4. 支持历史记录（撤销/重做）
 *
 * 完全独立，不依赖 v1 任何代码
 */

import { message } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AUTO_SAVE_CONFIG_V2, HISTORY_CONFIG_V2 } from '../constants';
import workflowServiceV2 from '../services/workflowV2';
import type {
  ChildNodeV2,
  EdgeV2,
  HistoryItemV2,
  WorkflowDataV2,
} from '../types';
import { HistoryActionTypeV2 } from '../types';
import { extractEdgesFromNodes } from '../utils/graphV2';

/**
 * Hook 参数
 */
interface UseWorkflowDataV2Props {
  workflowId: number;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

/**
 * Hook 返回值
 */
interface UseWorkflowDataV2Return {
  // 数据状态
  workflowData: WorkflowDataV2;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;

  // 节点操作
  addNode: (node: ChildNodeV2) => void;
  updateNode: (nodeId: number, updates: Partial<ChildNodeV2>) => void;
  deleteNode: (nodeId: number) => void;
  getNodeById: (nodeId: number) => ChildNodeV2 | undefined;

  // 边操作
  addEdge: (edge: EdgeV2) => void;
  deleteEdge: (source: string, target: string) => void;
  getEdgesByNodeId: (nodeId: number) => EdgeV2[];

  // 批量操作
  batchUpdate: (updates: {
    nodes?: { id: number; updates: Partial<ChildNodeV2> }[];
    addEdges?: EdgeV2[];
    deleteEdges?: { source: string; target: string }[];
  }) => void;

  // 数据刷新
  refreshData: () => Promise<void>;

  // 保存操作
  saveNow: () => Promise<boolean>;

  // 历史操作
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  // 清理
  reset: () => void;
}

/**
 * 深拷贝工具函数
 */
const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * 防抖函数
 */
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
  let timeoutId: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
};

/**
 * 节流函数
 */
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let lastTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - lastTime);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      func(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        func(...args);
      }, remaining);
    }
  };
};

/**
 * V2 工作流数据管理 Hook
 */
export function useWorkflowDataV2({
  workflowId,
  onSaveSuccess,
  onSaveError,
}: UseWorkflowDataV2Props): UseWorkflowDataV2Return {
  // ==================== 状态定义 ====================

  // 工作流数据
  const [workflowData, setWorkflowData] = useState<WorkflowDataV2>({
    nodeList: [],
    edgeList: [],
    lastSavedVersion: '',
    isDirty: false,
  });

  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 历史记录
  const [historyStack, setHistoryStack] = useState<HistoryItemV2[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Refs
  const saveRetryCount = useRef(0);
  const lastSavedData = useRef<WorkflowDataV2 | null>(null);

  // ==================== 计算属性 ====================

  const isDirty = workflowData.isDirty;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyStack.length - 1;

  // ==================== 历史记录操作 ====================

  /**
   * 记录历史
   */
  const recordHistory = useCallback(
    (
      type: HistoryActionTypeV2,
      beforeData: WorkflowDataV2,
      afterData: WorkflowDataV2,
    ) => {
      if (!HISTORY_CONFIG_V2.enabled) return;

      const newHistory: HistoryItemV2 = {
        id: uuidv4(),
        type,
        timestamp: Date.now(),
        data: {
          before: deepClone(beforeData),
          after: deepClone(afterData),
        },
      };

      setHistoryStack((prev) => {
        // 如果当前不在历史末尾，截断后面的历史
        const newStack = prev.slice(0, historyIndex + 1);
        newStack.push(newHistory);

        // 限制历史栈大小
        if (newStack.length > HISTORY_CONFIG_V2.stackSize) {
          newStack.shift();
        }

        return newStack;
      });

      setHistoryIndex((prev) =>
        Math.min(prev + 1, HISTORY_CONFIG_V2.stackSize - 1),
      );
    },
    [historyIndex],
  );

  /**
   * 撤销
   */
  const undo = useCallback(() => {
    if (!canUndo) return;

    const prevHistory = historyStack[historyIndex];
    if (prevHistory) {
      setWorkflowData({
        ...prevHistory.data.before,
        isDirty: true,
      });
      setHistoryIndex((prev) => prev - 1);
    }
  }, [canUndo, historyStack, historyIndex]);

  /**
   * 重做
   */
  const redo = useCallback(() => {
    if (!canRedo) return;

    const nextHistory = historyStack[historyIndex + 1];
    if (nextHistory) {
      setWorkflowData({
        ...nextHistory.data.after,
        isDirty: true,
      });
      setHistoryIndex((prev) => prev + 1);
    }
  }, [canRedo, historyStack, historyIndex]);

  // ==================== 保存操作 ====================

  /**
   * 执行保存
   */
  const doSave = useCallback(async (): Promise<boolean> => {
    if (isSaving || !workflowData.isDirty) return true;

    setIsSaving(true);

    try {
      const response = await workflowServiceV2.saveWorkflowFull({
        workflowId,
        nodes: workflowData.nodeList,
      });

      if (workflowServiceV2.isSuccess(response)) {
        // 保存成功
        const version = response.data?.version || Date.now().toString();

        setWorkflowData((prev) => ({
          ...prev,
          lastSavedVersion: version,
          isDirty: false,
        }));

        lastSavedData.current = deepClone(workflowData);
        saveRetryCount.current = 0;

        onSaveSuccess?.();
        return true;
      } else {
        throw new Error(response.message || '保存失败');
      }
    } catch (error) {
      console.error('[V2] 保存失败:', error);

      // 重试逻辑
      if (saveRetryCount.current < AUTO_SAVE_CONFIG_V2.maxRetries) {
        saveRetryCount.current++;
        message.warning(
          `保存失败，正在重试 (${saveRetryCount.current}/${AUTO_SAVE_CONFIG_V2.maxRetries})`,
        );

        setTimeout(() => {
          doSave();
        }, AUTO_SAVE_CONFIG_V2.retryDelay);
      } else {
        message.error('保存失败，请手动保存');
        onSaveError?.(error as Error);
      }

      return false;
    } finally {
      setIsSaving(false);
    }
  }, [workflowId, workflowData, isSaving, onSaveSuccess, onSaveError]);

  /**
   * 节流保存（用于频繁操作）
   */
  const throttledSave = useMemo(
    () => throttle(doSave, AUTO_SAVE_CONFIG_V2.throttleTime),
    [doSave],
  );

  /**
   * 防抖保存（用于输入等操作）
   */
  const debouncedSave = useMemo(
    () => debounce(doSave, AUTO_SAVE_CONFIG_V2.debounceTime),
    [doSave],
  );

  /**
   * 立即保存
   */
  const saveNow = useCallback(async (): Promise<boolean> => {
    debouncedSave.cancel();
    return await doSave();
  }, [doSave, debouncedSave]);

  // ==================== 节点操作 ====================

  /**
   * 添加节点
   */
  const addNode = useCallback(
    (node: ChildNodeV2) => {
      setWorkflowData((prev) => {
        const beforeData = deepClone(prev);
        const newNodeList = [...prev.nodeList, node];
        const afterData = {
          ...prev,
          nodeList: newNodeList,
          isDirty: true,
        };

        recordHistory(HistoryActionTypeV2.ADD_NODE, beforeData, afterData);

        return afterData;
      });

      // 触发自动保存
      if (AUTO_SAVE_CONFIG_V2.enabled) {
        throttledSave();
      }
    },
    [recordHistory, throttledSave],
  );

  /**
   * 更新节点
   */
  const updateNode = useCallback(
    (nodeId: number, updates: Partial<ChildNodeV2>) => {
      setWorkflowData((prev) => {
        const beforeData = deepClone(prev);
        const nodeIndex = prev.nodeList.findIndex((n) => n.id === nodeId);

        if (nodeIndex === -1) return prev;

        const newNodeList = [...prev.nodeList];
        newNodeList[nodeIndex] = {
          ...newNodeList[nodeIndex],
          ...updates,
        };

        const afterData = {
          ...prev,
          nodeList: newNodeList,
          isDirty: true,
        };

        recordHistory(HistoryActionTypeV2.UPDATE_NODE, beforeData, afterData);

        return afterData;
      });

      // 触发自动保存（使用防抖，适合频繁更新）
      if (AUTO_SAVE_CONFIG_V2.enabled) {
        debouncedSave();
      }
    },
    [recordHistory, debouncedSave],
  );

  /**
   * 删除节点
   */
  const deleteNode = useCallback(
    (nodeId: number) => {
      setWorkflowData((prev) => {
        const beforeData = deepClone(prev);

        // 删除节点
        const newNodeList = prev.nodeList.filter((n) => n.id !== nodeId);

        // 删除相关的边
        const nodeIdStr = nodeId.toString();
        const newEdgeList = prev.edgeList.filter(
          (e) => e.source !== nodeIdStr && e.target !== nodeIdStr,
        );

        // 更新其他节点的 nextNodeIds
        const updatedNodeList = newNodeList.map((node) => {
          if (node.nextNodeIds?.includes(nodeId)) {
            return {
              ...node,
              nextNodeIds: node.nextNodeIds.filter((id) => id !== nodeId),
            };
          }
          return node;
        });

        const afterData = {
          ...prev,
          nodeList: updatedNodeList,
          edgeList: newEdgeList,
          isDirty: true,
        };

        recordHistory(HistoryActionTypeV2.DELETE_NODE, beforeData, afterData);

        return afterData;
      });

      // 触发自动保存
      if (AUTO_SAVE_CONFIG_V2.enabled) {
        throttledSave();
      }
    },
    [recordHistory, throttledSave],
  );

  /**
   * 根据ID获取节点
   */
  const getNodeById = useCallback(
    (nodeId: number): ChildNodeV2 | undefined => {
      return workflowData.nodeList.find((n) => n.id === nodeId);
    },
    [workflowData.nodeList],
  );

  // ==================== 边操作 ====================

  /**
   * 添加边
   */
  const addEdge = useCallback(
    (edge: EdgeV2) => {
      setWorkflowData((prev) => {
        // 检查是否已存在
        const exists = prev.edgeList.some(
          (e) => e.source === edge.source && e.target === edge.target,
        );
        if (exists) return prev;

        const beforeData = deepClone(prev);
        const newEdgeList = [...prev.edgeList, edge];

        // 更新源节点的 nextNodeIds
        const sourceNodeId = parseInt(edge.source, 10);
        const targetNodeId = parseInt(edge.target, 10);

        const newNodeList = prev.nodeList.map((node) => {
          if (node.id === sourceNodeId) {
            const nextNodeIds = node.nextNodeIds || [];
            if (!nextNodeIds.includes(targetNodeId)) {
              return {
                ...node,
                nextNodeIds: [...nextNodeIds, targetNodeId],
              };
            }
          }
          return node;
        });

        const afterData = {
          ...prev,
          nodeList: newNodeList,
          edgeList: newEdgeList,
          isDirty: true,
        };

        recordHistory(HistoryActionTypeV2.ADD_EDGE, beforeData, afterData);

        return afterData;
      });

      // 触发自动保存
      if (AUTO_SAVE_CONFIG_V2.enabled) {
        throttledSave();
      }
    },
    [recordHistory, throttledSave],
  );

  /**
   * 删除边
   */
  const deleteEdge = useCallback(
    (source: string, target: string) => {
      setWorkflowData((prev) => {
        const beforeData = deepClone(prev);

        const newEdgeList = prev.edgeList.filter(
          (e) => !(e.source === source && e.target === target),
        );

        // 更新源节点的 nextNodeIds
        const sourceNodeId = parseInt(source, 10);
        const targetNodeId = parseInt(target, 10);

        const newNodeList = prev.nodeList.map((node) => {
          if (node.id === sourceNodeId && node.nextNodeIds) {
            return {
              ...node,
              nextNodeIds: node.nextNodeIds.filter((id) => id !== targetNodeId),
            };
          }
          return node;
        });

        const afterData = {
          ...prev,
          nodeList: newNodeList,
          edgeList: newEdgeList,
          isDirty: true,
        };

        recordHistory(HistoryActionTypeV2.DELETE_EDGE, beforeData, afterData);

        return afterData;
      });

      // 触发自动保存
      if (AUTO_SAVE_CONFIG_V2.enabled) {
        throttledSave();
      }
    },
    [recordHistory, throttledSave],
  );

  /**
   * 根据节点ID获取相关的边
   */
  const getEdgesByNodeId = useCallback(
    (nodeId: number): EdgeV2[] => {
      const nodeIdStr = nodeId.toString();
      return workflowData.edgeList.filter(
        (e) => e.source === nodeIdStr || e.target === nodeIdStr,
      );
    },
    [workflowData.edgeList],
  );

  // ==================== 批量操作 ====================

  /**
   * 批量更新
   */
  const batchUpdate = useCallback(
    (updates: {
      nodes?: { id: number; updates: Partial<ChildNodeV2> }[];
      addEdges?: EdgeV2[];
      deleteEdges?: { source: string; target: string }[];
    }) => {
      setWorkflowData((prev) => {
        const beforeData = deepClone(prev);
        let newNodeList = [...prev.nodeList];
        let newEdgeList = [...prev.edgeList];

        // 批量更新节点
        if (updates.nodes) {
          updates.nodes.forEach(({ id, updates: nodeUpdates }) => {
            const index = newNodeList.findIndex((n) => n.id === id);
            if (index !== -1) {
              newNodeList[index] = { ...newNodeList[index], ...nodeUpdates };
            }
          });
        }

        // 批量添加边
        if (updates.addEdges) {
          updates.addEdges.forEach((edge) => {
            const exists = newEdgeList.some(
              (e) => e.source === edge.source && e.target === edge.target,
            );
            if (!exists) {
              newEdgeList.push(edge);
            }
          });
        }

        // 批量删除边
        if (updates.deleteEdges) {
          updates.deleteEdges.forEach(({ source, target }) => {
            newEdgeList = newEdgeList.filter(
              (e) => !(e.source === source && e.target === target),
            );
          });
        }

        const afterData = {
          ...prev,
          nodeList: newNodeList,
          edgeList: newEdgeList,
          isDirty: true,
        };

        recordHistory(HistoryActionTypeV2.BATCH, beforeData, afterData);

        return afterData;
      });

      // 触发自动保存
      if (AUTO_SAVE_CONFIG_V2.enabled) {
        throttledSave();
      }
    },
    [recordHistory, throttledSave],
  );

  // ==================== 数据刷新 ====================

  /**
   * 从服务器刷新数据
   */
  const refreshData = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await workflowServiceV2.getWorkflowDetails(workflowId);

      if (workflowServiceV2.isSuccess(response)) {
        const { nodes, ...details } = response.data;

        // 从节点数据中提取边（使用工具函数，支持特殊节点的端口信息）
        const edges = extractEdgesFromNodes(nodes);

        const newData: WorkflowDataV2 = {
          nodeList: nodes,
          edgeList: edges,
          lastSavedVersion: Date.now().toString(),
          isDirty: false,
        };

        setWorkflowData(newData);
        lastSavedData.current = deepClone(newData);

        // 重置历史
        setHistoryStack([]);
        setHistoryIndex(-1);
      } else {
        throw new Error(response.message || '获取工作流数据失败');
      }
    } catch (error) {
      console.error('[V2] 刷新数据失败:', error);
      message.error('获取工作流数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);

  // ==================== 重置 ====================

  /**
   * 重置数据
   */
  const reset = useCallback(() => {
    setWorkflowData({
      nodeList: [],
      edgeList: [],
      lastSavedVersion: '',
      isDirty: false,
    });
    setHistoryStack([]);
    setHistoryIndex(-1);
    saveRetryCount.current = 0;
    lastSavedData.current = null;
  }, []);

  // ==================== 副作用 ====================

  // 初始化加载数据
  useEffect(() => {
    if (workflowId) {
      refreshData();
    }

    return () => {
      // 清理
      debouncedSave.cancel();
    };
  }, [workflowId]);

  // 页面卸载前保存
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (workflowData.isDirty) {
        e.preventDefault();
        e.returnValue = '您有未保存的更改，确定要离开吗？';

        // 尝试保存
        saveNow();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [workflowData.isDirty, saveNow]);

  // ==================== 返回值 ====================

  return {
    // 数据状态
    workflowData,
    isLoading,
    isSaving,
    isDirty,

    // 节点操作
    addNode,
    updateNode,
    deleteNode,
    getNodeById,

    // 边操作
    addEdge,
    deleteEdge,
    getEdgesByNodeId,

    // 批量操作
    batchUpdate,

    // 数据刷新
    refreshData,

    // 保存操作
    saveNow,

    // 历史操作
    canUndo,
    canRedo,
    undo,
    redo,

    // 清理
    reset,
  };
}

export default useWorkflowDataV2;
