/**
 * V3 工作流页面主入口
 *
 * 基于 V1 代码重构，解决前后端数据不同步问题
 * 核心改动：
 * - 使用统一代理层管理节点/边操作
 * - 组装全量数据后统一更新（以前端的画布上的节点及连线及相关数据属性为依据）
 * - 使用前端变量引用计算（替代 getOutputArgs 接口）
 * - 要支持 撤销/重做 操作（X6 提供）
 */

import Constant from '@/constants/codes.constants';
import { CREATED_TABS } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import {
  DEFAULT_DRAWER_FORM,
  SKILL_FORM_KEY,
} from '@/constants/node.constants';
import useDisableSaveShortcut from '@/hooks/useDisableSaveShortcut';
import useDrawerScroll from '@/hooks/useDrawerScroll';
import useModifiedSaveUpdate from '@/hooks/useModifiedSaveUpdate';
import { useThrottledCallback } from '@/hooks/useThrottledCallback';
import type { AddNodeResponse } from '@/services/workflow';
import service, { IgetDetails, ITestRun } from '@/services/workflow';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  AnswerTypeEnum,
  NodeShapeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import {
  FoldFormIdEnum,
  NodeSizeGetTypeEnum,
  PortGroupEnum,
  UpdateEdgeType,
} from '@/types/enums/node';
import { CreatedNodeItem, DefaultObjectType } from '@/types/interfaces/common';
import {
  ChildNode,
  CreateNodeByPortOrEdgeProps,
  CurrentNodeRefProps,
  GraphContainerRef,
  GraphRect,
  RunResultItem,
  StencilChildNode,
} from '@/types/interfaces/graph';
import {
  CurrentNodeRefKey,
  NodeConfig,
  TestRunParams,
} from '@/types/interfaces/node';
import { ErrorParams } from '@/types/interfaces/workflow';
import { cloneDeep, noop } from '@/utils/common';
import { createSSEConnection } from '@/utils/fetchEventSource';
import { calculateNodePosition, getCoordinates } from '@/utils/graph';
import {
  changeNodeConfig,
  updateCurrentNode,
  updateSkillComponentConfigs,
} from '@/utils/updateNode';
import {
  getNodeSize,
  getShape,
  getWorkflowTestRun,
  handleExceptionNodesNextIndex,
  handleSpecialNodesNextIndex,
  QuicklyCreateEdgeConditionConfig,
  removeWorkflowTestRun,
  setFormDefaultValues,
  setWorkflowTestRun,
} from '@/utils/workflow';
import { Graph } from '@antv/x6';
import { Form, message } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useModel, useParams } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import WorkflowLayout from './components/layout/WorkflowLayout';
// Components moved to WorkflowLayout
import './indexV3.less';

// V3 Hooks
import { useGraphInteraction } from './hooks/useGraphInteraction';
import { useWorkflowLifecycle } from './hooks/useWorkflowLifecycle';
import { useWorkflowPersistence } from './hooks/useWorkflowPersistence';

// V3 数据代理层
import { workflowProxy } from './services/workflowProxyV3';
import type { WorkflowDataV2 } from './types';
import { calculateNodePreviousArgs } from './utils/variableReferenceV3';

const workflowCreatedTabs = CREATED_TABS.filter((item) =>
  [
    AgentComponentTypeEnum.Plugin,
    AgentComponentTypeEnum.Workflow,
    AgentComponentTypeEnum.Table,
    AgentComponentTypeEnum.MCP,
  ].includes(item.key),
);

/**
 * 清理 VariableAggregation 节点的表单数据
 * 将扁平化的键（如 'variableGroups,0,inputs'）合并回嵌套结构
 * 并重新生成 inputArgs
 */
const cleanVariableAggregationFormValues = (values: any): any => {
  console.log(
    '[VariableAggregation] 输入的表单值:',
    JSON.stringify(values, null, 2),
  );

  const cleanedValues = { ...values };
  const variableGroups = [...(cleanedValues.variableGroups || [])];

  // 查找并合并扁平化的 inputs 键
  const flattenedKeyPattern = /^variableGroups,(\d+),inputs$/;
  const keysToDelete: string[] = [];

  Object.keys(cleanedValues).forEach((key) => {
    const match = key.match(flattenedKeyPattern);
    if (match) {
      const groupIndex = parseInt(match[1], 10);
      console.log(
        `[VariableAggregation] 找到扁平化键: ${key}, groupIndex: ${groupIndex}`,
      );
      console.log(
        `[VariableAggregation] 扁平化数据:`,
        JSON.stringify(cleanedValues[key], null, 2),
      );
      if (variableGroups[groupIndex]) {
        // 使用扁平化的完整数据替换嵌套结构中的 inputs
        variableGroups[groupIndex] = {
          ...variableGroups[groupIndex],
          inputs: cleanedValues[key],
        };
        console.log(
          `[VariableAggregation] 合并后的分组:`,
          JSON.stringify(variableGroups[groupIndex], null, 2),
        );
      }
      keysToDelete.push(key);
    }
  });

  console.log(
    `[VariableAggregation] 需要删除的扁平化键: ${keysToDelete.join(', ')}`,
  );

  // 删除扁平化的键
  keysToDelete.forEach((key) => {
    delete cleanedValues[key];
  });

  // 更新 variableGroups
  cleanedValues.variableGroups = variableGroups;

  // 重新生成 inputArgs（嵌套结构，每个分组作为一个条目，inputs 作为 subArgs）
  const inputArgs: any[] = variableGroups.map((group: any) => {
    const groupEntry: any = {
      key: group.id || group.name,
      name: group.name || '',
      dataType: group.dataType || 'String',
      description: `${group.name || 'Group'} ${group.dataType || 'String'}`,
      require: false,
      systemVariable: false,
      bindValue: '',
      bindValueType: '',
    };

    // 将 inputs 作为 subArgs
    if (Array.isArray(group.inputs) && group.inputs.length > 0) {
      groupEntry.subArgs = group.inputs.map((input: any) => ({
        key: input.key || input.name,
        name: input.name || '',
        dataType: input.dataType || 'String',
        description: input.description || '',
        require: input.require ?? false,
        systemVariable: input.systemVariable ?? false,
        bindValue: input.bindValue || '',
        bindValueType: input.bindValueType || 'Reference',
      }));
    }

    return groupEntry;
  });
  cleanedValues.inputArgs = inputArgs;

  console.log(
    '[VariableAggregation] 清理后的表单值:',
    JSON.stringify(cleanedValues, null, 2),
  );
  console.log(
    '[VariableAggregation] 生成的 inputArgs:',
    JSON.stringify(inputArgs, null, 2),
  );

  return cleanedValues;
};

