/**
 * V2 工作流主入口组件
 *
 * 新版工作流编辑器，采用前端数据驱动模式
 * 支持撤销/重做、全量保存、运行动画等功能
 *
 * 完全独立，不依赖 v1 任何代码
 */

import { LoadingOutlined } from '@ant-design/icons';
import { Form, message, Modal, Spin } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { history, useParams } from 'umi';

// V2 独立导入 - 类型
import type {
  ChildNodeV2,
  CreateNodeByPortOrEdgePropsV2,
  EdgeV2,
  GraphContainerRefV2,
  NodeConfigV2,
  StencilChildNodeV2,
  WorkflowDataV2,
} from './types';
import { AnswerTypeEnumV2, NodeTypeEnumV2 } from './types';

// V2 独立导入 - Hooks
import { useWorkflowDataV2 } from './hooks/useWorkflowDataV2';

// V2 独立导入 - 工具函数
import { calculateNewNodePosition, getNodeShape } from './utils/graphV2';
import { calculateNodePreviousArgs } from './utils/variableReferenceV2';
import { validateWorkflow, ValidationError } from './utils/workflowValidatorV2';

// V2 独立导入 - 组件
import NodeDrawerV2 from './components/drawer/NodeDrawerV2';
import ErrorListV2, { type ErrorItemV2 } from './components/error/ErrorListV2';
import GraphContainerV2 from './components/GraphContainerV2';
import ControlPanelV2 from './components/layout/ControlPanelV2';
import HeaderV2 from './components/layout/HeaderV2';
import StencilContentV2 from './components/layout/StencilContentV2';
import type { RunResult, RunStatus } from './components/modal';
import {
  CreateComponentModalV2,
  EditWorkflowModalV2,
  PublishModalV2,
  TestRunModalV2,
} from './components/modal';
import type { VersionInfo } from './components/version';
import { VersionHistoryV2 } from './components/version';

// V2 独立导入 - 服务
import workflowServiceV2, {
  TEST_RUN_ENDPOINT,
  type TestRunParamsV2,
} from './services/workflowV2';

// 公共工具
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { createSSEConnection } from '@/utils/fetchEventSource';
import { v4 as uuidv4 } from 'uuid';

// V2 独立导入 - 常量

import './indexV2.less';

// ==================== 组件实现 ====================

