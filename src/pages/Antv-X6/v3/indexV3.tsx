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
import useDisableSaveShortcut from '@/hooks/useDisableSaveShortcut';
import useDrawerScroll from '@/hooks/useDrawerScroll';
import { useThrottledCallback } from '@/hooks/useThrottledCallback';
import {
  DEFAULT_DRAWER_FORM,
  SKILL_FORM_KEY,
} from '@/pages/Antv-X6/v3/constants/node.constants';
import service from '@/services/workflow';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  AnswerTypeEnum,
  NodeShapeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import { FoldFormIdEnum } from '@/types/enums/node';
import {
  ChildNode,
  CreateNodeByPortOrEdgeProps,
  CurrentNodeRefProps,
  GraphContainerRef,
} from '@/types/interfaces/graph';
import { CurrentNodeRefKey, NodeConfig } from '@/types/interfaces/node';
import { ErrorParams } from '@/types/interfaces/workflow';
import { cloneDeep } from '@/utils/common';
import {
  changeNodeConfig,
  updateCurrentNode,
  updateSkillComponentConfigs,
} from '@/utils/updateNode';
import { Graph } from '@antv/x6';
import { App, Form } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useModel, useParams } from 'umi';
import WorkflowLayout from './components/layout/WorkflowLayout';
import useModifiedSaveUpdateV3 from './hooks/useModifiedSaveUpdateV3';
import { calculateNodePosition } from './utils/graphV3';
import { setFormDefaultValues } from './utils/workflowV3';
// Components moved to WorkflowLayout
import './indexV3.less';

// V3 Hooks
import { useBeforeUnload } from './hooks/useBeforeUnload';
import { useGraphInteraction } from './hooks/useGraphInteraction';
import { useNodeOperations } from './hooks/useNodeOperations';
import { useTestRun } from './hooks/useTestRun';
import { useWorkflowLifecycle } from './hooks/useWorkflowLifecycle';
import { useWorkflowPersistence } from './hooks/useWorkflowPersistence';
import { useWorkflowValidation } from './hooks/useWorkflowValidation';