const Workflow: React.FC = () => {
  const {
    getWorkflow,
    storeWorkflow,
    clearWorkflow,
    visible,
    setVisible,
    handleInitLoading,
    globalLoadingTime,
  } = useModel('workflowV3');

  const params = useParams();
  // 当前工作流的id
  const workflowId = Number(params.workflowId);
  const spaceId = Number(params.spaceId);
  // 当前被选中的节点
  const [foldWrapItem, setFoldWrapItem] =
    useState<ChildNode>(DEFAULT_DRAWER_FORM);

  // V3 Hooks Integration
  const {
    info,
    setInfo,
    graphParams,
    setGraphParams,
    onConfirm,
    refreshGraphData,
  } = useWorkflowLifecycle({
    workflowId,
    handleInitLoading,
  });

  // Alias refreshGraphData to getDetails for compatibility with existing code
  const getDetails = refreshGraphData;

  // Define changeUpdateTime for use in this component and hooks
  const changeUpdateTime = useCallback(() => {
    const _time = new Date();
    setInfo((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        modified: _time.toString(),
      };
    });
  }, [setInfo]);

  // 定义一个节点试运行返回值
  const [testRunResult, setTestRunResult] = useState<string>('');
  // 节点试运行
  const [stopWait, setStopWait] = useState<boolean>(false);
  // 打开和关闭发布弹窗
  const [showPublish, setShowPublish] = useState<boolean>(false);
  // 打开和关闭新增组件
  const [open, setOpen] = useState(false);
  // 展示修改工作流的弹窗
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  // 创建工作流，插件，知识库，数据库
  const [createdItem, setCreatedItem] = useState<AgentComponentTypeEnum>(
    AgentComponentTypeEnum.Plugin,
  );
  // 拖动节点到画布中的x和y
  const [dragEvent, setDragEvent] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [testRunLoading, setTestRunLoading] = useState<boolean>(false);
  // 当点击连接桩和边时，存储一些数据
  const currentNodeRef = useRef<CurrentNodeRefProps | null>(null);
  // 节点的form表单
  const [form] = Form.useForm<NodeConfig>();
  // 修改右侧抽屉的名称
  const [showNameInput, setShowNameInput] = useState<boolean>(false);
  // 针对问答节点，试运行的问答参数
  const [historyState, setHistoryState] = useState({
    canUndo: false,
    canRedo: false,
  });
  const [testRunParams, setTestRunParams] = useState<TestRunParams>({
    question: '',
    options: [],
  });
  // 针对问答节点条开始节点，参数丢失
  const [formItemValue, setFormItemValue] = useState<DefaultObjectType>({});
  // 错误列表的参数
  const [errorParams, setErrorParams] = useState<ErrorParams>({
    errorList: [],
    show: false,
  });
  // 发布前的校验
  const [isValidLoading, setIsValidLoading] = useState<boolean>(false);
  // 画布的ref
  const graphRef = useRef<GraphContainerRef>(null);
  // 阻止获取当前节点的上级参数
  const preventGetReference = useRef<number>(0);
  // 新增定时器引用
  const timerRef = useRef<NodeJS.Timeout>();
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  // 按钮是否处于loading
  const [loading, setLoading] = useState(false);
  // 是否显示创建工作流，插件，知识库，数据库的弹窗和试运行的弹窗
  const { setTestRun } = useModel('model');
  // 从useModel中获取到数据
  const {
    setReferenceList,
    setIsModified,
    skillChange,
    setSkillChange,
    isModified,
  } = useModel('workflowV3');

  // 使用 Hook 控制抽屉打开时的滚动条
  useDrawerScroll(showVersionHistory);

  // 全局禁用Ctrl+S/Cmd+S
  useDisableSaveShortcut();

  const updateCurrentNodeRef = useCallback(
    (key: CurrentNodeRefKey, updateNodeData: any) => {
      const _currentNode = updateCurrentNode(
        key,
        updateNodeData,
        currentNodeRef.current,
      );
      currentNodeRef.current = _currentNode;
    },
    [currentNodeRef],
  );

  /** -----------------  需要调用接口的方法  --------------------- */
  // 同步 foldWrapItem 到 model 中的 drawerForm
  useEffect(() => {
    // 直接使用 setDrawerForm 进行更新
    storeWorkflow('drawerForm', foldWrapItem);

    // V3: 当 foldWrapItem 变化时，同步更新表单数据
    // 确保 UI 显示与本地数据一致
    if (foldWrapItem && foldWrapItem.nodeConfig) {
      // 保留当前表单中的技能数据，避免被 foldWrapItem 覆盖
      const currentSkills = form.getFieldValue(SKILL_FORM_KEY);
      form.setFieldsValue(foldWrapItem.nodeConfig);
      // 如果当前表单有技能数据，恢复它（优先使用表单中的最新数据）
      if (Array.isArray(currentSkills) && currentSkills.length > 0) {
        form.setFieldValue(SKILL_FORM_KEY, currentSkills);
      }
    }

    if (skillChange) {
      // 处理技能变化时的表单更新
      setSkillChange(false);
    }
  }, [foldWrapItem]);

  // V3 Hooks Integration for Interaction
  // Moved here because it needs getReference which is defined below,
  // but getReference also needs graphRef...
  // Wait, component functions are hoisted or can be used if defined before usage.
  // getReference is defined below line 489. Hooks need it passed in.
  // The hook call must be at the top level.
  // I need to use `useCallback` for getReference wrapper or simpler,
  // let's define getReference BEFORE hooks if possible?
  // No, hooks must be at top. params to hooks can be functions defined later?
  // No, variables used in hook props must be defined before hook call.
  // Solution: I will define `getReference` using a ref or just keep `getReference` here
  // and pass `(id) => getReference(id)` to hook?
  // The closure will capture the function variable. BUT `getReference` is `const` so it's not hoisted.
  // I must move `getReference` definition UP, above the hook calls.

  // Or simpler: I can't move getReference up easily because it uses graphRef which is defined.
  // graphRef is defined at line 303.
  // Hooks are at line 250+.
  // Correct order:
  // 1. refs (graphRef etc)
  // 2. auxiliary functions (getReference - if it doesn't depend on other things)
  // 3. Hooks

  // For now, I will Comment out the removed functions and Add the Interaction Hook call after getReference is defined?
  // No, Hooks must be at top level unconditionally.
  // React allows hooks anywhere at top level.
  // I will move the hook calls DOWN, after `getReference` is defined.

  // 调整画布的大小（左下角select）
  const changeGraph = (val: number | string) => {
    if (val === -1) {
      graphRef.current?.graphChangeZoomToFit();
    } else {
      graphRef.current?.graphChangeZoom(val as number);
    }
  };
  // 调整画布的大小(滚轮)
  const changeZoom = (val: number) => {
    setInfo((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        extension: { size: val },
      };
    });
  };
  // 获取当前节点的参数 - V3 使用前端计算替代后端接口
  const getReference = async (id: number): Promise<boolean> => {
    if (id === FoldFormIdEnum.empty || preventGetReference.current === id)
      return false;

    // V3: 使用前端计算代替后端接口调用
    try {
      // 优先从画布获取最新节点数据（确保是最新编辑状态）
      let nodeList: any[] = [];
      let edgeList: any[] = [];

      const graph = graphRef.current?.getGraphRef?.();
      if (graph) {
        // 从画布直接获取节点数据
        nodeList = graph.getNodes().map((n: any) => {
          const data = n.getData();
          // 合并位置信息
          const position = n.getPosition();
          const size = n.getSize();
          return {
            ...data,
            nodeConfig: {
              ...data.nodeConfig,
              extension: {
                ...data.nodeConfig?.extension,
                x: position.x,
                y: position.y,
                width: size.width,
                height: size.height,
              },
            },
          };
        });

        // 从画布获取边数据
        edgeList = graph.getEdges().map((e: any) => ({
          id: e.id,
          source: e.getSourceCellId(),
          target: e.getTargetCellId(),
          sourcePort: (e.getSource() as any)?.port,
          targetPort: (e.getTarget() as any)?.port,
        }));
      } else {
        // 回退到 workflowProxy 数据
        const fullData = workflowProxy.getFullWorkflowData();
        nodeList = fullData?.nodes || graphParams.nodeList;
        edgeList = fullData?.edges || graphParams.edgeList;
      }

      if (!nodeList || nodeList.length === 0) {
        setReferenceList({
          previousNodes: [],
          innerPreviousNodes: [],
          argMap: {},
        });
        return false;
      }

      const workflowData: WorkflowDataV2 = {
        nodeList: nodeList as any,
        edgeList: edgeList as any,
        lastSavedVersion: '',
        isDirty: false,
      };

      const result = calculateNodePreviousArgs(id, workflowData);

      if (result && result.previousNodes && result.previousNodes.length) {
        setReferenceList({
          previousNodes: result.previousNodes as any,
          innerPreviousNodes: result.innerPreviousNodes as any,
          argMap: result.argMap as any,
        });
      } else {
        setReferenceList({
          previousNodes: [],
          innerPreviousNodes: [],
          argMap: {},
        });
      }
      return true;
    } catch (error) {
      console.error('[V3] 前端计算变量引用失败:', error);
      return false;
    }
  };
  // 获取当前节点数据
  const getNodeConfig = async (id: number) => {
    if (id === FoldFormIdEnum.empty) return;

    // V3: 优先从代理层获取数据（确保是最新状态）
    const node = workflowProxy.getNodeById(id);
    if (node) {
      setFoldWrapItem(cloneDeep(node));
    } else {
      // 降级尝试从接口获取
      try {
        const _res = await service.getNodeConfig(id);
        if (_res.code === Constant.success) {
          const data = _res.data;
          // 兜底：接口获取后同步到代理层与画布
          workflowProxy.updateNode(data);
          graphRef.current?.graphUpdateNode(String(data.id), data);
          setFoldWrapItem(data);
          changeUpdateTime();
        }
      } catch (e) {
        console.error('获取节点详情失败', e);
      }
    }
  };
  // 优化后的onFinish方法
  // V3 Hooks Integration for Persistence and Interaction
  const { saveFullWorkflow, debouncedSaveFullWorkflow, autoSaveNodeConfig } =
    useWorkflowPersistence({
      graphRef,
      changeUpdateTime,
      getReference: (id) => getReference(id),
      setFoldWrapItem,
    });

  const { nodeChangeEdge, changeNode } = useGraphInteraction({
    graphRef,
    debouncedSaveFullWorkflow,
    changeUpdateTime,
    getReference: (id) => getReference(id),
    setFoldWrapItem,
    getNodeConfig: (id) => getNodeConfig(id),
    updateCurrentNodeRef,
  });

  const onSaveWorkflow = useCallback(
    async (currentFoldWrapItem: ChildNode): Promise<boolean> => {
      let result = false;
      try {
        let values = form.getFieldsValue(true);

        console.log('[onSaveWorkflow] 节点类型:', currentFoldWrapItem.type);
        console.log('[onSaveWorkflow] 原始表单值 keys:', Object.keys(values));

        // 清理 VariableAggregation 节点的扁平化键
        if (currentFoldWrapItem.type === NodeTypeEnum.VariableAggregation) {
          console.log('[onSaveWorkflow] 开始清理 VariableAggregation 数据...');
          values = cleanVariableAggregationFormValues(values);
          console.log(
            '[onSaveWorkflow] 清理后表单值 keys:',
            Object.keys(values),
          );
        }

        let updateFormConfig;
        if (
          ([NodeTypeEnum.IntentRecognition, NodeTypeEnum.Condition].includes(
            currentFoldWrapItem.type,
          ) ||
            (currentFoldWrapItem.type === NodeTypeEnum.QA &&
              values.answerType === AnswerTypeEnum.SELECT)) &&
          currentFoldWrapItem.id === getWorkflow('drawerForm').id
        ) {
          const nodeConfig = changeNodeConfig(
            currentFoldWrapItem.type,
            values,
            currentFoldWrapItem.nodeConfig,
          );
          updateFormConfig = {
            ...currentFoldWrapItem,
            nodeConfig: {
              ...currentFoldWrapItem.nodeConfig,
              ...nodeConfig,
            },
          };
        } else {
          updateFormConfig = {
            ...currentFoldWrapItem,
            nodeConfig: {
              ...currentFoldWrapItem.nodeConfig,
              ...values,
            },
          };
          if (currentFoldWrapItem.type === NodeTypeEnum.QA) {
            updateFormConfig.nextNodeIds = [];
          }
        }
        result = await autoSaveNodeConfig(updateFormConfig);
      } catch (error) {
        console.error('表单提交失败:', error);
        result = false;
      }
      return result;
    },
    [form],
  );

  const doSubmitFormData = useCallback(async (): Promise<boolean> => {
    let result = false;
    // V3: 直接使用 skillChange 状态，而非 getWorkflow('skillChange')
    // 因为 workflow.ts 中有一个 bug，storeWorkflow('skillChange', visible) 存储了错误的值
    const hasSkillChange = skillChange;
    if (getWorkflow('isModified') === false) {
      // 即使没有修改，也要清除 skillChange 状态以停止 loading
      if (hasSkillChange) {
        setSkillChange(false);
      }
      return result;
    }
    //重新获取节点配置信息 并更新表单 与节点配置数据
    try {
      setIsModified(false);
      result = await onSaveWorkflow(getWorkflow('drawerForm'));
      if (hasSkillChange) {
        const _res = await service.getNodeConfig(getWorkflow('drawerForm').id);
        const isSuccess = _res.code === Constant.success;
        const data = _res.data;
        if (isSuccess && data && data.nodeConfig[SKILL_FORM_KEY]) {
          //更新表单数据 包括技能数据
          const updateValue = updateSkillComponentConfigs(
            form.getFieldsValue(true)[SKILL_FORM_KEY] || [],
            data.nodeConfig[SKILL_FORM_KEY],
          );
          form.setFieldValue(SKILL_FORM_KEY, updateValue);
          setSkillChange(false);
          setFoldWrapItem(_res.data);
          graphRef.current?.graphUpdateNode(String(data.id), data);
        } else {
          setSkillChange(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch node config:', error);
      setSkillChange(false);
    }
    return result;
  }, [setIsModified, form, setSkillChange, skillChange]);

  // 点击组件，显示抽屉
  const changeDrawer = useCallback(async (child: ChildNode | null) => {
    const _isModified = getWorkflow('isModified');
    const _drawerForm = getWorkflow('drawerForm');

    if (_isModified === true && _drawerForm?.id !== 0) {
      //如果有修改先保存
      setIsModified(false);
      onSaveWorkflow(_drawerForm);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    } else {
      if (child && child.id !== 0) {
        getReference(child.id);
      }
    }

    if (child && child.type !== NodeTypeEnum.Start) {
      setTestRun(false);
      setTestRunResult('');
    }

    const _visible = getWorkflow('visible');
    setFoldWrapItem((prev: ChildNode) => {
      setTestRun(false);
      if (prev.id === FoldFormIdEnum.empty && child === null) {
        setVisible(false);
        return prev;
      } else {
        if (child !== null) {
          if (!_visible) setVisible(true);
          return child;
        }
        setVisible(false);
        return {
          id: FoldFormIdEnum.empty,
          shape: NodeShapeEnum.General,
          description: '',
          workflowId: workflowId,
          type: NodeTypeEnum.Start,
          nodeConfig: {},
          name: '',
          icon: '',
        };
      }
    });
  }, []);

  // ==================== 节点创建相关辅助函数 ====================

  /**
   * 检查节点类型是否为条件分支或意图识别节点
   * @param nodeType 节点类型
   * @returns 是否为特殊节点类型
   */
  const isConditionalNode = (nodeType: string): boolean => {
    return (
      nodeType === NodeTypeEnum.Condition ||
      nodeType === NodeTypeEnum.IntentRecognition
    );
  };

  /**
   * 处理知识库节点的特殊配置
   * @param nodeData 节点数据
   * @param knowledgeBaseConfigs 知识库配置
   */
  const handleKnowledgeNodeConfig = async (
    nodeData: ChildNode,
    knowledgeBaseConfigs: CreatedNodeItem[],
  ) => {
    setSkillChange(true);
    await changeNode({
      nodeData: {
        ...nodeData,
        nodeConfig: {
          ...nodeData.nodeConfig,
          knowledgeBaseConfigs,
        },
      },
    });
  };

  /**
   * 处理特殊端口连接（长端口ID）
   * @param sourceNode 源节点
   * @param portId 端口ID
   * @param newNodeId 新节点ID
   * @param targetNode 目标节点
   * @param isLoop 是否为循环节点
   */
  const handleSpecialPortConnection = async ({
    sourceNode,
    portId,
    newNodeId,
    targetNode,
    isLoop,
  }: {
    sourceNode: ChildNode;
    portId: string;
    newNodeId: number;
    targetNode: ChildNode | undefined;
    isLoop: boolean;
  }) => {
    const params = handleSpecialNodesNextIndex(
      sourceNode,
      portId,
      newNodeId,
      targetNode,
    );
    const isSuccess = await changeNode({ nodeData: params }, noop);
    if (isSuccess) {
      const sourcePortId = portId.split('-').slice(0, -1).join('-');
      graphRef.current?.graphCreateNewEdge(
        sourcePortId,
        String(newNodeId),
        isLoop,
      );
    }
  };
  /**
   * 处理异常端口连接
   * @param sourceNode 源节点
   * @param portId 端口ID
   * @param newNodeId 新节点ID
   * @param targetNode 目标节点
   * @param isLoop 是否为循环节点
   */
  const handleExceptionPortConnection = async ({
    sourceNode,
    portId,
    newNodeId,
    targetNode,
    isLoop,
  }: {
    sourceNode: ChildNode;
    portId: string;
    newNodeId: number;
    targetNode: ChildNode | undefined;
    isLoop: boolean;
  }) => {
    const params = handleExceptionNodesNextIndex({
      sourceNode,
      id: newNodeId,
      targetNodeId: targetNode?.id,
    });
    const isSuccess = await changeNode({ nodeData: params }, noop);
    if (isSuccess) {
      const sourcePortId = portId.split('-').slice(0, -1).join('-');
      graphRef.current?.graphCreateNewEdge(
        sourcePortId,
        String(newNodeId),
        isLoop,
      );
    }
  };

  /**
   * 处理输出端口连接
   * @param newNodeId 新节点ID
   * @param sourceNode 源节点
   * @param isLoop 是否为循环节点
   */
  const handleOutputPortConnection = async ({
    newNodeId,
    sourceNode,
    isLoop,
  }: {
    newNodeId: number;
    sourceNode: ChildNode;
    isLoop: boolean;
  }) => {
    const newNodeIds = await nodeChangeEdge(
      {
        type: UpdateEdgeType.created,
        targetId: newNodeId.toString(),
        sourceNode,
      },
      noop,
    );
    if (newNodeIds) {
      graphRef.current?.graphCreateNewEdge(
        String(sourceNode.id),
        String(newNodeId),
        isLoop,
      );
    }
  };

  /**
   * 处理条件分支节点连接
   * @param newNode 新节点
   * @param targetNode 目标节点
   * @param isLoop 是否为循环节点
   */
  const handleConditionalNodeConnection = async ({
    newNode,
    targetNode,
    isLoop,
  }: {
    newNode: ChildNode;
    targetNode: ChildNode;
    isLoop: boolean;
  }) => {
    const { nodeData, sourcePortId } = QuicklyCreateEdgeConditionConfig(
      newNode,
      targetNode,
    );
    const isSuccess = await changeNode({ nodeData: nodeData }, noop);
    if (isSuccess) {
      graphRef.current?.graphCreateNewEdge(
        sourcePortId,
        String(targetNode.id),
        isLoop,
      );
    }
  };

  /**
   * 处理普通节点连接
   * @param newNodeId 新节点ID
   * @param targetNodeId 目标节点ID
   * @param newNode 新节点数据
   * @param isLoop 是否为循环节点
   */
  const handleNormalNodeConnection = async ({
    newNodeId,
    targetNodeId,
    newNode,
    isLoop,
  }: {
    newNodeId: number;
    targetNodeId: string;
    newNode: ChildNode;
    isLoop: boolean;
  }) => {
    const newNodeIds = await nodeChangeEdge(
      {
        type: UpdateEdgeType.created,
        targetId: targetNodeId,
        sourceNode: newNode,
      },
      noop,
    );
    if (newNodeIds) {
      graphRef.current?.graphCreateNewEdge(
        String(newNodeId),
        targetNodeId,
        isLoop,
      );
    }
  };

  /**
   * 处理输入端口连接
   * @param newNode 新节点
   * @param sourceNode 源节点
   * @param portId 端口ID
   * @param isLoop 是否为循环节点
   */
  const handleInputPortConnection = async ({
    newNode,
    sourceNode,
    portId,
    isLoop,
  }: {
    newNode: ChildNode;
    sourceNode: ChildNode;
    portId: string;
    isLoop: boolean;
  }) => {
    const id = portId.split('-')[0];

    if (isConditionalNode(newNode.type)) {
      const { nodeData, sourcePortId } = QuicklyCreateEdgeConditionConfig(
        newNode,
        sourceNode,
      );
      const isSuccess = await changeNode({ nodeData: nodeData }, noop);
      if (isSuccess) {
        graphRef.current?.graphCreateNewEdge(
          sourcePortId,
          sourceNode.id.toString(),
          isLoop,
        );
      }
    } else {
      const newNodeIds = await nodeChangeEdge(
        {
          type: UpdateEdgeType.created,
          targetId: id,
          sourceNode: newNode,
        },
        noop,
      );
      if (newNodeIds) {
        graphRef.current?.graphCreateNewEdge(
          newNode.id.toString(),
          id.toString(),
          isLoop,
        );
      }
    }
  };

  /**
   * 处理目标节点连接
   * @param newNode 新节点
   * @param targetNode 目标节点
   * @param sourceNode 源节点
   * @param edgeId 边ID
   * @param isLoop 是否为循环节点
   */
  const handleTargetNodeConnection = async ({
    newNode,
    targetNode,
    sourceNode,
    edgeId,
    isLoop,
  }: {
    newNode: ChildNode;
    targetNode: ChildNode;
    sourceNode: ChildNode;
    edgeId: string;
    isLoop: boolean;
  }) => {
    if (isConditionalNode(newNode.type)) {
      await handleConditionalNodeConnection({
        newNode,
        targetNode,
        isLoop,
      });
    } else {
      await handleNormalNodeConnection({
        newNodeId: newNode.id,
        targetNodeId: targetNode.id.toString(),
        newNode,
        isLoop,
      });
    }

    console.timeLog(
      'createNoeByPortOrEdge',
      'addNode:handleTargetNodeConnection:deleteEdge',
      edgeId,
    );

    // 删除原有连接
    const newNodeIds = await nodeChangeEdge(
      {
        type: UpdateEdgeType.deleted,
        targetId: targetNode.id.toString(),
        sourceNode,
      },
      noop,
    );
    if (newNodeIds) {
      graphRef.current?.graphDeleteEdge(edgeId);
    }
  };

  /**
   * 处理节点创建成功后的所有操作
   * @param nodeData 创建成功的节点数据
   * @param child 原始子节点配置
   */
  const handleNodeCreationSuccess = async (
    nodeData: AddNodeResponse,
    child: Partial<ChildNode>,
  ) => {
    // 设置节点基本属性
    const shape = getShape(nodeData.type);
    const { nodeConfig, ...rest } = nodeData;
    const { toolName, mcpId } = child.nodeConfig || {};
    const newNodeData = {
      ...rest,
      shape,
      nodeConfig: {
        ...nodeConfig,
        ...(toolName ? { toolName, mcpId } : {}),
      },
    };
    const extension = nodeConfig?.extension || {};

    // 添加节点到图形中
    graphRef.current?.graphAddNode(extension as GraphRect, newNodeData);

    // 处理知识库节点特殊配置
    if (
      child.type === NodeTypeEnum.Knowledge &&
      child.nodeConfig?.knowledgeBaseConfigs
    ) {
      await handleKnowledgeNodeConfig(
        newNodeData,
        child.nodeConfig.knowledgeBaseConfigs,
      );
    }
    // 更新抽屉和选中状态
    await changeDrawer(newNodeData);
    graphRef.current?.graphSelectNode(String(nodeData.id));
    changeUpdateTime();

    // 处理节点连接逻辑(通过节点或者边创建的节点)
    if (currentNodeRef.current) {
      const { portId, edgeId } = currentNodeRef.current;
      const isLoop = Boolean(nodeData.loopNodeId);
      const isOut = portId.endsWith('out');
      try {
        if (portId.includes(PortGroupEnum.exception)) {
          // 处理异常端口连接
          await handleExceptionPortConnection({
            sourceNode: currentNodeRef.current.sourceNode,
            portId,
            newNodeId: nodeData.id,
            targetNode: currentNodeRef.current.targetNode,
            isLoop,
          });
        } else if (portId.length > 15) {
          // 处理特殊端口连接
          await handleSpecialPortConnection({
            sourceNode: currentNodeRef.current.sourceNode,
            portId,
            newNodeId: nodeData.id,
            targetNode: currentNodeRef.current.targetNode,
            isLoop,
          });
        } else if (isOut) {
          // 处理输出端口连接
          await handleOutputPortConnection({
            newNodeId: nodeData.id,
            sourceNode: currentNodeRef.current.sourceNode,
            isLoop,
          });
        } else {
          // 处理输入端口连接
          await handleInputPortConnection({
            newNode: newNodeData,
            sourceNode: currentNodeRef.current.sourceNode,
            portId,
            isLoop,
          });
        }

        // 处理目标节点连接
        if (currentNodeRef.current.targetNode) {
          await handleTargetNodeConnection({
            newNode: newNodeData,
            targetNode: currentNodeRef.current.targetNode,
            sourceNode: currentNodeRef.current.sourceNode,
            edgeId: edgeId!,
            isLoop,
          });
        }

        await getReference(getWorkflow('drawerForm').id);
      } catch (error) {
        console.error('处理节点连接时发生错误:', error);
        throw error;
      } finally {
        // 清空当前节点引用
        currentNodeRef.current = null;
      }
    }
  };

  // ==================== 节点创建相关辅助函数结束 ====================

  // 新增节点
  const addNode = async (child: Partial<ChildNode>, dragEvent: GraphRect) => {
    let _params = JSON.parse(JSON.stringify(child));
    _params.workflowId = workflowId;
    _params.extension = dragEvent;

    const { width, height } = getNodeSize({
      data: _params,
      ports: [],
      type: NodeSizeGetTypeEnum.create,
    });
    // 如果是条件分支，需要增加高度
    // 需要设置固定尺寸的节点类型列表
    const fixedSizeNodeTypes = [
      NodeTypeEnum.Condition,
      NodeTypeEnum.QA,
      NodeTypeEnum.IntentRecognition,
      NodeTypeEnum.Loop,
    ];

    // 如果当前节点类型需要固定尺寸，则设置扩展属性
    if (child.type && fixedSizeNodeTypes.includes(child.type)) {
      _params.extension = {
        ...dragEvent,
        height,
        width,
      };
    }
    // 查看当前是否有选中的节点以及被选中的节点的type是否是Loop
    // 如果当前选择的是循环节点或者循环内部的子节点，那么就要将他的位置放置于循环内部
    if (foldWrapItem.type === NodeTypeEnum.Loop || foldWrapItem.loopNodeId) {
      if (_params.type === NodeTypeEnum.Loop) {
        message.warning('循环体里请不要再添加循环体');
        return false;
      }
      _params.loopNodeId =
        Number(foldWrapItem.loopNodeId) || Number(foldWrapItem.id);

      // V3: Use Proxy to get parent node info instead of API
      const loopNode = workflowProxy.getNodeById(_params.loopNodeId);
      if (loopNode) {
        const extension = loopNode.nodeConfig.extension;
        _params.extension = {
          ..._params.extension,
          x: (extension?.x || 0) + 40,
          y: (extension?.y || 0) + 110,
        };
      }
    }

    if (currentNodeRef.current) {
      const { sourceNode } = currentNodeRef.current;
      if (sourceNode.loopNodeId) {
        _params.loopNodeId = sourceNode.loopNodeId;
      }
    }

    // Ensure nodeConfig exists
    if (!_params.nodeConfig) {
      _params.nodeConfig = { extension: _params.extension };
    } else if (!_params.extension) {
      _params.extension = _params.nodeConfig.extension;
    }

    // V3: 生成备用节点 ID（当 API 失败时使用）
    // 规则：工作流 ID 前三位（不足补 0，超过截取）+ 时间戳
    const generateFallbackNodeId = (wfId: number): number => {
      const wfIdStr = String(wfId);
      let prefix: string;

      if (wfIdStr.length < 3) {
        // 不足三位，后面补 0
        prefix = wfIdStr.padEnd(3, '0');
      } else {
        // 超过三位，截取前三位
        prefix = wfIdStr.substring(0, 3);
      }

      const timestamp = Date.now();
      return Number(prefix + timestamp);
    };

    // V3: 先调用后端 API 获取节点 ID，失败则前端生成
    let nodeId: number;
    let apiNodeData: AddNodeResponse | null = null;

    try {
      const apiRes = await service.apiAddNode({
        workflowId: workflowId,
        type: _params.type,
        loopNodeId: _params.loopNodeId,
        extension: _params.extension,
        nodeConfigDto: _params.nodeConfigDto,
      });

      if (apiRes.code === Constant.success && apiRes.data) {
        // API 成功，使用后端返回的数据
        nodeId = apiRes.data.id;
        apiNodeData = apiRes.data;
        console.log('[V3] 添加节点 API 成功, nodeId:', nodeId);
      } else {
        // API 失败，前端生成 ID
        nodeId = generateFallbackNodeId(workflowId);
        console.warn(
          '[V3] 添加节点 API 失败，使用前端生成 ID:',
          nodeId,
          apiRes.message,
        );
      }
    } catch (error) {
      // API 异常，前端生成 ID
      nodeId = generateFallbackNodeId(workflowId);
      console.warn('[V3] 添加节点 API 异常，使用前端生成 ID:', nodeId, error);
    }

    // 更新节点 ID
    _params.id = nodeId;

    // 如果 API 返回了完整数据，使用 API 返回的数据
    if (apiNodeData) {
      _params = {
        ..._params,
        ...apiNodeData,
        nodeConfig: {
          ...apiNodeData.nodeConfig,
          extension: _params.extension,
        },
      };
    }

    // V3: Use Proxy to add node
    const proxyResult = workflowProxy.addNode(_params as ChildNode);

    if (proxyResult.success) {
      try {
        // Use the params as the created node data
        await handleNodeCreationSuccess(_params as AddNodeResponse, child);
        // V3: 触发防抖全量保存
        debouncedSaveFullWorkflow();
      } catch (error) {
        console.error('处理节点创建成功后的操作失败:', error);
      }
    } else {
      message.error(proxyResult.message || '添加节点失败');
    }
  };
  // 复制节点
  const copyNode = async (child: ChildNode) => {
    const res = workflowProxy.copyNode(Number(child.id));
    if (res.success && res.newNode) {
      const newNode = res.newNode;

      // X6 画布添加节点
      graphRef.current?.graphAddNode(
        newNode.nodeConfig.extension as GraphRect,
        newNode,
      );

      // 选中新增的节点
      graphRef.current?.graphSelectNode(String(newNode.id));
      changeUpdateTime();
    } else {
      message.error(res.message || '复制失败');
    }
  };
  // 删除指定的节点
  const deleteNode = async (id: number | string, node?: ChildNode) => {
    setVisible(false);
    preventGetReference.current = Number(id);
    setFoldWrapItem({
      id: 0,
      description: '',
      shape: NodeShapeEnum.General,
      workflowId: workflowId,
      type: NodeTypeEnum.Start,
      nodeConfig: {},
      name: '',
      icon: '',
    });
    const res = workflowProxy.deleteNode(Number(id));
    if (res.success) {
      const graph = graphRef.current?.getGraphRef();

      // Use batchUpdate to group history events
      if (graph) {
        graph.batchUpdate('delete-node', () => {
          graphRef.current?.graphDeleteNode(String(id));

          // Update neighbors in graph to match proxy (clean nextNodeIds)
          if (res.data) {
            res.data.nodes.forEach((n) => {
              const cell = graph.getCellById(String(n.id));
              if (cell && cell.isNode()) {
                const currentData = cell.getData();
                // Update nextNodeIds if changed (e.g. removed reference to deleted node)
                if (
                  JSON.stringify(currentData.nextNodeIds) !==
                  JSON.stringify(n.nextNodeIds)
                ) {
                  cell.setData({ nextNodeIds: n.nextNodeIds });
                }
              }
            });
          }
        });
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      changeUpdateTime();
      if (node) {
        if (node.type === 'Loop') {
          changeDrawer(null);
        } else {
          getNodeConfig(node.loopNodeId as number);
        }
      }
    } else {
      message.error(res.message || '删除失败');
    }
  };

  // 添加工作流，插件，知识库，数据库 mcp 节点
  const onAdded = (val: CreatedNodeItem, parentFC?: string) => {
    if (parentFC && parentFC !== 'workflow') return;
    let _child: Partial<ChildNode>;
    if (
      val.targetType === AgentComponentTypeEnum.Knowledge ||
      val.targetType === AgentComponentTypeEnum.Table
    ) {
      const knowledgeBaseConfigs = [
        { ...val, type: NodeTypeEnum.Knowledge, knowledgeBaseId: val.targetId },
      ];
      const tableType = sessionStorage.getItem('tableType');
      _child = {
        name: val.name,
        shape: NodeShapeEnum.General,
        description: val.description,
        type:
          val.targetType === AgentComponentTypeEnum.Knowledge
            ? NodeTypeEnum.Knowledge
            : ((tableType || NodeTypeEnum.TableDataQuery) as NodeTypeEnum),
        typeId: val.targetId,
        nodeConfig: {
          knowledgeBaseConfigs: knowledgeBaseConfigs,
          extension: {},
        },
      };
    } else if (
      val.targetType === AgentComponentTypeEnum.Workflow ||
      val.targetType === AgentComponentTypeEnum.Plugin
    ) {
      const type =
        val.targetType === AgentComponentTypeEnum.Workflow
          ? NodeTypeEnum.Workflow
          : NodeTypeEnum.Plugin;
      _child = {
        name: val.name,
        shape: NodeShapeEnum.General,
        description: val.description,
        type,
        typeId: val.targetId,
      };
    } else if (val.targetType === AgentComponentTypeEnum.MCP) {
      _child = {
        name: val.name,
        shape: NodeShapeEnum.General,
        description: val.description,
        type: NodeTypeEnum.MCP,
        typeId: val.targetId,
        nodeConfig: {
          toolName: val.toolName,
          mcpId: val.targetId,
        },
      };
    } else {
      message.warning('暂不支持该类型组件');
      return;
    }

    addNode(_child, dragEvent);
    if (sessionStorage.getItem('tableType')) {
      sessionStorage.removeItem('tableType');
    }
    // graphRef.current.addNode(dragEvent, _child);
    setOpen(false);
  };
  // 拖拽组件到画布中
  const dragChild = async (
    child: StencilChildNode,
    position?: React.DragEvent<HTMLDivElement> | GraphRect,
    continueDragCount?: number,
  ) => {
    const childType = child?.type || '';
    // 获取当前画布可视区域中心点

    // 判断是否需要显示特定类型的创建面板
    const isSpecialType = [
      NodeTypeEnum.Plugin,
      NodeTypeEnum.Workflow,
      NodeTypeEnum.MCP,
    ].includes(childType);

    // 数据库新增
    const isTableNode = [
      'TableDataAdd',
      'TableDataDelete',
      'TableDataUpdate',
      'TableDataQuery',
      'TableSQL',
    ].includes(childType);

    const viewGraph = graphRef.current?.getCurrentViewPort();
    if (isSpecialType) {
      setCreatedItem(childType as unknown as AgentComponentTypeEnum); // 注意这个类型转换的前提是两个枚举的值相同
      setOpen(true);
      setDragEvent(getCoordinates(position, viewGraph, continueDragCount));
    } else if (isTableNode) {
      setCreatedItem(AgentComponentTypeEnum.Table);
      setOpen(true);
      setDragEvent(getCoordinates(position, viewGraph, continueDragCount));
      sessionStorage.setItem('tableType', childType);
    } else {
      const coordinates = getCoordinates(
        position,
        viewGraph,
        continueDragCount,
      );
      // if (e) {
      //   e.preventDefault();
      // }
      await addNode(child as ChildNode, coordinates);
    }
  };
  // 校验当前工作流
  const validWorkflow = async () => {
    setLoading(false);

    if (getWorkflow('isModified') === true) {
      // 如果当前有未保存的修改，则先保存一下
      await doSubmitFormData();
    }
    // 先将数据提交到后端
    const _detail = await service.getDetails(workflowId);
    const _nodeList = _detail.data.nodes;
    setGraphParams((prev) => ({ ...prev, nodeList: _nodeList }));
    changeDrawer(_detail.data.startNode);
    graphRef.current?.graphSelectNode(String(_detail.data.startNode.id));

    const _res = await service.validWorkflow(info?.id as number);
    if (_res.code === Constant.success) {
      const _arr = _res.data.filter((item) => !item.success);
      if (_arr.length === 0) {
        return true;
      } else {
        const _errorList = _arr.map((child) => ({
          nodeId: child.nodeId,
          error: child.messages.join(','),
        }));
        setErrorParams({
          show: true,
          errorList: _errorList,
        });

        return false;
      }
    } else {
      return false;
    }
  };
  // // 发布，保存数据
  // const onSubmit = async (values: IPublish) => {
  //   const volid = await validWorkflow();
  //   if (volid) {
  //     // 获取所有节点,保存位置
  //     setLoading(true);
  //     const _params = { ...values, workflowId: info?.id };
  //     const _res = await service.publishWorkflow(_params);
  //     if (_res.code === Constant.success) {
  //       message.success('发布成功');
  //       setLoading(false);
  //       setShowPublish(false);
  //       const _time = new Date();
  //       // 更新时间
  //       setInfo({
  //         ...(info as IgetDetails),
  //         ...values,
  //         modified: _time.toString(),
  //         publishDate: _time.toString(),
  //         publishStatus: 'Published',
  //       });
  //     }
  //   } else {
  //     setShowPublish(false);
  //   }
  // };

  const handleConfirmPublishWorkflow = () => {
    setShowPublish(false);
    const _time = new Date();
    // 更新时间
    setInfo({
      ...(info as IgetDetails),
      modified: _time.toString(),
      publishDate: _time.toString(),
      publishStatus: 'Published',
    });
  };
  const handleClearRunResult = () => {
    setTestRunResult('');
    graphRef.current?.graphResetRunResult();
  };
  // 节点试运行
  const nodeTestRun = async (params?: DefaultObjectType) => {
    const _params = {
      nodeId: foldWrapItem.id,
      params,
    };
    setTestRunResult('');

    // 启动连接
    const abortConnection = await createSSEConnection({
      url: `${process.env.BASE_URL}/api/workflow/test/node/execute`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`,
        Accept: ' application/json, text/plain, */* ',
      },
      body: _params,
      onMessage: (data) => {
        if (!data.success) {
          if (data.message) {
            // message.warning(data.message);
            setTestRunResult(data.message);
          }
        } else {
          if (data.complete) {
            if (data.data && data.data.output) {
              setTestRunResult(data.data.output);
            }
            setTestRunResult(JSON.stringify(data.data, null, 2));
            removeWorkflowTestRun({
              spaceId,
              workflowId,
            });
          }
          if (data.data.status === 'STOP_WAIT_ANSWER') {
            setLoading(false);
            setStopWait(true);
            setWorkflowTestRun({
              spaceId,
              workflowId,
              value: JSON.stringify(params),
            });
          }
        }
        // 更新UI状态...
      },
      onError: (error) => {
        console.error('流式请求异常:', error);
        // 显示错误提示...
      },
      onOpen: (response) => {
        console.log('连接已建立', response.status);
      },
      onClose: () => {
        setLoading(false);
      },
    });
    // 主动关闭连接
    abortConnection();
  };
  // 试运行所有节点
  const testRunAllNode = async (params: ITestRun) => {
    // await getDetails();
    setLoading(true);
    // 遍历检查所有节点是否都已经输入了参数
    const abortConnection = await createSSEConnection({
      url: `${process.env.BASE_URL}/api/workflow/test/execute`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`,
        Accept: ' application/json, text/plain, */* ',
      },
      body: params,
      onMessage: (data) => {
        if (data.data && data.data.nodeId) {
          // 1.运行到当前节点时 给聚焦样式 与 选择当前节点 两种逻辑 这里x6要支持聚焦focus
          // 2.并显示运行状态
          // 3. 如果有循环则需要记录数据总条数
          const runResult: RunResultItem = {
            requestId: data.requestId,
            options: {
              ...data.data.result,
              nodeId: data.data.nodeId,
              nodeName: data.data.nodeName,
            },
            status: data.data.status,
          };
          graphRef.current?.graphActiveNodeRunResult(
            data.data.nodeId.toString(),
            runResult,
          );
        }
        if (!data.success) {
          setErrorParams((prev: ErrorParams) => {
            if (data.data && data.data.result) {
              return {
                errorList: [...prev.errorList, data.data.result],
                show: true,
              };
            } else {
              if (!data.data) {
                return {
                  errorList: [...prev.errorList, { error: data.message }],
                  show: true,
                };
              }
              return prev;
            }
          });
        } else {
          if (data.complete) {
            if (data.data && data.data.output) {
              setTestRunResult(data.data.output);
              removeWorkflowTestRun({
                spaceId,
                workflowId,
              });
            }

            setFormItemValue(
              data.nodeExecuteResultMap[
                (info?.startNode.id as number).toString()
              ].data,
            );
            setTestRunResult(JSON.stringify(data.data, null, 2));
            setLoading(false);
          }
          if (data.data.status === 'STOP_WAIT_ANSWER') {
            setLoading(false);
            setStopWait(true);
            setWorkflowTestRun({
              spaceId,
              workflowId,
              value: JSON.stringify(params),
            });
            if (data.data.result) {
              setTestRunParams(data.data.result.data);
            }
          }
        }
        // 更新UI状态...
      },
      onError: (error) => {
        console.error('流式请求异常:', error);
        // 显示错误提示...
      },
      onOpen: (response) => {
        console.log('连接已建立', response.status);
      },
      onClose: () => {
        setLoading(false);
      },
    });
    // 主动关闭连接
    abortConnection();
    // } else {
    //   message.warning('连线不完整');
    //   return;
    // }
    changeUpdateTime();
  };

  // 试运行所有节点
  const testRunAll = async () => {
    const loadingTimer = setTimeout(() => {
      setTestRunLoading(true);
    }, 300);
    try {
      const result = await validWorkflow();
      if (result) {
        setTestRunResult('');
        setTestRun(true);
      }
    } catch (error) {
      console.error('试运行所有节点失败:', error);
    } finally {
      clearTimeout(loadingTimer);
      setTestRunLoading(false);
    }
  };

  // 节点试运行
  const runTest = useCallback(
    async (type: string, params?: DefaultObjectType) => {
      setErrorParams({
        errorList: [],
        show: false,
      });
      handleClearRunResult();
      if (type === 'Start') {
        let _params: ITestRun;
        const testRun = getWorkflowTestRun({
          spaceId,
          workflowId,
        });
        if (testRun) {
          _params = {
            ...JSON.parse(testRun),
            ...(params as DefaultObjectType),
          };
          setStopWait(false);
          removeWorkflowTestRun({ spaceId, workflowId });
        } else {
          _params = {
            workflowId: info?.id as number,
            params,
            requestId: uuidv4(), // 使用uuid生成唯一ID
          };
        }

        testRunAllNode(_params);
      } else {
        if (type === 'Code') {
          if (isModified) {
            setIsModified(false);
            await onSaveWorkflow(getWorkflow('drawerForm'));
          }
          nodeTestRun(params);
        } else {
          nodeTestRun(params);
        }
      }
      setLoading(true);
    },
    [isModified, foldWrapItem.id],
  );
  // 右上角的相关操作
  const handleOperationsChange = useCallback(
    async (val: string) => {
      switch (val) {
        case 'Rename': {
          setShowNameInput(true);
          break;
        }
        case 'Delete': {
          deleteNode(foldWrapItem.id);
          break;
        }
        case 'Duplicate': {
          copyNode(foldWrapItem);
          break;
        }
        case 'TestRun': {
          if (isModified) {
            setIsModified(false);
            await onSaveWorkflow(getWorkflow('drawerForm'));
          }
          if (getWorkflow('drawerForm').type === NodeTypeEnum.Start) {
            await testRunAll();
          } else {
            setTestRunResult('');
            setTestRun(true);
          }
          break;
        }
        default:
          break;
      }
    },
    [isModified, foldWrapItem.id],
  );
  // 点击关闭按钮
  const handleDrawerClose = useCallback(() => {
    // TODO 排除 Loop 节点 触发空白区域点击事件 清空选择状态
    graphRef.current?.graphTriggerBlankClick();
  }, []);

  const handleClickBlank = useCallback(() => {
    // 关闭右侧抽屉
    changeDrawer(null);
    setVisible(false);
  }, []);

  // 更改节点的名称
  const changeFoldWrap = ({
    name,
    description,
  }: {
    name: string;
    description: string;
  }) => {
    const newValue = { ...foldWrapItem, name, description };
    changeNode({ nodeData: newValue });
    setShowNameInput(false);
  };

  const handleSaveNode = useCallback(
    (data: ChildNode, payload: Partial<ChildNode>) => {
      // 更新节点名称
      const newValue = { ...data, ...payload };
      changeNode({ nodeData: newValue });
      const graph = graphRef.current?.getGraphRef();
      if (graph) {
        const cell = graph.getCellById(data.id.toString());
        if (cell) {
          cell.updateData({
            name: newValue.name,
          });
          setFoldWrapItem((prev) => ({
            ...prev,
            name: newValue.name,
          }));
        }
      } else {
        console.error('graph is null');
      }
    },
    [changeNode, setFoldWrapItem],
  );

  // 点击画布中的节点
  const handleNodeClick = (node: ChildNode | null) => {
    // 如果右侧抽屉是再展示的，且就是当前选中的节点，那么就不做任何操作
    if (
      getWorkflow('visible') &&
      node &&
      node.id === getWorkflow('drawerForm').id
    )
      return;
    changeDrawer(node);
  };

  const selectGraphNode = (nodeId: number) => {
    const graph = graphRef.current?.getGraphRef();
    const _node = graph?.getCellById(nodeId.toString());
    if (_node) {
      graphRef.current?.graphSelectNode(nodeId.toString());
    }
  };

  const handleErrorNodeClick = (node: ChildNode | null) => {
    // 如果右侧抽屉是再展示的，且就是当前选中的节点，那么就不做任何操作
    if (visible && node && node.id === getWorkflow('drawerForm').id) return;
    if (node) {
      //分成二个步骤：
      // 1. 先获取当前选中节点的位置，然后平移画布到当前选中节点在视口中间
      const graph = graphRef.current?.getGraphRef();
      const cell = graph?.getCellById(node.id.toString());
      if (cell) {
        graph?.centerCell(cell);
      }
      // 2. 选中节点
      selectGraphNode(node.id);
    }
  };

  // 通过连接桩或者边创建节点
  const createNodeByPortOrEdge = async (
    config: CreateNodeByPortOrEdgeProps,
  ) => {
    const { child, sourceNode, portId, position, targetNode, edgeId } = config;
    // 首先创建节点
    currentNodeRef.current = {
      sourceNode: sourceNode,
      portId: portId,
      targetNode: targetNode,
      edgeId: edgeId,
    };
    const newPosition = calculateNodePosition({
      position,
      portId,
      type: child.type,
      hasTargetNode: !!targetNode,
      sourceNodeId: sourceNode.id.toString(),
      graph: graphRef.current?.getGraphRef() as Graph,
    });
    await dragChild(child, newPosition);
  };

  // 保存当前画布中节点的位置
  useEffect(() => {
    getDetails();

    // V3: 页面离开前保存（处理刷新/关闭页面）
    const handleBeforeUnload = () => {
      if (workflowProxy.hasPendingChanges()) {
        // 同步保存（beforeunload 不支持异步）
        const fullConfig = workflowProxy.buildFullConfig();
        if (fullConfig) {
          // 使用 sendBeacon 尝试同步发送
          const url = `${process.env.BASE_URL}/api/workflow/save`;
          const blob = new Blob(
            [JSON.stringify({ workflowConfig: fullConfig })],
            { type: 'application/json' },
          );
          navigator.sendBeacon(url, blob);
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // V3: 离开页面时全量保存
      if (workflowProxy.hasPendingChanges()) {
        saveFullWorkflow();
      }

      setIsModified((prev: boolean) => {
        if (prev === true) {
          onSaveWorkflow(getWorkflow('drawerForm'));
        }
        return false;
      });

      setVisible(false);
      setTestRun(false);
      clearWorkflow();
    };
  }, []);

  useEffect(() => {
    if (foldWrapItem.id !== 0) {
      const newFoldWrapItem = cloneDeep(foldWrapItem);

      // 先重置表单，清除所有字段
      form.resetFields();

      // 然后设置当前节点的配置
      form.setFieldsValue(newFoldWrapItem.nodeConfig);

      // 设置默认值
      setFormDefaultValues({
        type: newFoldWrapItem.type,
        nodeConfig: newFoldWrapItem.nodeConfig,
        form,
      });
    }
  }, [foldWrapItem.id, foldWrapItem.type]);

  const validPublishWorkflow = async () => {
    setLoading(false);

    // V3: 发布前全量保存
    if (workflowProxy.hasPendingChanges()) {
      await saveFullWorkflow();
    }

    if (getWorkflow('isModified') === true) {
      // 如果当前有未保存的修改，则先保存一下
      await doSubmitFormData();
    }

    const _res = await service.validWorkflow(info?.id as number);
    if (_res.code === Constant.success) {
      const _arr = _res.data.filter((item) => !item.success);
      if (_arr.length === 0) {
        return true;
      } else {
        const _errorList = _arr.map((child) => ({
          nodeId: child.nodeId,
          error: child.messages.join(','),
        }));
        setErrorParams({
          show: true,
          errorList: _errorList,
        });

        return false;
      }
    } else {
      return false;
    }
  };
  // 发布
  const handleShowPublish = async () => {
    const timer = setTimeout(() => {
      setIsValidLoading(true);
    }, 300);
    const valid = await validPublishWorkflow();
    await getDetails();
    if (valid) {
      setShowPublish(true);
      setErrorParams({ ...errorParams, errorList: [], show: false });
    }
    if (timer) {
      clearTimeout(timer);
    }
    setIsValidLoading(false);
  };

  // 监听保存更新修改
  useModifiedSaveUpdate({
    run: useCallback(async () => {
      const _drawerForm = getWorkflow('drawerForm');
      // console.log(
      //   'useModifiedSaveUpdate: run: onSaveWorkflow',
      //   _drawerForm.id,
      //   JSON.stringify(_drawerForm.nodeConfig),
      // );
      return await onSaveWorkflow(_drawerForm);
    }, []),
    doNext: useCallback(() => {
      setIsModified(false);
    }, [setIsModified]),
  });

  const handleRefreshGraph = async () => {
    setGraphParams({
      nodeList: [],
      edgeList: [],
    });
    await getDetails();
  };

  // 更新画布中的节点
  const handleGraphUpdateByFormData = useCallback(
    (changedValues: any, fullFormValues: any) => {
      const nodeId = getWorkflow('drawerForm').id;
      if (!graphRef.current || !nodeId || nodeId === FoldFormIdEnum.empty)
        return;

      graphRef.current.graphUpdateByFormData(
        changedValues,
        fullFormValues,
        nodeId.toString(),
      );
    },
    [graphRef.current],
  );

  // 使用节流处理表单值变化，确保最后一次调用必须触发更新
  const throttledHandleGraphUpdate = useThrottledCallback(
    (changedValues: any, fullFormValues: any) => {
      // 先关闭之前修改的标记
      setIsModified(false);
      handleGraphUpdateByFormData(changedValues, fullFormValues);
      // 再打开新的修改标记
      setIsModified(true);
    },
    500, // 500ms 的节流延迟
    {
      leading: true, // 立即执行第一次调用
      trailing: true, // 确保最后一次调用被执行
    },
  );

  // 绑定快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement as HTMLElement)?.isContentEditable;

      if (isInput) return;

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const graph = graphRef.current?.getGraphRef();

      if (!graph) return;

      // Undo: Command + Z
      if (isCmdOrCtrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (graph.canUndo()) {
          graph.undo();
          // message.success('已撤销');
        }
      }

      // Redo: Command + Shift + Z or Command + Y
      if (
        (isCmdOrCtrl && e.key.toLowerCase() === 'z' && e.shiftKey) ||
        (isCmdOrCtrl && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        if (graph.canRedo()) {
          graph.redo();
          // message.success('已重做');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 监听 X6 历史记录变化
  useEffect(() => {
    // 轮询或者在 onInit 中绑定？由于 graph 实例初始化时机问题，使用轮询检查或者依赖 graphParams 变化
    const checkGraph = setInterval(() => {
      const graph = graphRef.current?.getGraphRef();
      if (graph) {
        clearInterval(checkGraph);

        const updateHistory = () => {
          setHistoryState({
            canUndo: graph.canUndo(),
            canRedo: graph.canRedo(),
          });

          // Sync graph data to Proxy to ensure consistency after Undo/Redo
          if (workflowProxy) {
            const nodes = graph.getNodes().map((n) => {
              const data = n.getData();
              const position = n.getPosition(); // 读取 X6 的实际位置
              const size = n.getSize();
              // 将 X6 的位置同步到业务数据的 nodeConfig.extension
              return {
                ...data,
                nodeConfig: {
                  ...data.nodeConfig,
                  extension: {
                    ...data.nodeConfig?.extension,
                    x: position.x,
                    y: position.y,
                    width: size.width,
                    height: size.height,
                  },
                },
              };
            });
            const edges = graph.getEdges().map((e) => {
              const source = e.getSource() as any;
              const target = e.getTarget() as any;
              return {
                id: e.id,
                source: source?.cell || source,
                target: target?.cell || target,
                sourcePort: source?.port || undefined,
                targetPort: target?.port || undefined,
                zIndex: e.getZIndex(),
              };
            });
            workflowProxy.syncFromGraph(nodes, edges as any);
          }
        };
        graph.on('history:change', updateHistory);
        // Initial state
        updateHistory();
      }
    }, 500);

    return () => clearInterval(checkGraph);
  }, []);

  return (
    <WorkflowLayout
      isValidLoading={isValidLoading}
      info={info}
      setShowCreateWorkflow={setShowCreateWorkflow}
      setShowVersionHistory={setShowVersionHistory}
      handleShowPublish={handleShowPublish}
      showPublish={showPublish}
      setShowPublish={setShowPublish}
      canUndo={historyState.canUndo}
      canRedo={historyState.canRedo}
      onUndo={() => {
        const graph = graphRef.current?.getGraphRef();
        if (graph && graph.canUndo()) {
          graph.undo();
        }
      }}
      onRedo={() => {
        const graph = graphRef.current?.getGraphRef();
        if (graph && graph.canRedo()) {
          graph.redo();
        }
      }}
      onConfirm={onConfirm}
      handleConfirmPublishWorkflow={handleConfirmPublishWorkflow}
      globalLoadingTime={globalLoadingTime}
      graphParams={graphParams}
      graphRef={graphRef}
      handleNodeClick={handleNodeClick}
      nodeChangeEdge={nodeChangeEdge}
      changeNode={changeNode}
      deleteNode={deleteNode}
      copyNode={copyNode}
      changeZoom={changeZoom}
      createNodeByPortOrEdge={createNodeByPortOrEdge}
      handleSaveNode={handleSaveNode}
      handleClickBlank={handleClickBlank}
      handleInitLoading={handleInitLoading}
      handleRefreshGraph={handleRefreshGraph}
      dragChild={dragChild}
      foldWrapItem={foldWrapItem}
      changeGraph={changeGraph}
      testRunAll={testRunAll}
      testRunLoading={testRunLoading}
      visible={visible}
      handleDrawerClose={handleDrawerClose}
      showNameInput={showNameInput}
      changeFoldWrap={changeFoldWrap}
      handleOperationsChange={handleOperationsChange}
      form={form}
      doSubmitFormData={doSubmitFormData}
      throttledHandleGraphUpdate={throttledHandleGraphUpdate}
      createdItem={createdItem}
      onAdded={onAdded}
      open={open}
      setOpen={setOpen}
      workflowCreatedTabs={workflowCreatedTabs}
      workflowId={workflowId}
      runTest={runTest}
      testRunResult={testRunResult}
      handleClearRunResult={handleClearRunResult}
      loading={loading}
      stopWait={stopWait}
      formItemValue={formItemValue}
      testRunParams={testRunParams}
      errorParams={errorParams}
      setErrorParams={setErrorParams}
      handleErrorNodeClick={handleErrorNodeClick}
      spaceId={spaceId}
      showCreateWorkflow={showCreateWorkflow}
      showVersionHistory={showVersionHistory}
    />
  );
};

// V3 直接导出 Workflow 组件
export default Workflow;
