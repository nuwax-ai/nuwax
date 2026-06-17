/**
 *
 *
 *  v1  v3 ：
 * - v1: （）
 * - v3: （）
 *
 *  config.ts
 */

import Created from '@/components/Created';
import CreateWorkflow from '@/components/CreateWorkflow';
import FoldWrap from '@/components/FoldWrap';
import OtherOperations from '@/components/OtherAction';
import PublishComponentModal from '@/components/PublishComponentModal';
import TestRun from '@/components/TestRun';
import VersionHistory from '@/components/VersionHistory';
import Constant from '@/constants/codes.constants';
import { CREATED_TABS } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import {
  DEFAULT_DRAWER_FORM,
  SKILL_FORM_KEY,
  testRunList,
} from '@/constants/node.constants';
import useDisableSaveShortcut from '@/hooks/useDisableSaveShortcut';
import useDrawerScroll from '@/hooks/useDrawerScroll';
import useModifiedSaveUpdate from '@/hooks/useModifiedSaveUpdate';
import { useThrottledCallback } from '@/hooks/useThrottledCallback';
import { t } from '@/services/i18nRuntime';
import type { AddNodeResponse } from '@/services/workflow';
import service, {
  IgetDetails,
  ITestRun,
  IUpdateDetails,
} from '@/services/workflow';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
} from '@/types/enums/agent';
import {
  AnswerTypeEnum,
  CreateUpdateModeEnum,
  NodeShapeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import {
  FoldFormIdEnum,
  NodeSizeGetTypeEnum,
  NodeUpdateEnum,
  PortGroupEnum,
  UpdateEdgeType,
} from '@/types/enums/node';
import { CreatedNodeItem, DefaultObjectType } from '@/types/interfaces/common';
import {
  ChangeEdgeProps,
  ChangeNodeProps,
  ChildNode,
  CreateNodeByPortOrEdgeProps,
  CurrentNodeRefProps,
  Edge,
  GraphContainerRef,
  GraphRect,
  RunResultItem,
  StencilChildNode,
} from '@/types/interfaces/graph';
import {
  CurrentNodeRefKey,
  NodeConfig,
  NodeDrawerRef,
  TestRunParams,
} from '@/types/interfaces/node';
import { ErrorParams } from '@/types/interfaces/workflow';
import { cloneDeep, noop } from '@/utils/common';
import { createSSEConnection } from '@/utils/fetchEventSource';
import { calculateNodePosition, getCoordinates } from '@/utils/graph';
import { updateNodeEdges } from '@/utils/updateEdge';
import {
  apiUpdateNode,
  changeNodeConfig,
  updateCurrentNode,
  updateSkillComponentConfigs,
} from '@/utils/updateNode';
import {
  getEdges,
  getNodeSize,
  getShape,
  getWorkflowTestRun,
  handleExceptionNodesNextIndex,
  handleSpecialNodesNextIndex,
  QuicklyCreateEdgeConditionConfig,
  removeWorkflowTestRun,
  returnBackgroundColor,
  returnImg,
  setFormDefaultValues,
  setWorkflowTestRun,
} from '@/utils/workflow';
import { LoadingOutlined } from '@ant-design/icons';
import { Graph } from '@antv/x6';
import { Form, message, Spin } from 'antd';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useLocation, useModel, useParams } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import NodePanelDrawer from './components/NodePanelDrawer';
import VersionAction from './components/VersionAction';
import ControlPanel from './controlPanel';
import ErrorList from './errorList';
import GraphContainer from './graphContainer';
import Header from './header';
import './index.less';

