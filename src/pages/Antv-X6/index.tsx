import Created from '@/components/Created';
import CreateWorkflow from '@/components/CreateWorkflow';
import FoldWrap from '@/components/FoldWrap';
import OtherOperations from '@/components/OtherAction';
import TestRun from '@/components/TestRun';
import Constant from '@/constants/codes.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { testRunList } from '@/constants/node.constants';
import service, {
  IgetDetails,
  IPublish,
  ITestRun,
  IUpdateDetails,
} from '@/services/workflow';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
} from '@/types/enums/agent';
import { NodeTypeEnum } from '@/types/enums/common';
import { WorkflowModeEnum } from '@/types/enums/library';
import { CreatedNodeItem, DefaultObjectType } from '@/types/interfaces/common';
import { ChildNode, Edge } from '@/types/interfaces/graph';
import {
  NodeConfig,
  NodeDrawerRef,
  TestRunparams,
} from '@/types/interfaces/node';
import { ErrorParams } from '@/types/interfaces/workflow';
import { createSSEConnection } from '@/utils/fetchEventSource';
import { changeNodeConfig, updateNode } from '@/utils/updateNode';
import {
  getEdges,
  handleSpecialNodesNextIndex,
  returnImg,
} from '@/utils/workflow';
import { Form, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useModel, useParams } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import ControlPanel from './controlPanel';
import ErrorList from './errorList';
import GraphContainer from './graphContainer';
import Header from './header';
import './index.less';
import { renderNodeContent } from './nodeDrawer';
import Published from './Published';
import { Child } from './type';
const Workflow: React.FC = () => {
  // 当前工作流的id
  const workflowId = Number(useParams().workflowId);
  // 当前被选中的节点
  const [foldWrapItem, setFoldWrapItem] = useState<ChildNode>({
    type: NodeTypeEnum.Start,
    nodeConfig: {
      inputArgs: [], // 输入参数
    },
    id: 0,
    name: '测试',
    description: '测试',
    workflowId: 0,
    icon: '',
  });
  const foldWrapItemRef = useRef(foldWrapItem); // 使用 useRef 存储最新值
  // 显示隐藏右侧节点抽屉
  const [visible, setVisible] = useState(false);
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
  // 当点击连接桩和边时，存储一些数据
  const currentNodeRef = useRef<{
    sourceNode: ChildNode;
    portId: string;
    targetNode?: ChildNode;
    edgeId?: string;
  } | null>(null);
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
  const [testRunparams, setTestRunparams] = useState<TestRunparams>({
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
  // 画布的ref
  const graphRef = useRef<any>(null);
  // 新增定时器引用
  const timerRef = useRef<NodeJS.Timeout>();
  const nodeDrawerRef = useRef<NodeDrawerRef>(null);
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
  // 按钮是否处于loading
  const [loading, setLoading] = useState(false);

  /** -----------------  需要调用接口的方法  --------------------- */
  // 在每次 foldWrapItem 更新时同步到 ref
  useEffect(() => {
    foldWrapItemRef.current = foldWrapItem;
    if (skillChange) {
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
      if (_res.data.extension?.size) {
        graphRef.current.changeGraphZoom(_res.data.extension?.size);
      }
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
  const changeGraph = (val: number) => {
    onConfirm({
      id: workflowId,
      extension: { size: val },
    });
    graphRef.current.changeGraphZoom(val);
  };
  // 调整画布的大小(滚轮)
  const changeZoom = (val: number) => {
    setInfo((prev) => {
      if (!prev) return null;
      if (prev.extension?.size !== val) {
        onConfirm({
          id: workflowId,
          extension: { size: val },
        });
      }
      return {
        ...prev,
        extension: { size: val },
      };
    });
  };
  // 获取当前节点的参数
  const getRefernece = async (id: number) => {
    if (id === 0) return;
    // 如果选中后立刻删除了，那么就不需要再获取参数了
    if (foldWrapItemRef.current.id === 0) return;
    // 获取节点需要的引用参数
    const _res = await service.getOutputArgs(id);
    if (_res.code === Constant.success) {
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
  };
  // 查询节点的指定信息
  const getNodeConfig = async (id: number) => {
    const _res = await service.getNodeConfig(id);
    if (_res.code === Constant.success) {
      setFoldWrapItem(_res.data);
      graphRef.current.updateNode(_res.data.id, _res.data);
    }
  };

  // 节点添加或移除边
  const nodeChangeEdge = async (
    type: string,
    targetId: string,
    sourceNode: ChildNode,
    id?: string,
  ) => {
    // 获取当前节点的nextNodeIds
    const _nextNodeIds =
      sourceNode.nextNodeIds === null
        ? []
        : (sourceNode.nextNodeIds as number[]);
    let _params = {
      nodeId: _nextNodeIds,
      sourceId: Number(sourceNode.id),
    };

    // 根据类型判断，如果type是created，那么就添加边，如果type是deleted，那么就删除边
    if (type === 'created') {
      // 如果有这条边了
      if (_nextNodeIds.includes(Number(targetId))) {
        return;
      } else {
        // 组装参数
        _params.nodeId.push(Number(targetId));
      }
    } else {
      _params.nodeId = _params.nodeId.filter(
        (item) => item !== Number(targetId),
      );
      graphRef.current.updateNode(sourceNode.id, {
        ...sourceNode,
        nextNodeIds: _params.nodeId,
      });
    }
    const _res = await service.addEdge(_params);
    // 如果接口不成功，就需要删除掉那一条添加的线
    if (_res.code !== Constant.success) {
      graphRef.current.deleteEdge(id);
    } else {
      getRefernece(foldWrapItemRef.current.id);
      graphRef.current.updateNode(sourceNode.id, _res.data);
      // getNodeConfig(sourceNode.id);
    }
  };
  // 更新节点
  const changeNode = async (config: ChildNode, update?: boolean | string) => {
    let params = JSON.parse(JSON.stringify(config));
    if (update && update === 'moved') {
      if (config.id === foldWrapItemRef.current.id) {
        const values = nodeDrawerRef.current?.getFormValues();
        params = {
          ...config,
          nodeConfig: {
            ...config.nodeConfig,
            ...values,
            extension: {
              ...config.nodeConfig.extension,
            },
          },
        };
      }
    }
    if (params.id === 0) return;
    graphRef.current.updateNode(params.id, params);
    // setIsUpdate(true)
    const _res = await updateNode(params);
    if (_res.code === Constant.success) {
      if (update) {
        if (update !== 'moved') {
          // 新增和删除边以后，如果当前的节点是被连接的节点，那么就要更新当前节点的参数
          getRefernece(Number(foldWrapItemRef.current.id));
        }
        if (config.type === 'Loop') {
          // 如果传递的是boolean，那么证明要更新这个节点
          getNodeConfig(Number(config.id));
        }
      }
      // 如果是修改节点的参数，那么就要更新当前节点的参数
      if (config.id === foldWrapItemRef.current.id) {
        setFoldWrapItem(params);
      }
      changeUpdateTime();
    }
    // setIsUpdate(false)
  };
  // 优化后的onFinish方法
  const onFinish = async () => {
    try {
      const currentFoldWrapItem = foldWrapItemRef.current; // 保存当前值
      const values = form.getFieldsValue(true);
      let newNodeConfig;
      if (
        (['IntentRecognition', 'Condition'].includes(
          currentFoldWrapItem.type,
        ) ||
          (currentFoldWrapItem.type === 'QA' &&
            values.answerType === 'SELECT')) &&
        currentFoldWrapItem.id === foldWrapItem.id
      ) {
        const changeNode = changeNodeConfig(
          currentFoldWrapItem.type,
          values,
          currentFoldWrapItem.nodeConfig,
        );
        newNodeConfig = {
          ...currentFoldWrapItem,
          nodeConfig: {
            ...currentFoldWrapItem.nodeConfig,
            ...changeNode,
          },
        };
      } else {
        newNodeConfig = {
          ...currentFoldWrapItem,
          nodeConfig: {
            ...currentFoldWrapItem.nodeConfig,
            ...values,
          },
        };
        if (currentFoldWrapItem.type === 'QA') {
          newNodeConfig.nextNodeIds = [];
        }
      }
      await changeNode(newNodeConfig);
      setIsModified(false);
    } catch (error) {
      console.error('表单提交失败:', error);
    }
  };
  // 点击组件，显示抽屉
  const changeDrawer = async (child: ChildNode | null) => {
    // 先完全重置表单
    if (foldWrapItemRef.current.id !== 0) {
      setIsModified(async (modified: boolean) => {
        if (modified === true) {
          await onFinish();
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }
        }
        return false;
      });
    }
    if (child && child.type !== 'Start') {
      setTestRun(false);
      setTestRunResult('');
    }
    // form.resetFields();
    setFoldWrapItem((prev) => {
      if (prev.id === 0 && child === null) {
        return prev;
      } else {
        if (child !== null) {
          if (!visible) setVisible(true);
          getRefernece(child.id);
          return child;
        }
        setVisible(false);
        setTestRun(false);
        return {
          id: 0,
          description: '',
          workflowId: workflowId,
          type: NodeTypeEnum.Start,
          nodeConfig: {},
          name: '',
          icon: '',
        };
      }
    });
  };
  // 新增节点
  const addNode = async (
    child: Child,
    dragEvent: { x: number; y: number; height?: number },
  ) => {
    let _params = JSON.parse(JSON.stringify(child));
    _params.workflowId = workflowId;
    _params.extension = dragEvent;
    // 如果是条件分支，需要增加高度
    if (child.type === 'Condition') {
      _params.extension = { ...dragEvent, height: 120 };
    }
    if (child.type === 'QA') {
      _params.extension = { ...dragEvent, height: 110 };
    }
    if (child.type === 'Loop') {
      _params.extension = { ...dragEvent, height: 240, width: 600 };
    }
    // 查看当前是否有选中的节点以及被选中的节点的type是否是Loop
    // 如果当前选择的是循环节点或者循环内部的子节点，那么就要将他的位置放置于循环内部
    if (foldWrapItem.type === 'Loop' || foldWrapItem.loopNodeId) {
      if (_params.type === 'Loop') {
        message.warning('循环体里请不要再添加循环体');
        return;
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
    const _res = await service.addNode(_params);

    if (_res.code === Constant.success) {
      _res.data.key = _res.data.type === 'Loop' ? 'loop-node' : 'general-Node';
      const extension = _res.data.nodeConfig.extension;
      graphRef.current.addNode(extension, _res.data);
      // 如果是通过created创建的知识库节点或者数据库节点，那么就要更新当前节点，因为添加节点不接收knowledgeBaseConfigs
      if (
        child.type === 'Knowledge' &&
        child.nodeConfig?.knowledgeBaseConfigs
      ) {
        setSkillChange(true);
        changeNode({
          ..._res.data,
          nodeConfig: {
            ..._res.data.nodeConfig,
            knowledgeBaseConfigs: child.nodeConfig.knowledgeBaseConfigs,
          },
        });
      }
      await changeDrawer(_res.data);
      // setFoldWrapItem(_res.data);
      graphRef.current.selectNode(_res.data.id);
      changeUpdateTime();

      if (currentNodeRef.current) {
        const { sourceNode, portId, targetNode, edgeId } =
          currentNodeRef.current;
        const id = portId.split('-')[0];
        const uuid = portId.split('-')[1];
        const isOut = portId.endsWith('out');
        if (portId.length > 15) {
          // 通过中间的数据找到对应的index
          const _params = handleSpecialNodesNextIndex(
            sourceNode,
            uuid,
            _res.data.id,
            targetNode,
          );
          changeNode(_params as ChildNode);
          const sourcePortId = portId.split('-').slice(0, -1).join('-');
          graphRef.current.createNewEdge(sourcePortId, _res.data.id.toString());
        } else {
          // 如果当前源端口是out
          if (isOut) {
            await nodeChangeEdge(
              'created',
              _res.data.id.toString(),
              sourceNode,
            );
            graphRef.current.createNewEdge(
              sourceNode.id.toString(),
              _res.data.id.toString(),
            );
          } else {
            await nodeChangeEdge('created', id, _res.data);
            graphRef.current.createNewEdge(
              _res.data.id.toString(),
              id.toString(),
            );
          }
        }
        // 如果有targetNode,证明是通过边创建的，这里需要连接上下游
        if (targetNode) {
          nodeChangeEdge('created', targetNode.id.toString(), _res.data);
          graphRef.current.createNewEdge(
            _res.data.id.toString(),
            targetNode.id.toString(),
          );
          graphRef.current.deleteEdge(edgeId);
        }

        // 清空currentNodeRef
        currentNodeRef.current = null;
      }
    }
  };
  // 复制节点
  const copyNode = async (child: ChildNode) => {
    const _res = await service.copyNode(child.id.toString());
    if (_res.code === Constant.success) {
      const _newNode = JSON.parse(JSON.stringify(_res.data));
      const _dragEvent = {
        x: _newNode.nodeConfig.extension.x + 20,
        y: _newNode.nodeConfig.extension.y + 20,
      };
      _newNode.nodeConfig.extension.x = _newNode.nodeConfig.extension.x + 32;
      _newNode.nodeConfig.extension.y = _newNode.nodeConfig.extension.y + +32;
      _newNode.key = 'general-Node';
      graphRef.current.addNode(_dragEvent, _newNode);
      changeNode(_res.data);
      // 选中新增的节点
      graphRef.current.selectNode(_res.data.id);
      // changeUpdateTime();
    }
  };
  // 删除指定的节点
  const deleteNode = async (id: number | string, node?: ChildNode) => {
    setVisible(false);
    // if(Number(id)===Number(foldWrapItem.id)){
    // }
    setFoldWrapItem({
      id: 0,
      description: '',
      workflowId: workflowId,
      type: NodeTypeEnum.Start,
      nodeConfig: {},
      name: '',
      icon: '',
    });
    const _res = await service.deleteNode(id);
    if (_res.code === Constant.success) {
      // console.log(graphRef.current)
      graphRef.current.deleteNode(id.toString());
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      changeUpdateTime();
      // 如果传递了node,证明时循环节点下的子节点
      if (node) {
        // 如果是删除循环节点
        if (node.type === 'Loop') {
          changeDrawer(null);
        } else {
          // 如果是删除循环的子节点,就要更新循环节点的数据
          getNodeConfig(node.loopNodeId as number);
        }
      }
    }
  };

  // 添加工作流，插件，知识库，数据库
  const onAdded = (val: CreatedNodeItem, parentFC?: string) => {
    if (parentFC && parentFC !== 'workflow') return;
    let _child: Child;
    if (
      val.targetType === AgentComponentTypeEnum.Knowledge ||
      val.targetType === AgentComponentTypeEnum.Table
    ) {
      const knowledgeBaseConfigs = [
        { ...val, type: val.targetType, knowledgeBaseId: val.targetId },
      ];
      const tableType = sessionStorage.getItem('tableType');
      _child = {
        name: val.name,
        key: 'general-Node',
        description: val.description,
        type:
          val.targetType === AgentComponentTypeEnum.Knowledge
            ? val.targetType
            : tableType || 'TableDataQuery',
        typeId: val.targetId,
        nodeConfig: {
          knowledgeBaseConfigs: knowledgeBaseConfigs,
          extension: {},
        },
      };
    } else {
      _child = {
        name: val.name,
        key: 'general-Node',
        description: val.description,
        type: val.targetType,
        typeId: val.targetId,
      };
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
    child: Child,
    e?: React.DragEvent<HTMLDivElement> | { x: number; y: number },
  ) => {
    // 获取当前画布可视区域中心点
    const getViewportCenter = () => {
      if (graphRef.current) {
        const viewGraph = graphRef.current.getCurrentViewPort();
        return {
          x: viewGraph.x + viewGraph.width / 2 + Math.random() * 100 - 50,
          y: viewGraph.y + viewGraph.height / 2 + Math.random() * 100 - 50,
        };
      }
      return { x: 0, y: 0 };
    };

    // 获取坐标函数：优先使用拖拽事件坐标，否则生成随机坐标
    const getCoordinates = (
      e?: React.DragEvent<HTMLDivElement> | { x: number; y: number },
    ): { x: number; y: number } => {
      if (!e) {
        return getViewportCenter();
      }
      // 检查是否是{x,y}对象
      if ('x' in e && 'y' in e) {
        return { x: e.x, y: e.y };
      }
      // 处理React拖拽事件
      if (e.clientX && e.clientY) {
        return { x: e.clientX, y: e.clientY };
      }
      return getViewportCenter();
    };

    // 判断是否需要显示特定类型的创建面板
    const isSpecialType = ['Plugin', 'Workflow'].includes(child.type);
    // 数据库新增
    const isTableNode = [
      'TableDataAdd',
      'TableDataDelete',
      'TableDataUpdate',
      'TableDataQuery',
      'TableSQL',
    ].includes(child.type);
    if (isSpecialType) {
      setCreatedItem(child.type as AgentComponentTypeEnum);
      setOpen(true);
      setDragEvent(getCoordinates(e));
    } else if (isTableNode) {
      setCreatedItem(AgentComponentTypeEnum.Table);
      setOpen(true);
      setDragEvent(getCoordinates(e));
      sessionStorage.setItem('tableType', child.type);
    } else {
      const coordinates = getCoordinates(e);
      // if (e) {
      //   e.preventDefault();
      // }
      await addNode(child, coordinates);
    }
  };
  // 校验当前工作流
  const volidWorkflow = async () => {
    setLoading(false);

    // 先将数据提交到后端
    const _detail = await service.getDetails(workflowId);
    const _nodeList = _detail.data.nodes;
    setGraphParams((prev) => ({ ...prev, nodeList: _nodeList }));
    changeDrawer(_detail.data.startNode);
    graphRef.current.selectNode(_detail.data.startNode.id);

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
  // 发布，保存数据
  const onSubmit = async (values: IPublish) => {
    const volid = await volidWorkflow();
    if (volid) {
      // 获取所有节点,保存位置
      setLoading(true);
      const _params = { ...values, workflowId: info?.id };
      const _res = await service.publishWorkflow(_params);
      if (_res.code === Constant.success) {
        message.success('发布成功');
        setLoading(false);
        setShowPublish(false);
        const _time = new Date();
        // 更新时间
        setInfo({
          ...(info as IgetDetails),
          ...values,
          modified: _time.toString(),
          publishDate: _time.toString(),
          publishStatus: 'Published',
        });
      }
    }
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
          const _nodeId = data.data.nodeId;
          graphRef.current.selectNode(_nodeId);
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
              setTestRunparams(data.data.result.data);
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
    setIsModified(async (prev: boolean) => {
      if (prev) {
        await onFinish();
      }
      return false;
    });

    const volid = await volidWorkflow();
    if (volid) {
      setTestRunResult('');
      setTestRun(true);
    }
  };
  // 节点试运行
  const runTest = async (type: string, params?: DefaultObjectType) => {
    setErrorParams({
      errorList: [],
      show: false,
    });
    setTestRunResult('');
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
        setIsModified(async (prev: boolean) => {
          if (prev) await onFinish();
          nodeTestRun(params);
          return false;
        });
      } else {
        nodeTestRun(params);
      }
    }
    setLoading(true);
  };
  // 右上角的相关操作
  const handleChangeNode = async (val: string) => {
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
          await onFinish();
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }
        }
        // copyNode(foldWrapItem);
        if (foldWrapItemRef.current.type === 'Start') {
          testRunAll();
        } else {
          setTestRunResult('');
          setTestRun(true);
        }

        break;
      }
      default:
        break;
    }
  };
  // 关闭右侧抽屉
  const handleClose = () => {
    // 清除所有选中
    changeDrawer(null);
    setVisible(false);
  };

  // 更改节点的名称
  const changeFoldWrap = ({
    name,
    description,
  }: {
    name: string;
    description: string;
  }) => {
    const newValue = { ...foldWrapItem, name, description };
    changeNode(newValue);
    setShowNameInput(false);
  };

  // 点击画布中的节点
  const handleNodeClick = (node: ChildNode | null) => {
    // 如果右侧抽屉是再展示的，且就是当前选中的节点，那么就不做任何操作
    if (visible && node && node.id === foldWrapItemRef.current.id) return;
    changeDrawer(node);
  };

  // 通过连接桩或者边创建节点
  const createNodeToPortOrEdge = async (
    child: Child,
    sourceNode: ChildNode,
    portId: string,
    targetNode?: ChildNode,
    edgeId?: string,
  ) => {
    // 获取当前节点的位置
    const _position = sourceNode.nodeConfig.extension as {
      x: number;
      y: number;
    };
    // 根据portid的最后的out和in来判定当前新增的节点是source还是target
    const isOut = portId.endsWith('out');

    const dragPosition = {
      x: _position.x + (isOut ? 300 : -300),
      y: _position?.y,
    };
    // 首先创建节点
    currentNodeRef.current = {
      sourceNode: sourceNode,
      portId: portId,
      targetNode: targetNode,
      edgeId: edgeId,
    };
    await dragChild(child, dragPosition);
  };

  // 保存当前画布中节点的位置
  useEffect(() => {
    getDetails();
    return () => {
      if (isModified) {
        onFinish();
      }
      setIsModified(false); // 重置修改状态
      setVisible(false);
      setTestRun(false);
    };
  }, []);
  // 新增定时器逻辑
  useEffect(() => {
    // 清除已有定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // 创建新定时器
    if (isModified) {
      timerRef.current = setTimeout(() => {
        onFinish();
      }, 3000);
    }
    // 清理函数
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isModified]);
  useEffect(() => {
    if (foldWrapItem.id !== 0) {
      // form.resetFields();
      // 使用setTimeout确保重置完成后再设置新值
      const newFoldWrapItem = JSON.parse(JSON.stringify(foldWrapItem));
      form.resetFields();
      form.setFieldsValue(newFoldWrapItem.nodeConfig);

      switch (foldWrapItem.type) {
        case 'HTTPRequest': {
          if (!newFoldWrapItem.nodeConfig.method) {
            form.setFieldValue('method', 'GET');
          }
          if (!newFoldWrapItem.nodeConfig.contentType) {
            form.setFieldValue('contentType', 'JSON');
          }
          break;
        }
        case 'Variable': {
          if (!newFoldWrapItem.nodeConfig.configType) {
            form.setFieldValue('configType', 'SET_VARIABLE');
          }
          break;
        }
        case 'QA': {
          if (!newFoldWrapItem.nodeConfig.answerType) {
            form.setFieldValue('answerType', 'TEXT');
          }
          break;
        }
        default:
          break;
      }
    }
  }, [foldWrapItem.id]);

  return (
    <div id="container">
      {/* 顶部的名称和发布等按钮 */}
      <Header
        info={info ?? {}}
        setShowCreateWorkflow={() => setShowCreateWorkflow(true)}
        showPublish={() => setShowPublish(true)}
      />
      <GraphContainer
        graphParams={graphParams}
        ref={graphRef}
        changeDrawer={handleNodeClick}
        changeEdge={nodeChangeEdge}
        changeCondition={changeNode}
        removeNode={deleteNode}
        copyNode={copyNode}
        changeZoom={changeZoom}
        createNodeToPortOrEdge={createNodeToPortOrEdge}
      />
      <ControlPanel
        dragChild={dragChild}
        foldWrapItem={foldWrapItem}
        changeGraph={changeGraph}
        handleTestRun={() => testRunAll()}
        zoomSize={(info?.extension?.size as number) ?? 1}
      />
      <FoldWrap
        className="fold-wrap-style"
        lineMargin
        title={foldWrapItem.name}
        visible={visible}
        onClose={handleClose}
        description={foldWrapItem.description}
        icon={returnImg(foldWrapItem.type)}
        showNameInput={showNameInput}
        changeFoldWrap={changeFoldWrap}
        otherAction={
          <OtherOperations
            onChange={handleChangeNode}
            testRun={testRunList.includes(foldWrapItem.type)}
            action={
              foldWrapItem.type !== 'Start' && foldWrapItem.type !== 'End'
            }
          />
        }
      >
        <div className="dispose-node-style">
          <Form
            form={form}
            layout={'vertical'}
            onFinishFailed={onFinish}
            onFinish={onFinish}
            onValuesChange={() => {
              setIsModified(true);
            }}
          >
            {renderNodeContent(foldWrapItem, form)}
          </Form>
        </div>
      </FoldWrap>
      <Created
        checkTag={createdItem as AgentComponentTypeEnum}
        onAdded={onAdded}
        open={open}
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
        visible={visible}
        testRunResult={testRunResult}
        clearRunResult={() => setTestRunResult('')}
        loading={loading}
        stopWait={stopWait}
        formItemValue={formItemValue}
        testRunparams={testRunparams}
      />

      <CreateWorkflow
        onConfirm={onConfirm}
        onCancel={() => setShowCreateWorkflow(false)}
        open={showCreateWorkflow}
        type={WorkflowModeEnum.Update}
        {...info}
      />

      <ErrorList
        visible={visible}
        errorList={errorParams.errorList}
        show={errorParams.show}
        onClose={() =>
          setErrorParams({ ...errorParams, errorList: [], show: false })
        }
        changeDrawer={handleNodeClick}
        nodeList={graphParams.nodeList}
      />

      <Published
        id={info?.id || 0}
        open={showPublish}
        onCancel={() => setShowPublish(false)}
        onSubmit={onSubmit}
        loading={loading}
        scope={info && info.scope ? info.scope : undefined}
      />
    </div>
  );
};

export default Workflow;
