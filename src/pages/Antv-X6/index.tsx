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
import useAutoSave from '@/hooks/useAutoSave';
import useDisableSaveShortcut from '@/hooks/useDisableSaveShortcut';
import useDrawerScroll from '@/hooks/useDrawerScroll';
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
  handleExceptionNodesNextIndex,
  handleSpecialNodesNextIndex,
  QuicklyCreateEdgeConditionConfig,
  returnBackgroundColor,
  returnImg,
  setFormDefaultValues,
} from '@/utils/workflow';
import { LoadingOutlined } from '@ant-design/icons';
import { Graph } from '@antv/x6';
import { Form, message, Spin } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useModel, useParams } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import NodePanelDrawer from './components/NodePanelDrawer';
import VersionAction from './components/VersionAction';
import ControlPanel from './controlPanel';
import ErrorList from './errorList';
import GraphContainer from './graphContainer';
import Header from './header';
import './index.less';
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

  const params = useParams();
  // 当前工作流的id
  const workflowId = Number(params.workflowId);
  const spaceId = Number(params.spaceId);
  // 当前被选中的节点
  const [foldWrapItem, setFoldWrapItem] =
    useState<ChildNode>(DEFAULT_DRAWER_FORM);

  // 工作流左上角的详细信息
  const [info, setInfo] = useState<IgetDetails | null>();
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
  // 当前画布中的节点和边的数据
  const [graphParams, setGraphParams] = useState<{
    nodeList: ChildNode[];
    edgeList: Edge[];
  }>({ nodeList: [], edgeList: [] });
  // 针对问答节点，试运行的问答参数
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
  const nodeDrawerRef = useRef<NodeDrawerRef>(null);
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
    setSpaceId,
  } = useModel('workflow');
  // 修改更新时间
  const changeUpdateTime = () => {
    const _time = new Date();
    // 修改时间
    setInfo((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        modified: _time.toString(),
      };
    });
  };

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
    if (skillChange) {
      // 处理技能变化时的表单更新
      form.setFieldsValue(foldWrapItem.nodeConfig);
      setSkillChange(false);
    }
  }, [foldWrapItem]);

  // 获取当前画布的信息
  const getDetails = async () => {
    try {
      // 调用接口，获取当前画布的所有节点和边
      const _res = await service.getDetails(workflowId);
      // 获取左上角的信息
      setInfo(_res.data);
      setSpaceId(_res.data.spaceId);
      // 获取节点和边的数据
      const _nodeList = _res.data.nodes;
      const _edgeList = getEdges(_nodeList);
      // 修改数据，更新画布
      setGraphParams({ edgeList: _edgeList, nodeList: _nodeList });
    } catch (error) {
      console.error('Failed to fetch graph data:', error);
    }
  };
  // 修改当前工作流的基础信息
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
  // 获取当前节点的参数
  const getReference = async (id: number): Promise<boolean> => {
    if (id === FoldFormIdEnum.empty || preventGetReference.current === id)
      return false;
    // 获取节点需要的引用参数
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
  // 查询节点的指定信息
  const getNodeConfig = async (id: number): Promise<ChildNode | false> => {
    const _res = await service.getNodeConfig(id);
    if (_res.code === Constant.success) {
      setFoldWrapItem(_res.data);
      graphRef.current?.graphUpdateNode(String(_res.data.id), _res.data);
      return _res.data;
    }
    return false;
  };

  // 节点添加或移除边
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
      updateCurrentNodeRef('sourceNode', {
        nextNodeIds: newNodeIds,
      });
    }
    return newNodeIds;
  };

  // 自动保存节点配置
  const autoSaveNodeConfig = async (
    updateFormConfig: ChildNode,
  ): Promise<boolean> => {
    if (updateFormConfig.id === FoldFormIdEnum.empty) return false;

    const params = cloneDeep(updateFormConfig);
    graphRef.current?.graphUpdateNode(String(params.id), params);
    let result = false;
    const _res = await apiUpdateNode(params);
    if (_res.code === Constant.success) {
      // 如果是修改节点的参数，那么就要更新当前节点的参数
      if (updateFormConfig.id === getWorkflow('drawerForm').id) {
        // TODO 是否应该更新drawerForm
        setFoldWrapItem(params);
      }
      // 跟新当前节点的上级参数
      await getReference(getWorkflow('drawerForm').id);
      changeUpdateTime();
      result = true;
    }
    return result;
  };

  // 更新节点
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
        // 仅更新节点大小和位置 不需要更新form表单
        return true;
      }
      if (targetNodeId) {
        if (params.type === NodeTypeEnum.Loop) {
          // 如果传递的是boolean，那么证明要更新这个节点
          getNodeConfig(Number(nodeData.id));
        }
      }
      // 如果是修改节点的参数，那么就要更新当前节点的参数
      if (params.id === getWorkflow('drawerForm').id) {
        setFoldWrapItem(params);
      }
      // 更新当前节点的上级引用参数
      callback();
      return true;
    }
    return false;
  };
  // 优化后的onFinish方法
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
        console.error('表单提交失败:', error);
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
  }, [setIsModified, form, setSkillChange]);

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
      // 点击增加的节点，需要通过接口获取父节点的数据
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
        console.error('处理节点创建成功后的操作失败:', error);
        // 可以添加用户友好的错误提示
      }
    }
  };
  // 复制节点
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
      // 选中新增的节点
      graphRef.current?.graphSelectNode(String(_res.data.id));
      // changeUpdateTime();
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
            localStorage.removeItem('testRun');
          }
          if (data.data.status === 'STOP_WAIT_ANSWER') {
            setLoading(false);
            setStopWait(true);
            localStorage.setItem('testRun', JSON.stringify(params));
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
              localStorage.removeItem('testRun');
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
            localStorage.setItem('testRun', JSON.stringify(params));
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
        let testRun = localStorage.getItem('testRun') || null;
        if (testRun) {
          _params = {
            ...JSON.parse(testRun),
            ...(params as DefaultObjectType),
          };
          setStopWait(false);
          localStorage.removeItem('testRun');
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
    if (valid) {
      setShowPublish(true);
      setErrorParams({ ...errorParams, errorList: [], show: false });
    }
    if (timer) {
      clearTimeout(timer);
    }
    setIsValidLoading(false);
  };

  // 自动保存
  // 新增定时器逻辑
  useAutoSave({
    interval: 3000,
    run: useCallback(async () => {
      const _drawerForm = getWorkflow('drawerForm');
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

  return (
    <div id="container">
      {/* 顶部的名称和发布等按钮 */}
      <Header
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
              setIsModified(true);
              handleGraphUpdateByFormData(values, form.getFieldsValue(true));
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

      {/*工作流发布弹窗*/}
      <PublishComponentModal
        mode={AgentComponentTypeEnum.Workflow}
        targetId={workflowId}
        spaceId={spaceId}
        category={info?.category}
        open={showPublish}
        // 取消发布
        onCancel={() => setShowPublish(false)}
        onConfirm={handleConfirmPublishWorkflow}
      />
      {/*版本历史*/}
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

export default Workflow;