// V3
import { WORKFLOW_CONFIG } from './config';
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
  } = useModel('workflow');

  const location = useLocation();

  const params = useParams();
  // id
  const workflowId = Number(params.workflowId);
  const spaceId = Number(params.spaceId);
  const [foldWrapItem, setFoldWrapItem] =
    useState<ChildNode>(DEFAULT_DRAWER_FORM);

  const [info, setInfo] = useState<IgetDetails | null>();
  const [testRunResult, setTestRunResult] = useState<string>('');
  const [stopWait, setStopWait] = useState<boolean>(false);
  const [showPublish, setShowPublish] = useState<boolean>(false);
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
  const [testRunLoading, setTestRunLoading] = useState<boolean>(false);
  const currentNodeRef = useRef<CurrentNodeRefProps | null>(null);
  // form
  const [form] = Form.useForm<NodeConfig>();
  const [showNameInput, setShowNameInput] = useState<boolean>(false);
  const [graphParams, setGraphParams] = useState<{
    nodeList: ChildNode[];
    edgeList: Edge[];
  }>({ nodeList: [], edgeList: [] });
  const [testRunParams, setTestRunParams] = useState<TestRunParams>({
    question: '',
    options: [],
  });
  const [formItemValue, setFormItemValue] = useState<DefaultObjectType>({});
  const [errorParams, setErrorParams] = useState<ErrorParams>({
    errorList: [],
    show: false,
  });
  const [isValidLoading, setIsValidLoading] = useState<boolean>(false);
  // ref
  const graphRef = useRef<GraphContainerRef>(null);
  const preventGetReference = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout>();
  const nodeDrawerRef = useRef<NodeDrawerRef>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  // loading
  const [loading, setLoading] = useState(false);
  const { setTestRun } = useModel('model');

  // 是否隐藏返回箭头
  const [hideBack, setHideBack] = useState<boolean>(false);
  // useModel
  const {
    setReferenceList,
    setIsModified,
    skillChange,
    setSkillChange,
    isModified,
    setSpaceId,
  } = useModel('workflow');
  const changeUpdateTime = () => {
    const _time = new Date();
    setInfo((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        modified: _time.toString(),
      };
    });
  };

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
  /** -----------------    --------------------- */
  //  foldWrapItem  model  drawerForm
  useEffect(() => {
    //  setDrawerForm
    storeWorkflow('drawerForm', foldWrapItem);
    if (skillChange) {
      form.setFieldsValue(foldWrapItem.nodeConfig);
      setSkillChange(false);
    }
  }, [foldWrapItem]);

  const getDetails = async () => {
    try {
      const _res = await service.getDetails(workflowId);
      setInfo(_res.data);
      setSpaceId(_res.data.spaceId);
      const _nodeList = _res.data.nodes;
      const _edgeList = getEdges(_nodeList);
      setGraphParams({ edgeList: _edgeList, nodeList: _nodeList });
    } catch (error) {
      console.error('Failed to fetch graph data:', error);
    }
  };
  const onConfirm = async (value: IUpdateDetails) => {
    // if (!value.name) return;
    if (showCreateWorkflow) {
      setShowCreateWorkflow(false);
    }
    const _res = await service.updateDetails(value);
    if (_res.code === Constant.success) {
      changeUpdateTime();
      // setInfo({ ...(info as IgetDetails), extension: value.extension });
      getDetails();
    }
  };
  // （select）
  const changeGraph = (val: number | string) => {
    if (val === -1) {
      graphRef.current?.graphChangeZoomToFit();
    } else {
      graphRef.current?.graphChangeZoom(val as number);
    }
  };
  const changeZoom = (val: number) => {
    setInfo((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        extension: { size: val },
      };
    });
  };
  const getReference = async (id: number): Promise<boolean> => {
    if (id === FoldFormIdEnum.empty || preventGetReference.current === id)
      return false;
    const _res = await service.getOutputArgs(id);
    const isSuccess = _res.code === Constant.success;
    if (isSuccess) {
      if (
        _res.data &&
        _res.data.previousNodes &&
        _res.data.previousNodes.length
      ) {
        setReferenceList(_res.data);
      } else {
        setReferenceList({
          previousNodes: [],
          innerPreviousNodes: [],
          argMap: {},
        });
      }
    }
    return isSuccess;
  };
  const getNodeConfig = async (id: number): Promise<ChildNode | false> => {
    const _res = await service.getNodeConfig(id);
    if (_res.code === Constant.success) {
      setFoldWrapItem(_res.data);
      graphRef.current?.graphUpdateNode(String(_res.data.id), _res.data);
      return _res.data;
    }
    return false;
  };

  const nodeChangeEdge = async (
    config: ChangeEdgeProps,
    callback: () => Promise<boolean> | void = () =>
      getReference(getWorkflow('drawerForm').id),
  ) => {
    const { type, targetId, sourceNode, id } = config;
    if (!graphRef.current) return false;
    const { graphUpdateNode, graphDeleteEdge } = graphRef.current;
    const newNodeIds = await updateNodeEdges({
      type,
      targetId,
      sourceNode,
      id,
      graphUpdateNode,
      graphDeleteEdge,
      callback,
    });

    if (newNodeIds) {
      changeUpdateTime();
      updateCurrentNodeRef('sourceNode', {
        nextNodeIds: newNodeIds,
      });
    }
    return newNodeIds;
  };

  const autoSaveNodeConfig = async (
    updateFormConfig: ChildNode,
  ): Promise<boolean> => {
    if (updateFormConfig.id === FoldFormIdEnum.empty) return false;

    const params = cloneDeep(updateFormConfig);
    graphRef.current?.graphUpdateNode(String(params.id), params);
    let result = false;
    const _res = await apiUpdateNode(params);
    if (_res.code === Constant.success) {
      if (updateFormConfig.id === getWorkflow('drawerForm').id) {
        // TODO drawerForm
        setFoldWrapItem(params);
      }
      await getReference(getWorkflow('drawerForm').id);
      changeUpdateTime();
      result = true;
    }
    return result;
  };

  const changeNode = async (
    { nodeData, update, targetNodeId }: ChangeNodeProps,
    callback: () => Promise<boolean> | void = () =>
      getReference(getWorkflow('drawerForm').id),
  ): Promise<boolean> => {
    let params = cloneDeep(nodeData);
    const isOnlyUpdate = update && update === NodeUpdateEnum.moved;
    if (isOnlyUpdate) {
      if (nodeData.id === getWorkflow('drawerForm').id) {
        const values = nodeDrawerRef.current?.getFormValues();
        params = {
          ...nodeData,
          nodeConfig: {
            ...nodeData.nodeConfig,
            ...values,
            extension: {
              ...nodeData.nodeConfig.extension,
            },
          },
        };
      }
    }
    if (params.id === FoldFormIdEnum.empty) return false;
    graphRef.current?.graphUpdateNode(String(params.id), params);
    const _res = await apiUpdateNode(params);
    const isSuccess = _res && _res.code === Constant.success;
    if (isSuccess) {
      changeUpdateTime();
      if (isOnlyUpdate) {
        //  form
        return true;
      }
      if (targetNodeId) {
        if (params.type === NodeTypeEnum.Loop) {
          // boolean，
          getNodeConfig(Number(nodeData.id));
        }
      }
      if (params.id === getWorkflow('drawerForm').id) {
        setFoldWrapItem(params);
      }
      callback();
      return true;
    }
    return false;
  };
  // onFinish
  const onSaveWorkflow = useCallback(
    async (currentFoldWrapItem: ChildNode): Promise<boolean> => {
      let result = false;
      try {
        const values = form.getFieldsValue(true);
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
        console.error('[Workflow] form submit failed:', error);
        result = false;
      }
      return result;
    },
    [form],
  );

  const doSubmitFormData = useCallback(async (): Promise<boolean> => {
    let result = false;
    const hasSkillChange = getWorkflow('skillChange');
    if (getWorkflow('isModified') === false) return result;
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
  }, [setIsModified, form, setSkillChange]);

  const changeDrawer = useCallback(async (child: ChildNode | null) => {
    const _isModified = getWorkflow('isModified');
    const _drawerForm = getWorkflow('drawerForm');

    if (_isModified === true && _drawerForm?.id !== 0) {
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

  /**
   *
   * @param nodeType
   * @returns
   */
  const isConditionalNode = (nodeType: string): boolean => {
    return (
      nodeType === NodeTypeEnum.Condition ||
      nodeType === NodeTypeEnum.IntentRecognition
    );
  };

  /**
   *
   * @param nodeData
   * @param knowledgeBaseConfigs
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
   * （ID）
   * @param sourceNode
   * @param portId ID
   * @param newNodeId ID
   * @param targetNode
   * @param isLoop
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
   *
   * @param sourceNode
   * @param portId ID
   * @param newNodeId ID
   * @param targetNode
   * @param isLoop
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
   *
   * @param newNodeId ID
   * @param sourceNode
   * @param isLoop
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
   *
   * @param newNode
   * @param targetNode
   * @param isLoop
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
   *
   * @param newNodeId ID
   * @param targetNodeId ID
   * @param newNode
   * @param isLoop
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
   *
   * @param newNode
   * @param sourceNode
   * @param portId ID
   * @param isLoop
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
   *
   * @param newNode
   * @param targetNode
   * @param sourceNode
   * @param edgeId ID
   * @param isLoop
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
   *
   * @param nodeData
   * @param child
   */
  const handleNodeCreationSuccess = async (
    nodeData: AddNodeResponse,
    child: Partial<ChildNode>,
  ) => {
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

    graphRef.current?.graphAddNode(extension as GraphRect, newNodeData);

    if (
      child.type === NodeTypeEnum.Knowledge &&
      child.nodeConfig?.knowledgeBaseConfigs
    ) {
      await handleKnowledgeNodeConfig(
        newNodeData,
        child.nodeConfig.knowledgeBaseConfigs,
      );
    }
    await changeDrawer(newNodeData);
    graphRef.current?.graphSelectNode(String(nodeData.id));
    changeUpdateTime();

    if (currentNodeRef.current) {
      const { portId, edgeId } = currentNodeRef.current;
      const isLoop = Boolean(nodeData.loopNodeId);
      const isOut = portId.endsWith('out');
      try {
        if (portId.includes(PortGroupEnum.exception)) {
          await handleExceptionPortConnection({
            sourceNode: currentNodeRef.current.sourceNode,
            portId,
            newNodeId: nodeData.id,
            targetNode: currentNodeRef.current.targetNode,
            isLoop,
          });
        } else if (portId.length > 15) {
          await handleSpecialPortConnection({
            sourceNode: currentNodeRef.current.sourceNode,
            portId,
            newNodeId: nodeData.id,
            targetNode: currentNodeRef.current.targetNode,
            isLoop,
          });
        } else if (isOut) {
          await handleOutputPortConnection({
            newNodeId: nodeData.id,
            sourceNode: currentNodeRef.current.sourceNode,
            isLoop,
          });
        } else {
          await handleInputPortConnection({
            newNode: newNodeData,
            sourceNode: currentNodeRef.current.sourceNode,
            portId,
            isLoop,
          });
        }

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
        console.error('[Workflow] node connection handling failed:', error);
        throw error;
      } finally {
        currentNodeRef.current = null;
      }
    }
  };

  const addNode = async (child: Partial<ChildNode>, dragEvent: GraphRect) => {
    let _params = JSON.parse(JSON.stringify(child));
    _params.workflowId = workflowId;
    _params.extension = dragEvent;
    const { width, height } = getNodeSize({
      data: _params,
      ports: [],
      type: NodeSizeGetTypeEnum.create,
    });
    const fixedSizeNodeTypes = [
      NodeTypeEnum.Condition,
      NodeTypeEnum.QA,
      NodeTypeEnum.IntentRecognition,
      NodeTypeEnum.Loop,
    ];

    if (child.type && fixedSizeNodeTypes.includes(child.type)) {
      _params.extension = {
        ...dragEvent,
        height,
        width,
      };
    }
    // typeLoop
    if (foldWrapItem.type === NodeTypeEnum.Loop || foldWrapItem.loopNodeId) {
      if (_params.type === NodeTypeEnum.Loop) {
        message.warning(t('PC.Pages.AntvX6Workflow.cannotNestLoop'));
        return false;
      }
      _params.loopNodeId =
        Number(foldWrapItem.loopNodeId) || Number(foldWrapItem.id);
      const _parent = await service.getNodeConfig(_params.loopNodeId);
      if (_parent.code === Constant.success) {
        const loopNode: ChildNode = _parent.data;
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

    const { nodeConfig, ...rest } = _params;
    const _res = await service.apiAddNode({
      nodeConfigDto: { ...nodeConfig },
      ...rest,
    });

    if (_res.code === Constant.success) {
      try {
        await handleNodeCreationSuccess(_res.data, child);
      } catch (error) {
        console.error('[Workflow] post-create node handling failed:', error);
      }
    }
  };
  const copyNode = async (child: ChildNode) => {
    const _res = await service.apiCopyNode(child.id.toString());
    if (_res.code === Constant.success) {
      const { nodeConfig, ...rest } = _res.data;
      const resExtension = nodeConfig?.extension || {};
      const { toolName, mcpId } = child.nodeConfig || {};
      const _newNode = {
        ...rest,
        shape: getShape(_res.data.type),
        nodeConfig: {
          ...nodeConfig,
          ...(toolName ? { toolName, mcpId } : {}),
          extension: {
            ...resExtension,
            x: (resExtension.x || 0) + 32,
            y: (resExtension.y || 0) + 32,
          },
        },
      };

      const extension = {
        x: (resExtension.x || 0) + 20,
        y: (resExtension.y || 0) + 20,
      };

      graphRef.current?.graphAddNode(extension as GraphRect, _newNode);
      const shape = getShape(_res.data.type);
      const newNode = {
        ..._res.data,
        shape,
      };
      changeNode({ nodeData: newNode });
      graphRef.current?.graphSelectNode(String(_res.data.id));
      // changeUpdateTime();
    }
  };
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
    const _res = await service.apiDeleteNode(id);
    if (_res.code === Constant.success) {
      graphRef.current?.graphDeleteNode(String(id));
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
    }
  };

  // ，，， mcp
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
      message.warning(t('PC.Pages.AntvX6Workflow.unsupportedComponentType'));
      return;
    }

    addNode(_child, dragEvent);
    if (sessionStorage.getItem('tableType')) {
      sessionStorage.removeItem('tableType');
    }
    // graphRef.current.addNode(dragEvent, _child);
    setOpen(false);
  };
  const dragChild = async (
    child: StencilChildNode,
    position?: React.DragEvent<HTMLDivElement> | GraphRect,
    continueDragCount?: number,
  ) => {
    const childType = child?.type || '';

    const isSpecialType = [
      NodeTypeEnum.Plugin,
      NodeTypeEnum.Workflow,
      NodeTypeEnum.MCP,
    ].includes(childType);

    const isTableNode = [
      'TableDataAdd',
      'TableDataDelete',
      'TableDataUpdate',
      'TableDataQuery',
      'TableSQL',
    ].includes(childType);

    const viewGraph = graphRef.current?.getCurrentViewPort();
    if (isSpecialType) {
      setCreatedItem(childType as unknown as AgentComponentTypeEnum); //
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
      await addNode(child as ChildNode, coordinates);
    }
  };
  const validWorkflow = async () => {
    setLoading(false);

    if (getWorkflow('isModified') === true) {
      await doSubmitFormData();
    }
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
  // const onSubmit = async (values: IPublish) => {
  //   const volid = await validWorkflow();
  //   if (volid) {
  //     setLoading(true);
  //     const _params = { ...values, workflowId: info?.id };
  //     const _res = await service.publishWorkflow(_params);
  //     if (_res.code === Constant.success) {
  //       setLoading(false);
  //       setShowPublish(false);
  //       const _time = new Date();
  //       setInfo({
  //         ...(info as IgetDetails),
  //         ...values,
  //         modified: _time.toString(),
  //         publishDate: _time.toString(),
  //         publishStatus: 'Published',
  //   } else {
  //     setShowPublish(false);

  const handleConfirmPublishWorkflow = () => {
    setShowPublish(false);
    const _time = new Date();
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
  const nodeTestRun = async (params?: DefaultObjectType) => {
    const _params = {
      nodeId: foldWrapItem.id,
      params,
    };
    setTestRunResult('');

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
        // UI...
      },
      onError: (error) => {
        console.error('[Workflow] streaming request error:', error);
      },
      onOpen: (response) => {
        console.log('[Workflow] connection established', response.status);
      },
      onClose: () => {
        setLoading(false);
      },
    });
    abortConnection();
  };
  const testRunAllNode = async (params: ITestRun) => {
    // await getDetails();
    setLoading(true);
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
          // 1.     x6focus
          // 2.
          // 3.
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
        // UI...
      },
      onError: (error) => {
        console.error('[Workflow] streaming request error:', error);
      },
      onOpen: (response) => {
        console.log('[Workflow] connection established', response.status);
      },
      onClose: () => {
        setLoading(false);
      },
    });
    abortConnection();
    // } else {
    //   return;
    changeUpdateTime();
  };

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
      console.error('[Workflow] run-all test failed:', error);
    } finally {
      clearTimeout(loadingTimer);
      setTestRunLoading(false);
    }
  };

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
            requestId: uuidv4(), // uuidID
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
    await dragChild(child, newPosition);
  };

  useLayoutEffect(() => {
    const _hideBack = new URLSearchParams(location.search)?.get('hideBack');
    const _hideBackValue = _hideBack ? Boolean(_hideBack) : false;

    setHideBack(_hideBackValue);
  }, [location]);

  useEffect(() => {
    getDetails();
    return () => {
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

  const validPublishWorkflow = async () => {
    setLoading(false);

    if (getWorkflow('isModified') === true) {
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

  useModifiedSaveUpdate({
    run: useCallback(async () => {
      const _drawerForm = getWorkflow('drawerForm');
      // console.log(
      //   'useModifiedSaveUpdate: run: onSaveWorkflow',
      //   _drawerForm.id,
      //   JSON.stringify(_drawerForm.nodeConfig),
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
      setIsModified(false);
      handleGraphUpdateByFormData(changedValues, fullFormValues);
      setIsModified(true);
    },
    500, // 500ms
    {
      leading: true, //
      trailing: true, //
    },
  );

  return (
    <div id="container">
      {/*  */}
      <Header
        hideBack={hideBack}
        isValidLoading={isValidLoading}
        info={info ?? {}}
        onToggleVersionHistory={() => setShowVersionHistory(true)}
        setShowCreateWorkflow={() => setShowCreateWorkflow(true)}
        showPublish={handleShowPublish}
      />
      <Spin
        spinning={globalLoadingTime > 0}
        indicator={<LoadingOutlined spin />}
        wrapperClassName="spin-workflow-global-style"
      >
        <GraphContainer
          graphParams={graphParams}
          ref={graphRef}
          changeDrawer={handleNodeClick}
          changeEdge={nodeChangeEdge}
          changeCondition={changeNode}
          removeNode={deleteNode}
          copyNode={copyNode}
          changeZoom={changeZoom}
          createNodeByPortOrEdge={createNodeByPortOrEdge}
          onSaveNode={handleSaveNode}
          onClickBlank={handleClickBlank}
          onInit={handleInitLoading}
          onRefresh={handleRefreshGraph}
        />
      </Spin>
      <ControlPanel
        dragChild={dragChild}
        foldWrapItem={foldWrapItem}
        changeGraph={changeGraph}
        handleTestRun={testRunAll}
        testRunLoading={testRunLoading}
        zoomSize={(info?.extension?.size as number) ?? 1}
      />
      <FoldWrap
        className="fold-wrap-style"
        lineMargin
        title={foldWrapItem.name}
        visible={visible}
        key={`${foldWrapItem.type}-${foldWrapItem.id}-foldWrap`}
        onClose={handleDrawerClose}
        description={foldWrapItem.description}
        backgroundColor={returnBackgroundColor(foldWrapItem.type)}
        icon={returnImg(foldWrapItem.type)}
        showNameInput={showNameInput}
        changeFoldWrap={changeFoldWrap}
        otherAction={
          <OtherOperations
            onChange={handleOperationsChange}
            testRun={testRunList.includes(foldWrapItem.type)}
            nodeType={foldWrapItem.type}
            action={
              foldWrapItem.type !== NodeTypeEnum.Start &&
              foldWrapItem.type !== NodeTypeEnum.End
            }
          />
        }
      >
        <div className="dispose-node-style">
          <Form
            form={form}
            layout={'vertical'}
            onFinishFailed={doSubmitFormData}
            onFinish={doSubmitFormData}
            key={`${foldWrapItem.type}-${foldWrapItem.id}-form`}
            clearOnDestroy={true}
            onValuesChange={(values) => {
              throttledHandleGraphUpdate(values, form.getFieldsValue(true));
            }}
          >
            <NodePanelDrawer
              params={foldWrapItem}
              key={`${foldWrapItem.type}-${foldWrapItem.id}-nodePanelDrawer`}
            />
          </Form>
        </div>
      </FoldWrap>
      <Created
        checkTag={createdItem as AgentComponentTypeEnum}
        onAdded={onAdded}
        open={open}
        tabs={workflowCreatedTabs}
        addComponents={[
          {
            type: AgentComponentTypeEnum.Workflow,
            targetId: workflowId,
            status: AgentAddComponentStatusEnum.Added,
          },
        ]}
        onCancel={() => setOpen(false)}
      />
      <TestRun
        node={foldWrapItem}
        run={runTest}
        testRunResult={testRunResult}
        clearRunResult={handleClearRunResult}
        loading={loading}
        stopWait={stopWait}
        formItemValue={formItemValue}
        testRunParams={testRunParams}
      />

      <CreateWorkflow
        onConfirm={onConfirm}
        onCancel={() => setShowCreateWorkflow(false)}
        open={showCreateWorkflow}
        type={CreateUpdateModeEnum.Update}
        {...info}
      />

      <ErrorList
        visible={visible}
        errorList={errorParams.errorList}
        show={errorParams.show}
        onClose={() =>
          setErrorParams({ ...errorParams, errorList: [], show: false })
        }
        onClickItem={handleErrorNodeClick}
        nodeList={graphParams.nodeList}
      />

      {/**/}
      <PublishComponentModal
        mode={AgentComponentTypeEnum.Workflow}
        targetId={workflowId}
        spaceId={spaceId}
        category={info?.category}
        open={showPublish}
        onCancel={() => setShowPublish(false)}
        onConfirm={handleConfirmPublishWorkflow}
      />
      {/**/}
      <VersionHistory
        targetId={workflowId}
        targetName={info?.name}
        targetType={AgentComponentTypeEnum.Workflow}
        permissions={info?.permissions || []}
        visible={showVersionHistory}
        isDrawer={true}
        onClose={() => setShowVersionHistory(false)}
        renderActions={(item) => (
          <VersionAction
            data={item}
            onRefresh={handleRefreshGraph}
            onClose={() => setShowVersionHistory(false)}
          />
        )}
      />
    </div>
  );
};

// V3 （，）
const WorkflowV3 = React.lazy(() => import('./v3/indexV3'));

/**
 *
 *  v1  v3
 * ：V3 > V1
 */
const WorkflowEntry: React.FC = () => {
  // V3
  if (WORKFLOW_CONFIG.useV3) {
    return (
      <React.Suspense
        fallback={
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
            }}
          >
            <Spin
              size="large"
              tip={t('PC.Pages.AntvX6Workflow.loadingV3Version')}
            />
          </div>
        }
      >
        <WorkflowV3 />
      </React.Suspense>
    );
  }

  //  v1
  return <Workflow />;
};

export default WorkflowEntry;
