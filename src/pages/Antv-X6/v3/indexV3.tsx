/**
 * V3 workflow page entry.
 *
 * Refactored from V1 to keep frontend/backend data consistent.
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
import { jumpBack } from '@/utils/router';
import {
  changeNodeConfig,
  updateCurrentNode,
  updateSkillComponentConfigs,
} from '@/utils/updateNode';
import { Graph } from '@antv/x6';
import { Form } from 'antd';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useLocation, useModel, useParams } from 'umi';
import WorkflowLayout from './components/layout/WorkflowLayout';
import useModifiedSaveUpdateV3 from './hooks/useModifiedSaveUpdateV3';
import { calculateNodePosition } from './utils/graphV3';
import { checkNodeModified, setFormDefaultValues } from './utils/workflowV3';
// Components moved to WorkflowLayout
import './indexV3.less';

// V3 Hooks
import { useBeforeUnload } from './hooks/useBeforeUnload';
import { useGraphInteraction } from './hooks/useGraphInteraction';
import { useNodeOperations } from './hooks/useNodeOperations';
import { useTestRun } from './hooks/useTestRun';
import { useWorkflowHistory } from './hooks/useWorkflowHistory';
import { useWorkflowLifecycle } from './hooks/useWorkflowLifecycle';
import { useWorkflowPersistence } from './hooks/useWorkflowPersistence';
import { useWorkflowValidation } from './hooks/useWorkflowValidation';

// V3 data proxy layer.
import { WorkflowVersionProvider } from '@/contexts/WorkflowVersionContext';
import { workflowLogger } from '@/utils/logger';
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

  const location = useLocation();

  const params = useParams();
  // id
  const workflowId = Number(params.workflowId);
  const spaceId = Number(params.spaceId);
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

  const [open, setOpen] = useState(false);
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  const [createdItem, setCreatedItem] = useState<AgentComponentTypeEnum>(
    AgentComponentTypeEnum.Plugin,
  );
  // xy
  const [dragEvent, setDragEvent] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const currentNodeRef = useRef<CurrentNodeRefProps | null>(null);
  // form
  const [form] = Form.useForm<NodeConfig>();
  const [showNameInput, setShowNameInput] = useState<boolean>(false);
  const [errorParams, setErrorParams] = useState<ErrorParams>({
    errorList: [],
    show: false,
  });
  // ref
  const graphRef = useRef<GraphContainerRef>(null);
  const graphInstanceRef = useRef<Graph | null>(null); // Persistent graph ref for undo/redo and unmount.
  const preventGetReference = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout>();
  const isNodeSwitchingRef = useRef(false);
  // V3:  -  hooks
  const changeDrawerRef = useRef<((child: ChildNode | null) => void) | null>(
    null,
  );
  const validWorkflowRef = useRef<(() => Promise<boolean>) | null>(null);
  const doSubmitFormDataRef = useRef<(() => Promise<boolean>) | null>(null);
  const getDetailsRef = useRef<(() => Promise<void>) | null>(null);
  // V3:  getDetails  ref（getDetails ，）
  getDetailsRef.current = getDetails;
  const [showVersionHistory, setShowVersionHistory] = useState<boolean>(false);

  // 是否隐藏返回箭头
  const [hideBack, setHideBack] = useState<boolean>(false);
  const { setTestRun } = useModel('model');
  // useModel
  const {
    setReferenceList,
    setIsModified,
    skillChange,
    setSkillChange,
    isModified,
  } = useModel('workflowV3');

  //  Hook
  useDrawerScroll(showVersionHistory);

  // Ctrl+S/Cmd+S
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

  // （ select ）
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

  useLayoutEffect(() => {
    const _hideBack = new URLSearchParams(location.search)?.get('hideBack');
    const _hideBackValue = _hideBack ? Boolean(_hideBack) : false;

    setHideBack(_hideBackValue);
  }, [location]);

  /** -----------------    --------------------- */
  //  foldWrapItem  model  drawerForm
  useEffect(() => {
    //  setDrawerForm
    storeWorkflow('drawerForm', foldWrapItem);

    // V3:  foldWrapItem ，
    //  UI
    if (foldWrapItem && foldWrapItem.nodeConfig) {
      // ， foldWrapItem
      const currentSkills = form.getFieldValue(SKILL_FORM_KEY);
      form.setFieldsValue(foldWrapItem.nodeConfig);
      if (Array.isArray(currentSkills) && currentSkills.length > 0) {
        form.setFieldValue(SKILL_FORM_KEY, currentSkills);
      }
    }

    if (skillChange) {
      setSkillChange(false);
    }
  }, [foldWrapItem]);

  // Get current node reference args (V3 frontend calculation).
  const getReference = async (id: number): Promise<boolean> => {
    console.log(
      '[getReference] called, id:',
      id,
      'preventGetReference:',
      preventGetReference.current,
    );
    if (id === FoldFormIdEnum.empty || preventGetReference.current === id)
      return false;

    // V3 frontend calculation path.
    try {
      let nodeList: any[] = [];
      let edgeList: any[] = [];

      const graph = graphRef.current?.getGraphRef?.();
      if (graph) {
        nodeList = graph.getNodes().map((n: any) => {
          const data = n.getData();
          const position = n.getPosition();
          const size = n.getSize();

          //  Loop ， innerNodes
          let innerNodes = data.innerNodes;
          if (data.type === NodeTypeEnum.Loop) {
            const children = n.getChildren();
            if (children && children.length > 0) {
              innerNodes = children
                .filter((child: any) => child.isNode && child.isNode())
                .map((child: any) => child.getData());
            }
          }

          return {
            ...data,
            innerNodes,
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

        edgeList = graph.getEdges().map((e: any) => ({
          id: e.id,
          source: e.getSourceCellId(),
          target: e.getTargetCellId(),
          sourcePort: (e.getSource() as any)?.port,
          targetPort: (e.getTarget() as any)?.port,
        }));
      } else {
        //  workflowProxy
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
      console.error('[V3] calculate variable references failed:', error);
      return false;
    }
  };
  const getNodeConfig = async (id: number) => {
    if (id === FoldFormIdEnum.empty) return;

    // V3: prefer proxy node data (latest state).
    const node = workflowProxy.getNodeById(id);
    if (node) {
      setFoldWrapItem(cloneDeep(node));
    } else {
      try {
        const _res = await service.getNodeConfig(id);
        if (_res.code === Constant.success) {
          const data = _res.data;
          workflowProxy.updateNode(data);
          graphRef.current?.graphUpdateNode(String(data.id), data);
          setFoldWrapItem(data);
          changeUpdateTime();
        }
      } catch (e) {
        console.error('[V3] get node config failed:', e);
      }
    }
  };
  // onFinish
  // V3 Hooks Integration for Persistence and Interaction
  const { saveFullWorkflow, debouncedSaveFullWorkflow, autoSaveNodeConfig } =
    useWorkflowPersistence({
      graphRef,
      graphInstanceRef,
      changeUpdateTime,
      getReference,
      setFoldWrapItem,
    });

  // V3: （），
  const onUpdateWorkflow = useCallback(
    async (updateInfo: {
      name?: string;
      description?: string;
      icon?: string;
    }) => {
      try {
        //  info
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

        //  workflowProxy
        const currentInfo = workflowProxy.getWorkflowInfo();
        if (currentInfo) {
          workflowProxy.setWorkflowInfo({
            ...currentInfo,
            name: updateInfo.name ?? currentInfo.name,
            description: updateInfo.description ?? currentInfo.description,
            icon: updateInfo.icon ?? currentInfo.icon,
          });
        }

        //  workflowSaveService （）
        workflowSaveService.updateMeta({
          name: updateInfo.name,
          description: updateInfo.description,
          icon: updateInfo.icon,
        });

        const success = await saveFullWorkflow();
        return success;
      } catch (error) {
        console.error('[V3] update workflow basic info failed:', error);
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
  // V3:  Hook（ ref ）
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

  // V3:  Hook（ ref ）
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

  // V3:  Hook（ ref ）
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

        //  VariableAggregation
        if (currentFoldWrapItem.type === NodeTypeEnum.VariableAggregation) {
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
        console.error('[V3] form submit failed:', error);
        result = false;
      }
      return result;
    },
    [form],
  );

  const doSubmitFormData = useCallback(async (): Promise<boolean> => {
    let result = false;
    // V3:  skillChange ， getWorkflow('skillChange')
    //  workflow.ts  bug，storeWorkflow('skillChange', visible)
    const hasSkillChange = skillChange;
    if (getWorkflow('isModified') === false) {
      // ， skillChange  loading
      if (hasSkillChange) {
        setSkillChange(false);
      }
      return result;
    }
    try {
      setIsModified(false);
      result = await onSaveWorkflow(getWorkflow('drawerForm'));
      if (hasSkillChange) {
        const _res = await service.getNodeConfig(getWorkflow('drawerForm').id);
        const isSuccess = _res.code === Constant.success;
        const data = _res.data;
        if (isSuccess && data && data.nodeConfig[SKILL_FORM_KEY]) {
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
  // V3:  doSubmitFormData  ref（）
  doSubmitFormDataRef.current = doSubmitFormData;

  /**
   *
   *
   * ：TreeNodeTitle  onBlur ， onChange
   * ，blur ，
   *  React ， changeDrawer
   *
   * ：
   * 1.  blur
   * 2.  React
   * 3.  workflowProxy
   */
  const saveCurrentNodeBeforeSwitch = useCallback(
    async (currentNode: ChildNode): Promise<ChildNode> => {
      const currentFormValues = form.getFieldsValue(true);

      const updatedNode = {
        ...currentNode,
        ...currentFormValues, // （ Loop  outputArgs）
        name: currentNode.name,
        nodeConfig: {
          ...currentNode.nodeConfig,
          ...currentFormValues,
        },
      };

      workflowProxy.updateNode(updatedNode);
      graphRef.current?.graphUpdateNode(String(currentNode.id), updatedNode);

      return updatedNode;
    },
    [form, graphRef],
  );

  const changeDrawer = useCallback(async (child: ChildNode | null) => {
    const _isModified = getWorkflow('isModified');
    const _drawerForm = getWorkflow('drawerForm');

    workflowLogger.log(
      '[changeDrawer] node switch, isModified:',
      _isModified,
      'currentNode:',
      _drawerForm?.id,
      '->',
      child?.id,
    );

    // Mark node switching to avoid false positive modifications.
    isNodeSwitchingRef.current = true;
    // Reset in next event loop. 600ms covers throttled update window.
    setTimeout(() => {
      isNodeSwitchingRef.current = false;
    }, 600);

    /**
     * 切换节点前保存当前节点：
     * - 以前依赖 isModified 判断是否需要保存；
     * - 但 isModified 由节流 onValuesChange 更新，存在”刚输入就切换节点”的时序窗口，
     *   可能还是 false，从而跳过保存；
     * - 这里改为直接用最新 Form 值与当前节点做深比较，避免节流时序导致丢值。
     * - 先 blur + 等一个 tick，确保 blur/onChange 触发的表单写入完成后再比较和保存。
     */
    if (_drawerForm?.id !== 0 && _drawerForm?.id !== child?.id) {
      // 1) 先触发 blur，让组件内部把暂存值同步到 Form。
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && typeof activeElement.blur === 'function') {
        activeElement.blur();
      }

      // 2) 等一个宏任务 tick，确保 blur/onChange 触发的表单写入完成。
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 0);
      });

      // 3) 用最新 Form 值做深比较。
      const currentFormValues = form.getFieldsValue(true);
      const hasChanges = checkNodeModified(_drawerForm, currentFormValues);

      if (hasChanges) {
        workflowLogger.log('[changeDrawer] save current node before switch');

        // 触发 blur + 读取最新表单值并写回代理层/画布，再执行保存。
        const updatedDrawerForm = await saveCurrentNodeBeforeSwitch(
          _drawerForm,
        );

        setIsModified(false);
        onSaveWorkflow(updatedDrawerForm)
          .then(() => {
            if (child && child.id !== 0) {
              getReference(child.id);
            }
          })
          .catch((error) => {
            workflowLogger.log('[changeDrawer] save failed:', error);
          });
      } else {
        if (child && child.id !== 0) {
          getReference(child.id);
        }
        // 无变化则不保存，但重置 isModified，避免脏标记残留。
        setIsModified(false);
      }
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

    //  foldWrapItem  visible （ updater  setState）
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

    //  visible  testRun
    setTestRun(false);
    if (newVisible !== _visible) {
      setVisible(newVisible);
    }

    //  storeWorkflowRef， getWorkflow('drawerForm')
    //  handleSpecialPortConnection  drawerForm
    storeWorkflow('drawerForm', newFold);
    //  foldWrapItem
    setFoldWrapItem(newFold);
  }, []);
  // V3:  changeDrawer  ref（）
  changeDrawerRef.current = changeDrawer;

  const validWorkflow = useCallback(async () => {
    return await validationHook.validWorkflow();
  }, [validationHook]);

  // V3:  validWorkflow  ref（）
  validWorkflowRef.current = validWorkflow;

  const handleOperationsChange = useCallback(
    async (val: string) => {
      switch (val) {
        case 'Rename': {
          setShowNameInput(true);
          break;
        }
        case 'Delete': {
          //  getWorkflow  drawerForm， foldWrapItem
          const currentNode = getWorkflow('drawerForm');
          nodeOperationsHook.deleteNode(currentNode.id);
          break;
        }
        case 'Duplicate': {
          //  getWorkflow  drawerForm， foldWrapItem
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

  const handleBack = useCallback(async () => {
    await saveFullWorkflow(
      false,
      () => {
        jumpBack(`/space/${spaceId}/library`);
      },
      () => {
        jumpBack(`/space/${spaceId}/library`);
      },
    );
  }, [saveFullWorkflow, spaceId]);

  const handleDrawerClose = useCallback(() => {
    // TODO  Loop
    graphRef.current?.graphTriggerBlankClick();
  }, []);

  const handleClickBlank = useCallback(() => {
    changeDrawer(null);
    setVisible(false);
  }, []);

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

  const handleNodeClick = (node: ChildNode | null) => {
    if (
      getWorkflow('visible') &&
      node &&
      node.id === getWorkflow('drawerForm').id
    )
      return;

    //  workflowProxy （ graphParams ）
    if (node) {
      const latestNode = workflowProxy.getNodeById(node.id);
      if (latestNode) {
        changeDrawer(latestNode);
        return;
      }
    }
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
    if (visible && node && node.id === getWorkflow('drawerForm').id) return;
    if (node) {
      // 1. ，
      const graph = graphRef.current?.getGraphRef();
      const cell = graph?.getCellById(node.id.toString());
      if (cell) {
        graph?.centerCell(cell);
      }
      // 2.
      selectGraphNode(node.id);
    }
  };

  const createNodeByPortOrEdge = async (
    config: CreateNodeByPortOrEdgeProps,
  ) => {
    const { child, sourceNode, portId, position, targetNode, edgeId } = config;
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

  // V3: （//SPA）
  useBeforeUnload({
    getGraph: () =>
      graphRef.current?.getGraphRef?.() || graphInstanceRef.current,
    onSave: saveFullWorkflow,
  });

  useEffect(() => {
    return () => {
      // V3:
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

      form.resetFields();

      form.setFieldsValue(newFoldWrapItem.nodeConfig);

      setFormDefaultValues({
        type: newFoldWrapItem.type,
        nodeConfig: newFoldWrapItem.nodeConfig,
        form,
      });
    }
  }, [foldWrapItem.id, foldWrapItem.type]);

  useModifiedSaveUpdateV3({
    run: useCallback(async () => {
      const _drawerForm = getWorkflow('drawerForm');
      const currentFormValues = form.getFieldsValue(true);

      if (!checkNodeModified(_drawerForm, currentFormValues)) {
        // console.log('[useModifiedSaveUpdateV3] ，');
        return true;
      }

      return await onSaveWorkflow(_drawerForm);
    }, [form, onSaveWorkflow]),
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

  const throttledHandleGraphUpdate = useThrottledCallback(
    (changedValues: any, fullFormValues: any) => {
      console.log(
        '[throttledHandleGraphUpdate] , changedValues:',
        Object.keys(changedValues),
        'isNodeSwitching:',
        isNodeSwitchingRef.current,
      );
      setIsModified(false);
      handleGraphUpdateByFormData(changedValues, fullFormValues);
      if (!isNodeSwitchingRef.current) {
        setIsModified(true);
      }
    },
    500, // 500ms
    {
      leading: true, //
      trailing: true, //
    },
  );

  // V3: （）
  const { historyState, handleUndo, handleRedo } = useWorkflowHistory({
    graphRef,
    graphInstanceRef,
    debouncedSaveFullWorkflow,
  });

  return (
    <WorkflowVersionProvider version="v3">
      <WorkflowLayout
        hideBack={hideBack}
        isValidLoading={validationHook.isValidLoading}
        info={info}
        setShowCreateWorkflow={setShowCreateWorkflow}
        setShowVersionHistory={setShowVersionHistory}
        handleShowPublish={validationHook.handleShowPublish}
        showPublish={validationHook.showPublish}
        setShowPublish={validationHook.setShowPublish}
        canUndo={historyState.canUndo}
        canRedo={historyState.canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
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
        onBack={handleBack}
      />
    </WorkflowVersionProvider>
  );
};

// V3  Workflow
export default Workflow;