const WorkflowV2: React.FC = () => {
  const params = useParams() as { workflowId: string; spaceId: string };
  const workflowId = Number(params.workflowId);
  const _spaceId = Number(params.spaceId);

  // ==================== 状态管理 ====================

  // 使用 V2 数据管理 Hook
  const {
    workflowData,
    isLoading,
    isSaving,
    isDirty,
    addNode,
    updateNode,
    deleteNode,
    getNodeById,
    addEdge,
    deleteEdge,
    refreshData,
    saveNow,
    canUndo: _canUndo,
    canRedo: _canRedo,
    undo,
    redo,
  } = useWorkflowDataV2({
    workflowId,
    onSaveSuccess: () => {
      message.success('保存成功');
    },
    onSaveError: (error) => {
      message.error('保存失败: ' + (error?.message || '未知错误'));
    },
  });

  // 工作流基本信息
  const [workflowInfo, setWorkflowInfo] = useState<{
    name: string;
    description: string;
    modified?: string;
    publishStatus?: string;
    version?: string;
  }>({ name: '', description: '' });

  // 当前选中的节点
  const [selectedNode, setSelectedNode] = useState<ChildNodeV2 | null>(null);

  // 右侧抽屉是否显示
  const [drawerVisible, setDrawerVisible] = useState(false);

  // 历史状态
  const [historyState, setHistoryState] = useState({
    canUndo: false,
    canRedo: false,
  });

  // 缩放比例
  const [zoom, setZoom] = useState(1);

  // 校验错误
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );

  // 节点添加弹窗
  const [stencilVisible, setStencilVisible] = useState(false);

  // 端口点击添加节点弹窗状态
  const [portClickPopup, setPortClickPopup] = useState<{
    visible: boolean;
    sourceNode: ChildNodeV2 | null;
    targetNode?: ChildNodeV2 | null;
    portId: string;
    edgeId?: string;
    position: { x: number; y: number };
    isInLoop: boolean;
  }>({
    visible: false,
    sourceNode: null,
    portId: '',
    position: { x: 0, y: 0 },
    isInLoop: false,
  });

  // 弹窗状态
  const [testRunModalVisible, setTestRunModalVisible] = useState(false);
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [editWorkflowModalVisible, setEditWorkflowModalVisible] =
    useState(false);
  const [createComponentModalVisible, setCreateComponentModalVisible] =
    useState(false);
  const [versionHistoryVisible, setVersionHistoryVisible] = useState(false);

  // 试运行状态
  const [runStatus, setRunStatus] = useState<RunStatus>('idle');
  const [runResult, setRunResult] = useState<RunResult | undefined>();

  // 错误列表
  const [errorList, setErrorList] = useState<ErrorItemV2[]>([]);
  const [errorListVisible, setErrorListVisible] = useState(false);

  // 试运行 SSE 连接中止函数
  const abortTestRunRef = useRef<(() => void) | null>(null);

  // 版本历史
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  // 表单
  const [form] = Form.useForm<NodeConfigV2>();

  // Refs
  const graphRef = useRef<GraphContainerRefV2>(null);
  // 标记是否正在初始化表单（防止初始化时的 onValuesChange 覆盖原有数据）
  const isInitializingFormRef = useRef(false);
  // 存储初始化超时 ID，用于快速切换节点时清除旧超时
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ==================== 初始化 ====================

  // 同步工作流基础信息（避免重复请求）
  useEffect(() => {
    const metadata = workflowData.metadata;
    if (metadata) {
      setWorkflowInfo((prev) => ({
        name: metadata.name ?? prev.name ?? '',
        description: metadata.description ?? prev.description ?? '',
        modified: metadata.modified ?? prev.modified,
        publishStatus: metadata.publishStatus ?? prev.publishStatus,
        version: metadata.version ?? prev.version,
      }));
    }
  }, [workflowData.metadata]);

  // 初始校验
  useEffect(() => {
    if (workflowData && workflowData.nodeList.length > 0) {
      const result = validateWorkflow(workflowData);
      setValidationErrors(result.errors);
    }
  }, [workflowData]);

  // ==================== 节点操作 ====================

  /**
   * 选中节点
   */
  const handleNodeSelect = useCallback(
    (node: ChildNodeV2 | null) => {
      console.log('[V2 DEBUG] handleNodeSelect called with:', {
        nodeId: node?.id,
        nodeType: node?.type,
        nodeConfig: node?.nodeConfig,
        exceptionHandleConfig: node?.nodeConfig?.exceptionHandleConfig,
      });
      // 清除旧的初始化超时（处理快速切换节点的情况）
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      setSelectedNode(node);
      if (node) {
        setDrawerVisible(true);
        // 标记开始初始化表单，防止 onValuesChange 触发覆盖原有数据
        isInitializingFormRef.current = true;
        form.setFieldsValue(node.nodeConfig);
        // 使用 setTimeout 确保表单初始化完成后再允许变更处理
        initTimeoutRef.current = setTimeout(() => {
          isInitializingFormRef.current = false;
          initTimeoutRef.current = null;
        }, 100);

        // 计算变量引用
        const previousArgs = calculateNodePreviousArgs(node.id, workflowData);
        console.log('[V2] Node previous args:', previousArgs);
      } else {
        isInitializingFormRef.current = false;
        setDrawerVisible(false);
      }
    },
    [form, workflowData],
  );

  /**
   * 更新节点
   */
  const handleNodeChange = useCallback(
    (node: ChildNodeV2) => {
      updateNode(node.id, node);
    },
    [updateNode],
  );

  /**
   * 添加节点
   */
  const handleNodeAdd = useCallback(
    (node: ChildNodeV2) => {
      // 如果是循环节点，自动创建默认内置 Start/End 子节点（与 V1 对齐）
      const isLoopNode = node.type === NodeTypeEnumV2.Loop;
      const basePosition = node.nodeConfig?.extension || { x: 400, y: 300 };
      const baseX = basePosition.x ?? 400;
      const baseY = basePosition.y ?? 300;
      const enhancedLoopNode: ChildNodeV2 = (() => {
        if (!isLoopNode) return node;
        if (
          node.innerNodes &&
          node.innerNodes.length > 0 &&
          node.innerStartNodeId &&
          node.innerEndNodeId
        ) {
          return node;
        }
        // 使用父节点 ID 派生子节点 ID，保持与 v1 一致的稳定命名，避免时间戳导致的错连
        const startId = Number(`${node.id}01`);
        const endId = Number(`${node.id}02`);
        const innerStart: ChildNodeV2 = {
          id: startId,
          name: '循环开始',
          description: '',
          workflowId: node.workflowId,
          // 与 v1 一致：使用 LoopStart，具备 in/out 端口，确保 Loop -> innerStart 连线可用
          type: NodeTypeEnumV2.LoopStart,
          shape: getNodeShape(NodeTypeEnumV2.LoopStart),
          icon: '',
          loopNodeId: node.id,
          nodeConfig: {
            extension: {
              x: baseX + 72,
              y: baseY + 48,
            },
          },
          nextNodeIds: [endId],
        };
        const innerEnd: ChildNodeV2 = {
          id: endId,
          name: '循环结束',
          description: '',
          workflowId: node.workflowId,
          // 与 v1 一致：使用 LoopEnd，保留 in/out 端口，方便内部结束到后续节点连线
          type: NodeTypeEnumV2.LoopEnd,
          shape: getNodeShape(NodeTypeEnumV2.LoopEnd),
          icon: '',
          loopNodeId: node.id,
          nodeConfig: {
            extension: {
              x: baseX + 72,
              y: baseY + 168,
            },
          },
          nextNodeIds: [],
        };
        return {
          ...node,
          innerNodes: [innerStart, innerEnd],
          innerStartNodeId: startId,
          innerEndNodeId: endId,
        };
      })();

      // 1. 更新数据层
      addNode(enhancedLoopNode);
      if (isLoopNode && enhancedLoopNode.innerStartNodeId) {
        // 与 v1 对齐：Loop 的 in 端口作为 source，连到内部开始节点的 in
        addEdge({
          source: enhancedLoopNode.id.toString(),
          target: enhancedLoopNode.innerStartNodeId.toString(),
          sourcePort: `${enhancedLoopNode.id}-in`,
          targetPort: `${enhancedLoopNode.innerStartNodeId}-in`,
          zIndex: 25,
        });
      }
      if (
        isLoopNode &&
        enhancedLoopNode.innerStartNodeId &&
        enhancedLoopNode.innerEndNodeId
      ) {
        addEdge({
          source: enhancedLoopNode.innerStartNodeId.toString(),
          target: enhancedLoopNode.innerEndNodeId.toString(),
          sourcePort: `${enhancedLoopNode.innerStartNodeId}-out`,
          targetPort: `${enhancedLoopNode.innerEndNodeId}-in`,
          zIndex: 25,
        });
        // 与 v1 对齐：内部结束节点连回 Loop 的 out 端口，形成完整闭环
        addEdge({
          source: enhancedLoopNode.innerEndNodeId.toString(),
          target: enhancedLoopNode.id.toString(),
          sourcePort: `${enhancedLoopNode.innerEndNodeId}-out`,
          targetPort: `${enhancedLoopNode.id}-out`,
          zIndex: 25,
        });
      }

      // 2. 同步到画布
      // graphAddNode 会自动处理循环节点的子节点渲染（addLoopChildNodes）
      const position = enhancedLoopNode.nodeConfig?.extension || {
        x: 400,
        y: 300,
      };
      const posX = position.x ?? 400;
      const posY = position.y ?? 300;
      graphRef.current?.graphAddNode({ x: posX, y: posY }, enhancedLoopNode);

      // 循环节点：添加内部边到画布（子节点已由 graphAddNode -> addLoopChildNodes 处理）
      if (isLoopNode && enhancedLoopNode.innerStartNodeId) {
        graphRef.current?.graphCreateNewEdge(
          enhancedLoopNode.id.toString(),
          enhancedLoopNode.innerStartNodeId.toString(),
          true,
          `${enhancedLoopNode.id}-in`,
          `${enhancedLoopNode.innerStartNodeId}-in`,
        );
      }
      if (
        isLoopNode &&
        enhancedLoopNode.innerStartNodeId &&
        enhancedLoopNode.innerEndNodeId
      ) {
        graphRef.current?.graphCreateNewEdge(
          enhancedLoopNode.innerStartNodeId.toString(),
          enhancedLoopNode.innerEndNodeId.toString(),
          true,
          `${enhancedLoopNode.innerStartNodeId}-out`,
          `${enhancedLoopNode.innerEndNodeId}-in`,
        );
        graphRef.current?.graphCreateNewEdge(
          enhancedLoopNode.innerEndNodeId.toString(),
          enhancedLoopNode.id.toString(),
          true,
          `${enhancedLoopNode.innerEndNodeId}-out`,
          `${enhancedLoopNode.id}-out`,
        );
      }

      // 3. 选中新添加的节点
      setSelectedNode(enhancedLoopNode);
      setDrawerVisible(true);
      form.setFieldsValue(enhancedLoopNode.nodeConfig);
    },
    [addNode, addEdge, form],
  );

  /**
   * 删除节点
   */
  const handleNodeDelete = useCallback(
    (nodeId: number, _node?: ChildNodeV2) => {
      deleteNode(nodeId);
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
        setDrawerVisible(false);
      }
    },
    [deleteNode, selectedNode],
  );

  /**
   * 复制节点
   */
  const handleNodeCopy = useCallback(
    (node: ChildNodeV2) => {
      // 创建节点副本
      const newNode: ChildNodeV2 = {
        ...node,
        id: Date.now(), // 临时 ID，实际应由后端生成
        name: `${node.name} (副本)`,
        nodeConfig: {
          ...node.nodeConfig,
          extension: {
            ...node.nodeConfig?.extension,
            x: (node.nodeConfig?.extension?.x || 0) + 50,
            y: (node.nodeConfig?.extension?.y || 0) + 50,
          },
        },
        nextNodeIds: [],
      };

      handleNodeAdd(newNode);
      message.success('节点已复制');
    },
    [handleNodeAdd],
  );

  // ==================== 边操作 ====================

  /**
   * 添加边
   */
  const handleEdgeAdd = useCallback(
    (edge: EdgeV2) => {
      addEdge(edge);
    },
    [addEdge],
  );

  /**
   * 删除边
   */
  const handleEdgeDelete = useCallback(
    (edge: EdgeV2) => {
      deleteEdge(edge.source, edge.target, edge.sourcePort, edge.targetPort);
    },
    [deleteEdge],
  );

  // ==================== 图形操作 ====================

  /**
   * 缩放变化
   */
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  /**
   * 放大
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleZoomIn = useCallback(() => {
    graphRef.current?.graphChangeZoom(Math.min(zoom + 0.1, 3));
  }, [zoom]);

  /**
   * 缩小
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleZoomOut = useCallback(() => {
    graphRef.current?.graphChangeZoom(Math.max(zoom - 0.1, 0.2));
  }, [zoom]);

  /**
   * 适应画布
   */
  const handleFitView = useCallback(() => {
    graphRef.current?.graphChangeZoomToFit();
  }, []);

  /**
   * 历史状态变化
   */
  const handleHistoryChange = useCallback(
    (canUndoNow: boolean, canRedoNow: boolean) => {
      setHistoryState({ canUndo: canUndoNow, canRedo: canRedoNow });
    },
    [],
  );

  /**
   * 点击空白区域
   */
  const handleClickBlank = useCallback(() => {
    // 保存当前编辑的节点
    if (selectedNode && drawerVisible) {
      const values = form.getFieldsValue(true);
      updateNode(selectedNode.id, {
        ...selectedNode,
        nodeConfig: { ...selectedNode.nodeConfig, ...values },
      });
    }
    setSelectedNode(null);
    setDrawerVisible(false);
    setStencilVisible(false);
  }, [selectedNode, drawerVisible, form, updateNode]);

  /**
   * 通过端口或边创建节点
   */
  const handleCreateNodeByPortOrEdge = useCallback(
    (config: CreateNodeByPortOrEdgePropsV2) => {
      const { child, sourceNode, portId, targetNode, edgeId } = config;

      // 计算新节点位置
      const newPosition = calculateNewNodePosition(
        sourceNode,
        portId,
        child.type,
      );

      // 创建新节点
      const newNode: ChildNodeV2 = {
        id: Date.now(), // 临时 ID
        name: child.name || child.type,
        description: child.description || '',
        workflowId,
        type: child.type,
        shape: getNodeShape(child.type),
        icon: child.icon || '',
        nodeConfig: {
          extension: newPosition,
        },
        loopNodeId: sourceNode.loopNodeId,
      };

      // 添加节点
      handleNodeAdd(newNode);

      // 判断是否是在边上创建节点
      if (targetNode && edgeId) {
        // 在边上创建节点：删除原边，插入新节点
        // 1. 先删除原来的边 (sourceNode -> targetNode)
        handleEdgeDelete({
          source: sourceNode.id.toString(),
          target: targetNode.id.toString(),
        });
        graphRef.current?.graphDeleteEdge(edgeId);

        // 2. 创建新的边: sourceNode -> newNode -> targetNode
        handleEdgeAdd({
          source: sourceNode.id.toString(),
          target: newNode.id.toString(),
        });
        graphRef.current?.graphCreateNewEdge(
          sourceNode.id.toString(),
          newNode.id.toString(),
        );

        handleEdgeAdd({
          source: newNode.id.toString(),
          target: targetNode.id.toString(),
        });
        graphRef.current?.graphCreateNewEdge(
          newNode.id.toString(),
          targetNode.id.toString(),
        );
      } else {
        // 端口点击创建节点：根据端口类型决定连线方向
        const isOutput = portId.endsWith('-out') || portId.includes('-out');
        if (isOutput) {
          // 输出端口：sourceNode -> newNode
          handleEdgeAdd({
            source: sourceNode.id.toString(),
            target: newNode.id.toString(),
          });
          graphRef.current?.graphCreateNewEdge(
            sourceNode.id.toString(),
            newNode.id.toString(),
          );
        } else {
          // 输入端口：newNode -> sourceNode
          handleEdgeAdd({
            source: newNode.id.toString(),
            target: sourceNode.id.toString(),
          });
          graphRef.current?.graphCreateNewEdge(
            newNode.id.toString(),
            sourceNode.id.toString(),
          );
        }
      }
    },
    [workflowId, handleNodeAdd, handleEdgeAdd, handleEdgeDelete],
  );

  /**
   * 初始化完成
   */
  const handleInit = useCallback(() => {
    console.log('[V2] Graph initialized');
  }, []);

  /**
   * 保护分支/意图/选项列表中的 uuid、nextNodeIds，不在表单里展示但需要持久化
   */
  const mergeListWithIdentity = useCallback(
    <T extends { uuid?: string; nextNodeIds?: number[] }>(
      prevList: T[] | undefined,
      nextList: Partial<T>[] | undefined,
    ): T[] | undefined => {
      if (!nextList) return prevList;
      const previous = prevList || [];
      return nextList.map((item, index) => {
        const matched =
          item.uuid !== undefined && item.uuid !== null && item.uuid !== ''
            ? previous.find((p) => p.uuid === item.uuid)
            : previous[index];
        const merged = {
          ...(matched || {}),
          ...item,
        } as T;
        if (!merged.uuid) {
          merged.uuid = matched?.uuid || uuidv4();
        }
        if (merged.nextNodeIds === undefined) {
          merged.nextNodeIds = matched?.nextNodeIds || [];
        }
        return merged;
      });
    },
    [],
  );

  const buildMergedNodeConfig = useCallback(
    (node: ChildNodeV2, formValues: NodeConfigV2): NodeConfigV2 => {
      // 辅助函数：深度合并对象，过滤掉 undefined 值
      const deepMergeObject = <T extends Record<string, any>>(
        original: T | undefined | null,
        updates: T | undefined | null,
      ): T | undefined => {
        if (!updates) return original as T | undefined;
        if (!original) {
          // 仅返回非 undefined 的字段
          const defined = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined),
          );
          return Object.keys(defined).length > 0 ? (defined as T) : undefined;
        }
        const definedUpdates = Object.fromEntries(
          Object.entries(updates).filter(([_, v]) => v !== undefined),
        );
        return { ...original, ...definedUpdates } as T;
      };

      // 过滤掉 formValues 顶层的 undefined 值，避免覆盖原有数据
      const definedFormValues = Object.fromEntries(
        Object.entries(formValues).filter(([_, v]) => v !== undefined),
      ) as Partial<NodeConfigV2>;

      const merged: NodeConfigV2 = {
        ...node.nodeConfig,
        ...definedFormValues,
      };

      // 深度合并嵌套对象
      merged.extension = deepMergeObject(
        node.nodeConfig?.extension,
        formValues.extension,
      );

      merged.exceptionHandleConfig = deepMergeObject(
        node.nodeConfig?.exceptionHandleConfig,
        formValues.exceptionHandleConfig,
      );

      merged.modelConfig = deepMergeObject(
        node.nodeConfig?.modelConfig,
        formValues.modelConfig,
      );

      // 数组字段：使用 mergeListWithIdentity 处理带 uuid 的列表
      if (formValues.conditionBranchConfigs) {
        merged.conditionBranchConfigs = mergeListWithIdentity(
          node.nodeConfig?.conditionBranchConfigs,
          formValues.conditionBranchConfigs,
        );
      }

      if (formValues.intentConfigs) {
        merged.intentConfigs = mergeListWithIdentity(
          node.nodeConfig?.intentConfigs,
          formValues.intentConfigs,
        );
      }

      const mergedAnswerType =
        formValues.answerType || node.nodeConfig?.answerType;
      if (formValues.options && mergedAnswerType === AnswerTypeEnumV2.SELECT) {
        merged.options = mergeListWithIdentity(
          node.nodeConfig?.options,
          formValues.options,
        );
      }

      return merged;
    },
    [mergeListWithIdentity],
  );

  // ==================== 抽屉操作 ====================

  /**
   * 关闭抽屉
   */
  const handleDrawerClose = useCallback(() => {
    // 保存当前编辑的节点
    if (selectedNode) {
      const values = form.getFieldsValue(true) as NodeConfigV2;
      const mergedConfig = buildMergedNodeConfig(selectedNode, values);
      updateNode(selectedNode.id, {
        ...selectedNode,
        nodeConfig: mergedConfig,
      });
    }
    setSelectedNode(null);
    setDrawerVisible(false);
  }, [selectedNode, form, updateNode, buildMergedNodeConfig]);

  /**
   * 节点配置变更
   */
  const handleNodeConfigChange = useCallback(
    (changedValues: any, allValues: NodeConfigV2) => {
      // 如果正在初始化表单，忽略变更事件
      if (isInitializingFormRef.current) {
        console.log('[V2 DEBUG] Ignoring form change during initialization');
        return;
      }
      console.log('[V2 DEBUG] handleNodeConfigChange called:', {
        changedValues,
        allValues,
        selectedNodeId: selectedNode?.id,
      });
      if (selectedNode) {
        const mergedConfig = buildMergedNodeConfig(selectedNode, allValues);
        console.log('[V2 DEBUG] mergedConfig:', mergedConfig);
        const updatedNode: ChildNodeV2 = {
          ...selectedNode,
          nodeConfig: mergedConfig,
        };
        console.log('[V2 DEBUG] updatedNode:', updatedNode);
        updateNode(selectedNode.id, updatedNode);
        // 同步更新 selectedNode 以便后续操作使用最新数据
        setSelectedNode(updatedNode);
        // 同步更新画布节点（端口/尺寸/失效边联动）- 传入完整 nodeConfig
        graphRef.current?.graphUpdateByFormData(
          changedValues,
          mergedConfig,
          selectedNode.id.toString(),
        );
      }
    },
    [selectedNode, updateNode, buildMergedNodeConfig],
  );

  // ==================== 工具栏操作 ====================

  /**
   * 返回
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBack = useCallback(() => {
    history.goBack();
  }, []);

  /**
   * 撤销
   */
  const handleUndo = useCallback(() => {
    undo();
    graphRef.current?.undo();
  }, [undo]);

  /**
   * 重做
   */
  const handleRedo = useCallback(() => {
    redo();
    graphRef.current?.redo();
  }, [redo]);

  /**
   * 手动保存
   */
  const handleManualSave = useCallback(async () => {
    const success = await saveNow();
    if (success) {
      message.success('保存成功');
    }
  }, [saveNow]);

  /**
   * 验证工作流
   */
  const handleValidate = useCallback(() => {
    const result = validateWorkflow(workflowData);
    setValidationErrors(result.errors);

    if (result.isValid) {
      message.success('工作流配置正确');
    } else {
      const errorCount = result.errors.filter(
        (e) => e.severity === 'error',
      ).length;
      message.error(`发现 ${errorCount} 个错误，请检查`);
    }

    return result;
  }, [workflowData]);

  /**
   * 点击错误项
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleErrorClick = useCallback(
    (error: ValidationError) => {
      if (error.nodeId) {
        const node = getNodeById(error.nodeId);
        if (node) {
          handleNodeSelect(node);
          // 定位到节点
          graphRef.current?.graphSelectNode(error.nodeId.toString());
        }
      }
    },
    [getNodeById, handleNodeSelect],
  );

  // ==================== 弹窗操作 ====================

  /**
   * 打开试运行
   */
  const handleOpenTestRun = useCallback(() => {
    // 先验证
    const validationResult = handleValidate();
    if (
      validationResult.errors.filter((e) => e.severity === 'error').length > 0
    ) {
      message.error('请先修复错误');
      return;
    }
    setTestRunModalVisible(true);
  }, [handleValidate]);

  /**
   * 执行试运行（使用 V1 SSE 接口）
   */
  const handleTestRun = useCallback(
    async (inputValues: Record<string, any>) => {
      const startTime = Date.now();
      const nodeResults: RunResult['nodeResults'] = [];

      try {
        setRunStatus('running');
        setRunResult(undefined);
        // 清空之前的错误列表
        setErrorList([]);
        setErrorListVisible(false);

        // 构建试运行参数
        const testRunParams: TestRunParamsV2 = {
          workflowId,
          params: inputValues,
          requestId: uuidv4(),
        };

        // 打印试运行参数以便调试
        console.group('[V2] 试运行参数');
        console.log('📤 请求参数:', JSON.stringify(testRunParams, null, 2));
        console.groupEnd();

        // 创建 SSE 连接
        const abortFn = await createSSEConnection({
          url: `${process.env.BASE_URL}${TEST_RUN_ENDPOINT}`,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`,
            Accept: 'application/json, text/plain, */*',
          },
          body: testRunParams,
          onMessage: (data) => {
            console.log('[V2] 试运行消息:', data);

            if (data?.data?.nodeId) {
              // 更新节点运行状态
              const nodeResult = {
                nodeId: data.data.nodeId.toString(),
                nodeName: data.data.nodeName || '',
                status:
                  data.data.status === 'SUCCESS'
                    ? ('success' as const)
                    : data.data.status === 'FAILED'
                    ? ('failed' as const)
                    : ('running' as const),
                output: data.data.result,
              };

              // 更新或添加节点结果
              const existingIndex = nodeResults.findIndex(
                (r) => r.nodeId === nodeResult.nodeId,
              );
              if (existingIndex >= 0) {
                nodeResults[existingIndex] = nodeResult;
              } else {
                nodeResults.push(nodeResult);
              }

              // 高亮当前运行的节点
              graphRef.current?.graphSelectNode(data.data.nodeId.toString());
            }

            // 检查是否完成
            if (
              data?.data?.status === 'SUCCESS' &&
              data?.event === 'workflow_finished'
            ) {
              setRunStatus('success');
              setRunResult({
                status: 'success',
                startTime,
                endTime: Date.now(),
                duration: Date.now() - startTime,
                nodeResults,
                finalOutput: data.data.result,
              });
              message.success('运行成功');
            } else if (data?.data?.status === 'FAILED') {
              setRunStatus('failed');
              setRunResult({
                status: 'failed',
                startTime,
                endTime: Date.now(),
                duration: Date.now() - startTime,
                nodeResults,
                error: data.data.errorMessage || '运行失败',
              });

              // 收集错误到错误列表
              const newError: ErrorItemV2 = {
                nodeId: data.data.nodeId,
                error: data.data.errorMessage || '运行失败',
                type: 'runtime',
              };
              setErrorList((prev) => [...prev, newError]);
              setErrorListVisible(true);

              message.error(
                '运行失败: ' + (data.data.errorMessage || '未知错误'),
              );
            }
          },
          onError: (error) => {
            console.error('[V2] 试运行错误:', error);
            setRunStatus('failed');
            setRunResult({
              status: 'failed',
              startTime,
              endTime: Date.now(),
              duration: Date.now() - startTime,
              nodeResults,
              error: error.message,
            });

            // 添加错误到错误列表
            setErrorList((prev) => [
              ...prev,
              { error: error.message, type: 'runtime' },
            ]);
            setErrorListVisible(true);

            message.error('运行失败: ' + error.message);
          },
          onOpen: () => {
            console.log('[V2] 试运行 SSE 连接已建立');
          },
          onClose: () => {
            console.log('[V2] 试运行 SSE 连接已关闭');
            abortTestRunRef.current = null;
          },
        });

        abortTestRunRef.current = abortFn;
      } catch (error: any) {
        console.error('[V2] 试运行异常:', error);
        setRunStatus('failed');
        setRunResult({
          status: 'failed',
          startTime,
          endTime: Date.now(),
          duration: Date.now() - startTime,
          nodeResults: [],
          error: error.message,
        });
        message.error('运行失败: ' + error.message);
      }
    },
    [workflowId],
  );

  /**
   * 停止运行
   */
  const handleStopRun = useCallback(async () => {
    try {
      // 中止 SSE 连接
      if (abortTestRunRef.current) {
        abortTestRunRef.current();
        abortTestRunRef.current = null;
      }
      setRunStatus('stopped');
      message.info('已停止运行');
    } catch (error: any) {
      message.error('停止失败: ' + error.message);
    }
  }, []);

  /**
   * 打开发布
   */
  const handleOpenPublish = useCallback(() => {
    // 先验证
    handleValidate();
    setPublishModalVisible(true);
  }, [handleValidate]);

  /**
   * 执行发布（使用 V1 接口）
   */
  const handlePublish = useCallback(
    async (data: { versionDescription: string; forcePublish: boolean }) => {
      try {
        // 打印发布参数以便调试
        console.group('[V2] 发布参数');
        console.log('📤 workflowId:', workflowId);
        console.log('📤 发布数据:', JSON.stringify(data, null, 2));
        console.groupEnd();

        // 调用 V1 发布接口
        const response = await workflowServiceV2.publishWorkflow({
          workflowId,
          description: data.versionDescription,
        });

        if (workflowServiceV2.isSuccess(response)) {
          message.success('发布成功');
          setPublishModalVisible(false);
          // 刷新工作流信息
          refreshData();
        } else {
          throw new Error(response.message || '发布失败');
        }
      } catch (error: any) {
        message.error('发布失败: ' + error.message);
        throw error;
      }
    },
    [workflowId, refreshData],
  );

  /**
   * 编辑工作流信息
   */
  const handleEditWorkflow = useCallback(
    async (data: { name: string; description?: string }) => {
      try {
        // TODO: 调用更新 API
        // await workflowServiceV2.updateWorkflow(workflowId, data);
        setWorkflowInfo((prev) => ({ ...prev, ...data }));
        message.success('保存成功');
        setEditWorkflowModalVisible(false);
      } catch (error: any) {
        message.error('保存失败: ' + error.message);
        throw error;
      }
    },
    [workflowId],
  );

  /**
   * 创建组件
   */
  const handleCreateComponent = useCallback(
    async (_data: {
      name: string;
      description?: string;
      category?: string;
    }) => {
      try {
        // TODO: 调用创建组件 API
        // await workflowServiceV2.createComponent(workflowId, data);
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 1000);
        });
        message.success('组件创建成功');
        setCreateComponentModalVisible(false);
      } catch (error: any) {
        message.error('创建失败: ' + error.message);
        throw error;
      }
    },
    [workflowId],
  );

  /**
   * 打开版本历史
   */
  const handleOpenVersionHistory = useCallback(async () => {
    setVersionHistoryVisible(true);
    setVersionsLoading(true);
    try {
      // TODO: 调用获取版本历史 API
      // const response = await workflowServiceV2.getVersionHistory(workflowId);
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 500);
      });
      setVersions([
        {
          id: '1',
          version: 'v1.0.0',
          description: '初始版本',
          createdAt: new Date().toISOString(),
          createdBy: 'Admin',
          isCurrent: true,
          isPublished: true,
        },
      ]);
    } catch (error) {
      message.error('加载版本历史失败');
    } finally {
      setVersionsLoading(false);
    }
  }, [workflowId]);

  /**
   * 版本回滚
   */
  const handleVersionRollback = useCallback(
    async (_versionId: string) => {
      try {
        // TODO: 调用回滚 API
        // await workflowServiceV2.rollback(workflowId, versionId);
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 1000);
        });
        message.success('回滚成功');
        refreshData();
      } catch (error: any) {
        message.error('回滚失败: ' + error.message);
      }
    },
    [workflowId, refreshData],
  );

  /**
   * 预览版本
   */
  const handleVersionPreview = useCallback((_versionId: string) => {
    // TODO: 实现版本预览
    message.info('版本预览功能开发中');
  }, []);

  // ==================== Stencil 操作 ====================

  /**
   * 打开添加节点面板
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleOpenStencil = useCallback(() => {
    setStencilVisible(true);
  }, []);

  /**
   * 端口点击 - 显示节点选择弹窗
   */
  const handlePortClick = useCallback(
    (
      sourceNode: ChildNodeV2,
      portId: string,
      position: { x: number; y: number },
      isInLoop: boolean,
    ) => {
      setPortClickPopup({
        visible: true,
        sourceNode,
        portId,
        position,
        isInLoop,
      });
    },
    [],
  );

  /**
   * 边上按钮点击 - 显示节点选择弹窗（用于在边中间插入节点）
   */
  const handleEdgeButtonClick = useCallback(
    (
      sourceNode: ChildNodeV2,
      targetNode: ChildNodeV2,
      portId: string,
      edgeId: string,
      position: { x: number; y: number },
      isInLoop: boolean,
    ) => {
      setPortClickPopup({
        visible: true,
        sourceNode,
        targetNode,
        portId,
        edgeId,
        position,
        isInLoop,
      });
    },
    [],
  );

  /**
   * 关闭端口点击弹窗
   */
  const handleClosePortClickPopup = useCallback(() => {
    setPortClickPopup((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  /**
   * 端口点击弹窗中选择节点 - 创建节点并连线
   */
  const handlePortClickNodeSelect = useCallback(
    (template: StencilChildNodeV2) => {
      const {
        sourceNode,
        targetNode,
        portId,
        edgeId,
        position,
        isInLoop: _isInLoop,
      } = portClickPopup;

      if (!sourceNode) return;

      // 关闭弹窗
      handleClosePortClickPopup();

      // 调用创建节点逻辑
      handleCreateNodeByPortOrEdge({
        child: template,
        sourceNode,
        portId,
        position,
        targetNode: targetNode || undefined,
        edgeId,
      });
    },
    [portClickPopup, handleClosePortClickPopup, handleCreateNodeByPortOrEdge],
  );

  /**
   * 从 Stencil 添加节点
   */
  const handleStencilNodeAdd = useCallback(
    (template: StencilChildNodeV2) => {
      // 计算新节点位置（画布中心）
      const viewport = graphRef.current?.getCurrentViewPort();
      const x = viewport ? viewport.x + viewport.width / 2 - 100 : 400;
      const y = viewport ? viewport.y + viewport.height / 2 - 40 : 300;

      const newNode: ChildNodeV2 = {
        id: Date.now(),
        name: template.name || template.type,
        description: template.description || '',
        workflowId,
        type: template.type as NodeTypeEnumV2,
        shape: getNodeShape(template.type as NodeTypeEnumV2),
        icon: template.icon || '',
        nodeConfig: {
          extension: { x, y },
        },
      };

      handleNodeAdd(newNode);
      setStencilVisible(false);
    },
    [workflowId, handleNodeAdd],
  );

  // ==================== 渲染 ====================

  // 计算变量引用数据
  const referenceData = selectedNode
    ? calculateNodePreviousArgs(selectedNode.id, workflowData)
    : undefined;

  return (
    <div className="workflow-v2-container">
      {/* 顶部导航栏 */}
      <HeaderV2
        info={{
          name: workflowInfo.name || '未命名工作流',
          description: workflowInfo.description,
          publishStatus: workflowInfo.publishStatus,
          modified: workflowInfo.modified,
        }}
        isDirty={isDirty}
        isSaving={isSaving}
        canUndo={historyState.canUndo}
        canRedo={historyState.canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleManualSave}
        onPublish={handleOpenPublish}
        onEditInfo={() => setEditWorkflowModalVisible(true)}
        onOpenVersionHistory={handleOpenVersionHistory}
      />

      {/* 主体区域 */}
      <Spin spinning={isLoading} indicator={<LoadingOutlined spin />}>
        <div className="workflow-v2-body">
          {/* 图形容器 */}
          <div className="workflow-v2-graph-area">
            <GraphContainerV2
              ref={graphRef}
              workflowData={workflowData}
              onNodeChange={handleNodeChange}
              onNodeAdd={handleNodeAdd}
              onNodeDelete={handleNodeDelete}
              onNodeCopy={handleNodeCopy}
              onNodeSelect={handleNodeSelect}
              onEdgeAdd={handleEdgeAdd}
              onEdgeDelete={handleEdgeDelete}
              onZoomChange={handleZoomChange}
              onHistoryChange={handleHistoryChange}
              onClickBlank={handleClickBlank}
              onInit={handleInit}
              createNodeByPortOrEdge={handleCreateNodeByPortOrEdge}
              onPortClick={handlePortClick}
              onEdgeButtonClick={handleEdgeButtonClick}
            />

            {/* 左下角控制面板 */}
            <ControlPanelV2
              zoomSize={zoom}
              onZoomChange={(newZoom) =>
                graphRef.current?.graphChangeZoom(newZoom)
              }
              onZoomToFit={handleFitView}
              onAddNode={handleStencilNodeAdd}
              onTestRun={handleOpenTestRun}
            />

            {/* 错误列表面板 */}
            <ErrorListV2
              visible={errorListVisible}
              drawerVisible={drawerVisible}
              errorList={errorList}
              nodeList={workflowData.nodeList}
              onClose={() => setErrorListVisible(false)}
              onClickItem={(node) => {
                // 选中并高亮错误节点
                graphRef.current?.graphSelectNode(node.id.toString());
                setSelectedNode(node);
                setDrawerVisible(true);
              }}
            />

            {/* 节点添加面板 */}
            {stencilVisible && (
              <div className="workflow-v2-stencil-panel">
                <StencilContentV2 onAddNode={handleStencilNodeAdd} />
              </div>
            )}
          </div>

          {/* 右侧配置抽屉 */}
          <NodeDrawerV2
            open={drawerVisible}
            node={selectedNode}
            referenceData={referenceData}
            onClose={handleDrawerClose}
            onNodeConfigChange={handleNodeConfigChange}
            onNodeNameChange={(nodeId, name) => {
              const origin =
                (selectedNode && selectedNode.id === nodeId && selectedNode) ||
                workflowData.nodeList.find((n) => n.id === nodeId);
              if (!origin) return;
              const newData = { ...origin, name };
              setSelectedNode(newData);
              updateNode(nodeId, newData);
              graphRef.current?.graphUpdateNode(nodeId.toString(), newData);
              graphRef.current?.getGraphRef?.()?.trigger('node:custom:save', {
                data: newData,
                payload: { name },
              });
            }}
            onNodeDelete={handleNodeDelete}
            onNodeCopy={handleNodeCopy}
          />
        </div>
      </Spin>

      {/* 底部状态栏 */}
      <div className="workflow-v2-footer">
        <span>节点数: {workflowData.nodeList.length}</span>
        <span>边数: {workflowData.edgeList.length}</span>
        <span>缩放: {Math.round(zoom * 100)}%</span>
        {isSaving && <span className="saving">保存中...</span>}
        {isDirty && !isSaving && (
          <span className="unsaved">有未保存的更改</span>
        )}
      </div>

      {/* 试运行弹窗 */}
      <TestRunModalV2
        open={testRunModalVisible}
        onClose={() => setTestRunModalVisible(false)}
        workflowData={workflowData as WorkflowDataV2}
        onRun={handleTestRun}
        onStop={handleStopRun}
        runStatus={runStatus}
        runResult={runResult}
      />

      {/* 发布弹窗 */}
      <PublishModalV2
        open={publishModalVisible}
        onClose={() => setPublishModalVisible(false)}
        workflowData={workflowData as WorkflowDataV2}
        validationErrors={validationErrors}
        onPublish={handlePublish}
      />

      {/* 编辑工作流弹窗 */}
      <EditWorkflowModalV2
        open={editWorkflowModalVisible}
        onClose={() => setEditWorkflowModalVisible(false)}
        workflowData={
          {
            ...workflowData,
            name: workflowInfo.name,
            description: workflowInfo.description,
          } as WorkflowDataV2
        }
        onSave={handleEditWorkflow}
      />

      {/* 创建组件弹窗 */}
      <CreateComponentModalV2
        open={createComponentModalVisible}
        onClose={() => setCreateComponentModalVisible(false)}
        workflowData={
          {
            ...workflowData,
            name: workflowInfo.name,
            description: workflowInfo.description,
          } as WorkflowDataV2
        }
        onCreate={handleCreateComponent}
      />

      {/* 版本历史抽屉 */}
      <VersionHistoryV2
        open={versionHistoryVisible}
        onClose={() => setVersionHistoryVisible(false)}
        versions={versions}
        loading={versionsLoading}
        onRollback={handleVersionRollback}
        onPreview={handleVersionPreview}
      />

      {/* 端口/边点击添加节点弹窗 */}
      <Modal
        open={portClickPopup.visible}
        onCancel={handleClosePortClickPopup}
        footer={null}
        title={null}
        closable={false}
        width={280}
        maskClosable={true}
        centered
        destroyOnClose
        className="port-click-popup-modal"
      >
        <StencilContentV2
          onAddNode={handlePortClickNodeSelect}
          isLoop={portClickPopup.isInLoop}
        />
      </Modal>
    </div>
  );
};

export default WorkflowV2;
