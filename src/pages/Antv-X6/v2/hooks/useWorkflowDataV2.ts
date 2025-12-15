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
import type { AddNodeRequestV2 } from '../services/workflowV2';
import workflowServiceV2 from '../services/workflowV2';
import type {
  ChildNodeV2,
  EdgeV2,
  HistoryItemV2,
  WorkflowConfigV2,
  WorkflowDataV2,
  WorkflowMetadataV2,
} from '../types';
import { ExceptionHandleTypeEnumV2, HistoryActionTypeV2 } from '../types';
import { extractEdgesFromNodes } from '../utils/graphV2';
import { generateNodeId } from '../utils/nodeIdGenerator';
import { syncNodesFromEdges } from '../utils/syncNodesFromEdges';

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
  addNode: (node: ChildNodeV2) => Promise<ChildNodeV2>;
  updateNode: (nodeId: number, updates: Partial<ChildNodeV2>) => void;
  deleteNode: (nodeId: number) => void;
  getNodeById: (nodeId: number) => ChildNodeV2 | undefined;

  // 边操作
  addEdge: (edge: EdgeV2) => void;
  deleteEdge: (
    source: string,
    target: string,
    sourcePort?: string,
    targetPort?: string,
  ) => void;
  getEdgesByNodeId: (nodeId: number) => EdgeV2[];

  // 批量操作
  batchUpdate: (updates: {
    nodes?: { id: number; updates: Partial<ChildNodeV2> }[];
    addEdges?: EdgeV2[];
    deleteEdges?: {
      source: string;
      target: string;
      sourcePort?: string;
      targetPort?: string;
    }[];
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
  // 使用 ref 跟踪 isDirty 状态，避免异步更新导致的问题
  const isDirtyRef = useRef(false);
  // 使用 ref 存储最新的 workflowData，避免闭包问题
  const workflowDataRef = useRef(workflowData);

  // 同步更新 ref
  useEffect(() => {
    workflowDataRef.current = workflowData;
  }, [workflowData]);

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
      const restoredData = {
        ...prevHistory.data.before,
        isDirty: true,
      };
      setWorkflowData(restoredData);
      isDirtyRef.current = true;
      workflowDataRef.current = restoredData;
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
      const restoredData = {
        ...nextHistory.data.after,
        isDirty: true,
      };
      setWorkflowData(restoredData);
      isDirtyRef.current = true;
      workflowDataRef.current = restoredData;
      setHistoryIndex((prev) => prev + 1);
    }
  }, [canRedo, historyStack, historyIndex]);

  // ==================== 保存操作 ====================

  /**
   * 构建工作流配置数据（按照初始化接口返回的数据结构）
   */
  const buildWorkflowConfig = useCallback((): WorkflowConfigV2 | null => {
    // 使用 ref 获取最新的 workflowData，避免闭包问题
    const currentData = workflowDataRef.current;

    // 在保存前，从 edgeList 同步更新所有节点的 nextNodeIds
    // 确保保存的数据准确反映当前的连线状态
    const syncedNodes = syncNodesFromEdges(
      currentData.nodeList,
      currentData.edgeList,
    );

    // 获取开始节点（从同步后的 nodeList 中查找 Start 类型节点，或使用元数据中的 startNode）
    const startNode =
      syncedNodes.find((n) => n.type === 'Start') ||
      currentData.metadata?.startNode;

    // 获取结束节点（从同步后的 nodeList 中查找 End 类型节点，或使用元数据中的 endNode）
    const endNode =
      syncedNodes.find((n) => n.type === 'End') ||
      currentData.metadata?.endNode;

    if (!startNode || !endNode) {
      console.warn('[V2] 缺少开始节点或结束节点，无法构建工作流配置');
      return null;
    }

    // 从同步后的节点列表中获取更新后的 startNode 和 endNode
    const syncedStartNode =
      syncedNodes.find((n) => n.id === startNode.id) || startNode;
    const syncedEndNode =
      syncedNodes.find((n) => n.id === endNode.id) || endNode;

    // 从 startNode 的 nodeConfig.inputArgs 提取工作流级别的 inputArgs
    const inputArgs = syncedStartNode.nodeConfig?.inputArgs || [];

    // 从 endNode 的 nodeConfig.outputArgs 提取工作流级别的 outputArgs
    const outputArgs = syncedEndNode.nodeConfig?.outputArgs || [];

    // 构建符合初始化接口返回结构的工作流配置
    const workflowConfig: WorkflowConfigV2 = {
      id: workflowId,
      spaceId: currentData.metadata?.spaceId || 0,
      name: currentData.metadata?.name || '',
      functionName: null,
      description: currentData.metadata?.description || null,
      icon: currentData.metadata?.icon || '',
      startNode: syncedStartNode,
      endNode: syncedEndNode,
      inputArgs,
      outputArgs,
      nodes: syncedNodes, // 使用同步后的节点列表
      extension: currentData.metadata?.extension,
      category: currentData.metadata?.category,
      version: currentData.metadata?.version,
    };

    return workflowConfig;
  }, [workflowId]);

  /**
   * 执行保存
   */
  const doSave = useCallback(async (): Promise<boolean> => {
    // 使用 ref 检查 isDirty，避免异步状态更新导致的问题
    console.log(
      '[V2] doSave 被调用，isSaving:',
      isSaving,
      'isDirtyRef.current:',
      isDirtyRef.current,
      'workflowData.isDirty:',
      workflowData.isDirty,
    );
    if (isSaving || !isDirtyRef.current) {
      console.log(
        '[V2] doSave 跳过：',
        isSaving ? '正在保存中' : '没有未保存的更改',
      );
      return true;
    }

    setIsSaving(true);

    // 构建工作流配置数据
    const workflowConfig = buildWorkflowConfig();

    if (!workflowConfig) {
      message.error('无法构建工作流配置，请检查开始节点和结束节点');
      setIsSaving(false);
      return false;
    }

    // 构建保存请求数据
    const savePayload = {
      workflowConfig,
    };

    // 使用 ref 获取最新的 workflowData
    const currentData = workflowDataRef.current;

    // 打印全量数据以便确认（后端接口未就绪时用于调试）
    console.group('[V2] 工作流保存数据（整体配置）');
    console.log('📦 完整保存请求:', JSON.stringify(savePayload, null, 2));
    console.log('📊 节点总数:', currentData.nodeList.length);
    console.log('🔗 边总数:', currentData.edgeList.length);
    console.log('📝 工作流元数据:', currentData.metadata);
    console.log('📥 输入参数数量:', workflowConfig.inputArgs.length);
    console.log('📤 输出参数数量:', workflowConfig.outputArgs.length);
    console.groupEnd();

    try {
      const response = await workflowServiceV2.saveWorkflowConfig(savePayload);

      // 检查响应 code 是否为 '0000'
      if (workflowServiceV2.isSuccess(response)) {
        // 保存成功
        const version = response.data?.version || Date.now().toString();

        setWorkflowData((prev) => {
          const updated = {
            ...prev,
            lastSavedVersion: version,
            isDirty: false,
          };
          workflowDataRef.current = updated;
          return updated;
        });
        isDirtyRef.current = false;

        lastSavedData.current = deepClone(workflowDataRef.current);
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
  }, [workflowId, isSaving, onSaveSuccess, onSaveError, buildWorkflowConfig]);

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
   * 先调用接口添加节点，如果失败则前端自己生成 node.id
   */
  const addNode = useCallback(
    async (node: ChildNodeV2): Promise<ChildNodeV2> => {
      // 构建接口请求参数
      const addNodeRequest: AddNodeRequestV2 = {
        workflowId,
        type: node.type,
        loopNodeId: node.loopNodeId,
        typeId: node.typeId,
        extension: node.nodeConfig?.extension
          ? {
              x: node.nodeConfig.extension.x || 0,
              y: node.nodeConfig.extension.y || 0,
              width: node.nodeConfig.extension.width,
              height: node.nodeConfig.extension.height,
            }
          : undefined,
        nodeConfigDto: node.nodeConfig?.knowledgeBaseConfigs
          ? {
              knowledgeBaseConfigs: node.nodeConfig.knowledgeBaseConfigs.map(
                (kb) => ({
                  knowledgeBaseId: kb.knowledgeBaseId || 0,
                  name: kb.name || '',
                  description: kb.description || '',
                  icon: '', // 接口需要但 CreatedNodeItemV2 中没有，使用空字符串
                  type: kb.type || '',
                }),
              ),
            }
          : node.nodeConfig?.toolName || node.nodeConfig?.mcpId
          ? {
              toolName: node.nodeConfig.toolName,
              mcpId: node.nodeConfig.mcpId,
            }
          : undefined,
      };

      let finalNode: ChildNodeV2 = node;

      try {
        // 调用接口添加节点
        const response = await workflowServiceV2.addNode(addNodeRequest);

        if (workflowServiceV2.isSuccess(response) && response.data) {
          // 接口成功，使用接口返回的节点数据
          const apiNode = response.data;
          finalNode = {
            ...node,
            id: apiNode.id,
            name: apiNode.name || node.name,
            description: apiNode.description || node.description,
            workflowId: apiNode.workflowId || workflowId,
            nodeConfig: {
              ...node.nodeConfig,
              ...apiNode.nodeConfig,
            },
            nextNodeIds: apiNode.nextNodeIds,
            preNodes: apiNode.preNodes,
            loopNodeId: apiNode.loopNodeId,
            innerStartNodeId: apiNode.innerStartNodeId,
            innerEndNodeId: apiNode.innerEndNodeId,
            innerNodes: apiNode.innerNodes,
            icon: apiNode.icon || node.icon,
            created: apiNode.created,
            modified: apiNode.modified,
          };
        } else {
          // 接口失败，前端自己生成 node.id
          console.warn(
            '[V2] 添加节点接口失败，使用前端生成的 ID:',
            response.message,
          );
          const generatedId = generateNodeId(workflowId);
          finalNode = {
            ...node,
            id: generatedId,
          };
          message.warning('添加节点失败，已使用临时 ID');
        }
      } catch (error) {
        // 接口调用异常，前端自己生成 node.id
        console.error('[V2] 添加节点接口异常:', error);
        const generatedId = generateNodeId(workflowId);
        finalNode = {
          ...node,
          id: generatedId,
        };
        message.warning('添加节点失败，已使用临时 ID');
      }

      // 更新状态
      setWorkflowData((prev) => {
        const beforeData = deepClone(prev);
        const newNodeList = [...prev.nodeList, finalNode];
        const afterData = {
          ...prev,
          nodeList: newNodeList,
          isDirty: true,
        };

        recordHistory(HistoryActionTypeV2.ADD_NODE, beforeData, afterData);

        // 同步更新 ref
        isDirtyRef.current = true;
        workflowDataRef.current = afterData;

        return afterData;
      });

      // 触发自动保存（在状态更新后）
      if (AUTO_SAVE_CONFIG_V2.enabled) {
        setTimeout(() => {
          throttledSave();
        }, 0);
      }

      return finalNode;
    },
    [workflowId, recordHistory, throttledSave],
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

        // 同步更新 ref
        isDirtyRef.current = true;
        workflowDataRef.current = afterData;

        return afterData;
      });

      // 触发自动保存（使用防抖，适合频繁更新）
      if (AUTO_SAVE_CONFIG_V2.enabled) {
        setTimeout(() => {
          debouncedSave();
        }, 0);
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

        // 同步更新 ref
        isDirtyRef.current = true;
        workflowDataRef.current = afterData;

        return afterData;
      });

      // 触发自动保存（在状态更新后）
      if (AUTO_SAVE_CONFIG_V2.enabled) {
        setTimeout(() => {
          throttledSave();
        }, 0);
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
        const normalizedEdge: EdgeV2 = {
          ...edge,
          sourcePort: edge.sourcePort,
          targetPort: edge.targetPort,
        };

        // 检查是否已存在（包含端口信息以支持异常/特殊端口）
        const exists = prev.edgeList.some(
          (e) =>
            e.source === normalizedEdge.source &&
            e.target === normalizedEdge.target &&
            (e.sourcePort || '') === (normalizedEdge.sourcePort || '') &&
            (e.targetPort || '') === (normalizedEdge.targetPort || ''),
        );
        if (exists) return prev;

        const beforeData = deepClone(prev);
        const isExceptionEdge = (normalizedEdge.sourcePort || '').includes(
          'exception',
        );
        const sourceNodeId = parseInt(normalizedEdge.source, 10);
        const targetNodeId = parseInt(normalizedEdge.target, 10);

        const newNodeList = prev.nodeList.map((node) => {
          if (node.id !== sourceNodeId) {
            return node;
          }

          if (isExceptionEdge) {
            const currentConfig = node.nodeConfig?.exceptionHandleConfig || {
              timeout: node.nodeConfig?.exceptionHandleConfig?.timeout ?? 180,
              retryCount:
                node.nodeConfig?.exceptionHandleConfig?.retryCount ?? 0,
              exceptionHandleType:
                node.nodeConfig?.exceptionHandleConfig?.exceptionHandleType ??
                ExceptionHandleTypeEnumV2.EXECUTE_EXCEPTION_FLOW,
            };
            const currentIds = currentConfig.exceptionHandleNodeIds || [];
            if (currentIds.includes(targetNodeId)) {
              return node;
            }

            return {
              ...node,
              nodeConfig: {
                ...node.nodeConfig,
                exceptionHandleConfig: {
                  ...currentConfig,
                  exceptionHandleType:
                    currentConfig.exceptionHandleType ||
                    ExceptionHandleTypeEnumV2.EXECUTE_EXCEPTION_FLOW,
                  exceptionHandleNodeIds: [...currentIds, targetNodeId],
                  specificContent:
                    currentConfig.exceptionHandleType ===
                    ExceptionHandleTypeEnumV2.SPECIFIC_CONTENT
                      ? currentConfig.specificContent
                      : undefined,
                },
              },
            };
          }

          const nextNodeIds = node.nextNodeIds || [];
          if (!nextNodeIds.includes(targetNodeId)) {
            return {
              ...node,
              nextNodeIds: [...nextNodeIds, targetNodeId],
            };
          }

          return node;
        });

        const newEdgeList = [...prev.edgeList, normalizedEdge];

        const afterData = {
          ...prev,
          nodeList: newNodeList,
          edgeList: newEdgeList,
          isDirty: true,
        };

        recordHistory(HistoryActionTypeV2.ADD_EDGE, beforeData, afterData);

        // 同步更新 ref
        isDirtyRef.current = true;
        // 同步更新 workflowDataRef
        workflowDataRef.current = afterData;

        // 在状态更新回调中直接触发保存，避免闭包问题
        if (AUTO_SAVE_CONFIG_V2.enabled) {
          // 使用 setTimeout 确保在下一个事件循环中执行
          setTimeout(() => {
            console.log(
              '[V2] 边添加后触发保存，isDirtyRef.current:',
              isDirtyRef.current,
            );
            debouncedSave();
          }, 200);
        }

        return afterData;
      });
    },
    [recordHistory, debouncedSave],
  );

  /**
   * 删除边
   */
  const deleteEdge = useCallback(
    (
      source: string,
      target: string,
      sourcePort?: string,
      targetPort?: string,
    ) => {
      setWorkflowData((prev) => {
        const beforeData = deepClone(prev);

        const matchEdge = (e: EdgeV2) =>
          e.source === source &&
          e.target === target &&
          (e.sourcePort || '') === (sourcePort || '') &&
          (e.targetPort || '') === (targetPort || '');

        const existingEdge = prev.edgeList.find(matchEdge);
        const isExceptionEdge = (
          sourcePort ||
          existingEdge?.sourcePort ||
          ''
        ).includes('exception');

        const newEdgeList = prev.edgeList.filter((e) => !matchEdge(e));

        // 更新源节点的关联 ID
        const sourceNodeId = parseInt(source, 10);
        const targetNodeId = parseInt(target, 10);

        const newNodeList = prev.nodeList.map((node) => {
          if (node.id !== sourceNodeId) {
            return node;
          }

          if (isExceptionEdge) {
            const config = node.nodeConfig?.exceptionHandleConfig;
            if (!config?.exceptionHandleNodeIds) {
              return node;
            }
            const filtered = config.exceptionHandleNodeIds.filter(
              (id) => id !== targetNodeId,
            );
            if (filtered.length === config.exceptionHandleNodeIds.length) {
              return node;
            }

            return {
              ...node,
              nodeConfig: {
                ...node.nodeConfig,
                exceptionHandleConfig: {
                  ...config,
                  exceptionHandleNodeIds: filtered,
                },
              },
            };
          }

          if (node.nextNodeIds?.includes(targetNodeId)) {
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

        // 同步更新 ref
        isDirtyRef.current = true;
        // 同步更新 workflowDataRef
        workflowDataRef.current = afterData;

        // 在状态更新回调中直接触发保存，避免闭包问题
        if (AUTO_SAVE_CONFIG_V2.enabled) {
          // 使用 setTimeout 确保在下一个事件循环中执行
          setTimeout(() => {
            console.log(
              '[V2] 边删除后触发保存，isDirtyRef.current:',
              isDirtyRef.current,
            );
            debouncedSave();
          }, 200);
        }

        return afterData;
      });
    },
    [recordHistory, debouncedSave],
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
      deleteEdges?: {
        source: string;
        target: string;
        sourcePort?: string;
        targetPort?: string;
      }[];
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
              (e) =>
                e.source === edge.source &&
                e.target === edge.target &&
                (e.sourcePort || '') === (edge.sourcePort || '') &&
                (e.targetPort || '') === (edge.targetPort || ''),
            );
            if (!exists) {
              newEdgeList.push(edge);
            }
          });
        }

        // 批量删除边
        if (updates.deleteEdges) {
          updates.deleteEdges.forEach(
            ({
              source,
              target,
              sourcePort,
              targetPort,
            }: {
              source: string;
              target: string;
              sourcePort?: string;
              targetPort?: string;
            }) => {
              newEdgeList = newEdgeList.filter(
                (e) =>
                  !(
                    e.source === source &&
                    e.target === target &&
                    (e.sourcePort || '') === (sourcePort || '') &&
                    (e.targetPort || '') === (targetPort || '')
                  ),
              );
            },
          );
        }

        const afterData = {
          ...prev,
          nodeList: newNodeList,
          edgeList: newEdgeList,
          isDirty: true,
        };

        recordHistory(HistoryActionTypeV2.BATCH, beforeData, afterData);

        // 同步更新 ref
        isDirtyRef.current = true;
        workflowDataRef.current = afterData;

        return afterData;
      });

      // 触发自动保存（在状态更新后）
      if (AUTO_SAVE_CONFIG_V2.enabled) {
        setTimeout(() => {
          throttledSave();
        }, 0);
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
        const {
          nodes,
          name,
          description,
          spaceId,
          startNode,
          endNode,
          extension,
          category,
          version,
          modified,
          publishStatus,
          icon,
        } = response.data;

        // 从节点数据中提取边（使用工具函数，支持特殊节点的端口信息）
        const edges = extractEdgesFromNodes(nodes);

        // 保存工作流元数据，用于全量保存
        const metadata: WorkflowMetadataV2 = {
          name,
          description,
          spaceId,
          startNode,
          endNode,
          extension,
          category,
          version,
          modified,
          publishStatus,
          icon,
        };

        const newData: WorkflowDataV2 = {
          nodeList: nodes,
          edgeList: edges,
          lastSavedVersion: Date.now().toString(),
          isDirty: false,
          metadata,
        };

        console.log('[V2] 工作流元数据已保存:', metadata);

        setWorkflowData(newData);
        isDirtyRef.current = false;
        workflowDataRef.current = newData;
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
    const resetData = {
      nodeList: [],
      edgeList: [],
      lastSavedVersion: '',
      isDirty: false,
    };
    setWorkflowData(resetData);
    isDirtyRef.current = false;
    workflowDataRef.current = resetData;
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
      if (isDirtyRef.current) {
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
  }, [saveNow]);

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