// V3 数据代理层
import { WorkflowVersionProvider } from '@/contexts/WorkflowVersionContext';
import { workflowProxy } from './services/workflowProxyV3';
import { workflowSaveService } from './services/WorkflowSaveService';
import type { WorkflowDataV3 } from './types';
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
  const { message } = App.useApp();
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

  // 调整画布的大小(滚轮缩放时更新状态)
  const changeZoom = useCallback(
    (val: number) => {
      setInfo((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          extension: { size: val },
        };
      });
    },
    [setInfo],
  );

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
  // 错误列表的参数
  const [errorParams, setErrorParams] = useState<ErrorParams>({
    errorList: [],
    show: false,
  });
  // 发布前的校验
  // 画布的ref
  const graphRef = useRef<GraphContainerRef>(null);
  const graphInstanceRef = useRef<Graph | null>(null); // 持久化引用，解决 undo/redo 及 unmount 时 graphRef 失效问题
  // 阻止获取当前节点的上级参数
  const preventGetReference = useRef<number>(0);
  // 新增定时器引用
  const timerRef = useRef<NodeJS.Timeout>();
  // 标记节点切换中，防止表单初始化触发保存
  const isNodeSwitchingRef = useRef(false);
  // V3: 延迟引用 - 用于解决 hooks 循环依赖问题
  const changeDrawerRef = useRef<((child: ChildNode | null) => void) | null>(
    null,
  );
  const validWorkflowRef = useRef<(() => Promise<boolean>) | null>(null);
  const doSubmitFormDataRef = useRef<(() => Promise<boolean>) | null>(null);
  const getDetailsRef = useRef<(() => Promise<void>) | null>(null);
  // V3: 赋值 getDetails 到 ref（getDetails 在前面定义，因此这里赋值）
  getDetailsRef.current = getDetails;
  const [showVersionHistory, setShowVersionHistory] = useState(false);
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

  // 调整画布的大小（左下角 select 控件）
  const changeGraph = useCallback(
    (val: number | string) => {
      if (val === -1) {
        graphRef.current?.graphChangeZoomToFit();
      } else {
        graphRef.current?.graphChangeZoom(val as number);
      }
    },
    [graphRef],
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

  // 获取当前节点的参数 - V3 使用前端计算替代后端接口
  const getReference = async (id: number): Promise<boolean> => {
    console.log(
      '[getReference] 调用, id:',
      id,
      'preventGetReference:',
      preventGetReference.current,
    );
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

      const workflowData: WorkflowDataV3 = {
        workflowId: workflowId,
        nodes: nodeList as any,
        edges: edgeList as any,
        systemVariables: workflowProxy.getSystemVariables(),
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
      graphInstanceRef,
      changeUpdateTime,
      getReference,
      setFoldWrapItem,
    });

  // V3: 更新工作流基础信息（名称、描述、图标），走全量保存接口
  const onUpdateWorkflow = useCallback(
    async (updateInfo: {
      name?: string;
      description?: string;
      icon?: string;
    }) => {
      try {
        // 更新本地 info 状态
        setInfo((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            name: updateInfo.name ?? prev.name,
            description: updateInfo.description ?? prev.description,
            icon: updateInfo.icon ?? prev.icon,
            modified: new Date().toString(),
          };
        });

        // 更新 workflowProxy 中的工作流信息
        const currentInfo = workflowProxy.getWorkflowInfo();
        if (currentInfo) {
          workflowProxy.setWorkflowInfo({
            ...currentInfo,
            name: updateInfo.name ?? currentInfo.name,
            description: updateInfo.description ?? currentInfo.description,
            icon: updateInfo.icon ?? currentInfo.icon,
          });
        }

        // 更新 workflowSaveService 的元数据（避免被全量保存覆盖）
        workflowSaveService.updateMeta({
          name: updateInfo.name,
          description: updateInfo.description,
          icon: updateInfo.icon,
        });

        // 调用全量保存接口
        const success = await saveFullWorkflow();
        return success;
      } catch (error) {
        console.error('更新工作流基础信息失败:', error);
        return false;
      }
    },
    [setInfo, saveFullWorkflow],
  );

  const { nodeChangeEdge, changeNode } = useGraphInteraction({
    graphRef,
    debouncedSaveFullWorkflow,
    changeUpdateTime,
    getReference: (id) => getReference(id),
    setFoldWrapItem,
    getNodeConfig: (id) => getNodeConfig(id),
    updateCurrentNodeRef,
  });
  // V3: 节点操作 Hook（使用 ref 解决循环依赖）
  const nodeOperationsHook = useNodeOperations({
    workflowId,
    graphRef,
    currentNodeRef,
    foldWrapItem,
    setFoldWrapItem,
    setVisible,
    setOpen,
    setCreatedItem,
    setDragEvent,
    dragEvent,
    preventGetReference,
    timerRef,
    changeUpdateTime,
    debouncedSaveFullWorkflow,
    changeDrawer: (val) => changeDrawerRef.current?.(val),
    getNodeConfig: (id) => getNodeConfig(id),
    getReference: (id) => getReference(id),
    getWorkflow,
    changeNode,
    nodeChangeEdge: async (params, callback) => {
      const result = await nodeChangeEdge(params, callback);
      return result === false ? null : result;
    },
  });

  // V3: 试运行 Hook（使用 ref 解决循环依赖）
  const testRunHook = useTestRun({
    workflowId,
    spaceId,
    graphRef,
    info,
    foldWrapItem,
    validWorkflow: async () => {
      const fn = validWorkflowRef.current;
      return fn ? await fn() : false;
    },
    onSaveWorkflow: async () => {
      await saveFullWorkflow();
    },
    getWorkflow,
    isModified,
    setIsModified,
    changeUpdateTime,
    errorParams,
    setErrorParams,
  });

  // V3: 工作流校验 Hook（使用 ref 解决循环依赖）
  const validationHook = useWorkflowValidation({
    workflowId,
    info,
    graphRef,
    getWorkflow,
    setGraphParams,
    changeDrawer: (val) => changeDrawerRef.current?.(val),
    setInfo,
    setErrorParams,
    errorParams,
    doSubmitFormData: async () => {
      const fn = doSubmitFormDataRef.current;
      if (fn) await fn();
    },
    saveFullWorkflow,
    getDetails: async () => {
      const fn = getDetailsRef.current;
      if (fn) await fn();
    },
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
  // V3: 赋值 doSubmitFormData 到 ref（用于解决循环依赖）
  doSubmitFormDataRef.current = doSubmitFormData;

  // 点击组件，显示抽屉
  const changeDrawer = useCallback(async (child: ChildNode | null) => {
    const _isModified = getWorkflow('isModified');
    const _drawerForm = getWorkflow('drawerForm');

    console.log(
      '[changeDrawer] 节点切换, isModified:',
      _isModified,
      'currentNode:',
      _drawerForm?.id,
      '->',
      child?.id,
    );

    // 标记节点切换开始，防止表单初始化触发 isModified
    isNodeSwitchingRef.current = true;
    // 使用 setTimeout 在下一个事件循环重置标记
    // 600ms 足够让 throttledHandleGraphUpdate (500ms) 完成
    setTimeout(() => {
      isNodeSwitchingRef.current = false;
    }, 600);

    if (_isModified === true && _drawerForm?.id !== 0) {
      //如果有修改先保存
      console.log('[changeDrawer] 检测到修改，触发保存');
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
      testRunHook.setTestRunResult('');
    }

    const _visible = getWorkflow('visible');

    // 计算新的 foldWrapItem 和 visible 状态（避免在 updater 函数内调用 setState）
    let newVisible = _visible;
    let newFold: ChildNode;

    const currentFold = getWorkflow('drawerForm');

    if (currentFold?.id === FoldFormIdEnum.empty && child === null) {
      newVisible = false;
      newFold = currentFold;
    } else if (child !== null) {
      if (!_visible) newVisible = true;
      newFold = child;
    } else {
      newVisible = false;
      newFold = {
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

    // 先更新 visible 和 testRun 状态
    setTestRun(false);
    if (newVisible !== _visible) {
      setVisible(newVisible);
    }

    // 最后更新 foldWrapItem
    setFoldWrapItem(newFold);
  }, []);
  // V3: 赋值 changeDrawer 到 ref（用于解决循环依赖）
  changeDrawerRef.current = changeDrawer;

  // 校验当前工作流
  const validWorkflow = useCallback(async () => {
    return await validationHook.validWorkflow();
  }, [validationHook]);

  // V3: 赋值 validWorkflow 到 ref（用于解决循环依赖）
  validWorkflowRef.current = validWorkflow;

  // 右上角的相关操作
  const handleOperationsChange = useCallback(
    async (val: string) => {
      switch (val) {
        case 'Rename': {
          setShowNameInput(true);
          break;
        }
        case 'Delete': {
          // 使用 getWorkflow 获取最新的 drawerForm，避免闭包中的 foldWrapItem 过期
          const currentNode = getWorkflow('drawerForm');
          nodeOperationsHook.deleteNode(currentNode.id);
          break;
        }
        case 'Duplicate': {
          // 使用 getWorkflow 获取最新的 drawerForm，避免闭包中的 foldWrapItem 过期
          const currentNode = getWorkflow('drawerForm');
          nodeOperationsHook.copyNode(currentNode);
          break;
        }
        case 'TestRun': {
          if (isModified) {
            setIsModified(false);
            await onSaveWorkflow(getWorkflow('drawerForm'));
          }
          if (getWorkflow('drawerForm').type === NodeTypeEnum.Start) {
            await testRunHook.testRunAll();
          } else {
            testRunHook.setTestRunResult('');
            setTestRun(true);
          }
          break;
        }
        default:
          break;
      }
    },
    [isModified, nodeOperationsHook, testRunHook],
  );

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
    await nodeOperationsHook.dragChild(child, newPosition);
  };

  // V3: 页面离开保护（刷新/关闭/SPA路由跳转）
  useBeforeUnload({
    getGraph: () =>
      graphRef.current?.getGraphRef?.() || graphInstanceRef.current,
    onSave: saveFullWorkflow,
  });

  // 组件卸载时的清理
  useEffect(() => {
    return () => {
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

  // 监听保存更新修改
  useModifiedSaveUpdateV3({
    run: useCallback(async () => {
      const _drawerForm = getWorkflow('drawerForm');
      // console.log(
      //   'useModifiedSaveUpdateV3: run: onSaveWorkflow',
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
      console.log(
        '[throttledHandleGraphUpdate] 触发, changedValues:',
        Object.keys(changedValues),
        'isNodeSwitching:',
        isNodeSwitchingRef.current,
      );
      // 先关闭之前修改的标记
      setIsModified(false);
      handleGraphUpdateByFormData(changedValues, fullFormValues);
      // 只有在非节点切换期间才标记为已修改
      // 节点切换时的表单初始化不应触发保存
      if (!isNodeSwitchingRef.current) {
        setIsModified(true);
      }
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
        } else {
          message.warning('没有可撤销的操作');
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
        } else {
          message.warning('没有可重做的操作');
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
      // 优先从 graphRef 获取，并更新到 stable ref
      const graph = graphRef.current?.getGraphRef();
      if (graph) {
        graphInstanceRef.current = graph;
        clearInterval(checkGraph);

        const updateHistory = (isInitial = false) => {
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
            // 初始加载时不标记为dirty，也不触发保存
            workflowProxy.syncFromGraph(nodes, edges as any, !isInitial);

            // V3: Undo/Redo 后触发保存（仅非初始加载时）
            if (!isInitial) {
              debouncedSaveFullWorkflow();
            }
          }
        };
        graph.on('history:change', () => updateHistory(false));
        // Initial state
        updateHistory(true);
      }
    }, 500);

    return () => clearInterval(checkGraph);
  }, []);

  return (
    <WorkflowVersionProvider version="v3">
      <WorkflowLayout
        isValidLoading={validationHook.isValidLoading}
        info={info}
        setShowCreateWorkflow={setShowCreateWorkflow}
        setShowVersionHistory={setShowVersionHistory}
        handleShowPublish={validationHook.handleShowPublish}
        showPublish={validationHook.showPublish}
        setShowPublish={validationHook.setShowPublish}
        canUndo={historyState.canUndo}
        canRedo={historyState.canRedo}
        onUndo={() => {
          const graph = graphRef.current?.getGraphRef();
          if (graph) {
            if (graph.canUndo()) {
              graph.undo();
            } else {
              message.warning('没有可撤销的操作');
            }
          }
        }}
        onRedo={() => {
          const graph = graphRef.current?.getGraphRef();
          if (graph) {
            if (graph.canRedo()) {
              graph.redo();
            } else {
              message.warning('没有可重做的操作');
            }
          }
        }}
        onManualSave={saveFullWorkflow}
        onConfirm={onConfirm}
        onUpdateWorkflow={onUpdateWorkflow}
        handleConfirmPublishWorkflow={
          validationHook.handleConfirmPublishWorkflow
        }
        globalLoadingTime={globalLoadingTime}
        graphParams={graphParams}
        graphRef={graphRef}
        handleNodeClick={handleNodeClick}
        nodeChangeEdge={nodeChangeEdge}
        changeNode={changeNode}
        deleteNode={nodeOperationsHook.deleteNode}
        copyNode={nodeOperationsHook.copyNode}
        changeZoom={changeZoom}
        createNodeByPortOrEdge={createNodeByPortOrEdge}
        handleSaveNode={handleSaveNode}
        handleClickBlank={handleClickBlank}
        handleInitLoading={handleInitLoading}
        handleRefreshGraph={handleRefreshGraph}
        dragChild={nodeOperationsHook.dragChild}
        foldWrapItem={foldWrapItem}
        changeGraph={changeGraph}
        testRunAll={testRunHook.testRunAll}
        testRunLoading={testRunHook.testRunLoading}
        visible={visible}
        handleDrawerClose={handleDrawerClose}
        showNameInput={showNameInput}
        changeFoldWrap={changeFoldWrap}
        handleOperationsChange={handleOperationsChange}
        form={form}
        doSubmitFormData={doSubmitFormData}
        throttledHandleGraphUpdate={throttledHandleGraphUpdate}
        createdItem={createdItem}
        onAdded={nodeOperationsHook.onAdded}
        open={open}
        setOpen={setOpen}
        workflowCreatedTabs={workflowCreatedTabs}
        workflowId={workflowId}
        runTest={testRunHook.runTest}
        testRunResult={testRunHook.testRunResult}
        handleClearRunResult={testRunHook.handleClearRunResult}
        loading={testRunHook.loading}
        stopWait={testRunHook.stopWait}
        formItemValue={testRunHook.formItemValue}
        testRunParams={testRunHook.testRunParams}
        errorParams={errorParams}
        setErrorParams={setErrorParams}
        handleErrorNodeClick={handleErrorNodeClick}
        spaceId={spaceId}
        showCreateWorkflow={showCreateWorkflow}
        showVersionHistory={showVersionHistory}
      />
    </WorkflowVersionProvider>
  );
};

// V3 直接导出 Workflow 组件
export default Workflow;
