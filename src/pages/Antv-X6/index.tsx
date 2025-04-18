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
import { getEdges, returnImg } from '@/utils/workflow';
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
  const { setReferenceList, setIsModified, isModified, setSpaceId } =
    useModel('workflow');
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
  }, [foldWrapItem]);
  // 获取当前画布的信息
  const getDetails = async () => {
    try {
      // 调用接口，获取当前画布的所有节点和边
      const _res = await service.getDetails(workflowId);
      // 获取左上角的信息
      setInfo(_res.data);
      setSpaceId(_res.data.spaceId);
      sessionStorage.setItem('workfolwId', _res.data.id.toString());
      // 获取节点和边的数据
      const _nodeList = _res.data.nodes;
      const _edgeList = getEdges(_nodeList);
      // if (_res.data.extension && _res.data.extension.size) {
      //   graphRef.current.changeGraphZoom(_res.data.extension.size);
      // }
      // 修改数据，更新画布
      setGraphParams({ edgeList: _edgeList, nodeList: _nodeList });
    } catch (error) {
      console.error('Failed to fetch graph data:', error);
    }
  };
  // 修改当前工作流的基础信息
  const onConfirm = async (value: IUpdateDetails) => {
    if (!value.name) return;
    if (showCreateWorkflow) {
      setShowCreateWorkflow(false);
    }
    const _res = await service.updateDetails(value);
    if (_res.code === Constant.success) {
      changeUpdateTime();
      // setInfo({ ...(info as IgetDetails), extension: value.extension });
      if (value.description) {
        getDetails();
      }
    }
  };
  // 调整画布的大小(滚轮)
  const changeGraph = (val: number) => {
    setInfo((prev) => {
      if (!prev || !prev.extension) return prev;
      const numVal = typeof val === 'string' ? parseFloat(val) : val;

      if (prev.extension.size !== numVal) {
        onConfirm({
          id: sessionStorage.getItem('workfolwId')!,
          name: prev.name,
          extension: { size: numVal },
        });
        return { ...prev, extension: { ...prev.extension, size: numVal } };
      }
      return prev;
    });
    graphRef.current.changeGraphZoom(val);
  };
  // 调整画布的大小（左下角select）
  const changeZoom = (val: number | string) => {
    setInfo((prev) => {
      const numVal = typeof val === 'string' ? parseFloat(val) : val;
      if (!prev) {
        return prev;
      }
      if (!prev.extension || prev.extension.size !== numVal) {
        onConfirm({
          id: sessionStorage.getItem('workfolwId')!,
          name: prev.name,
          extension: { size: numVal },
        });
        return { ...prev, extension: { ...prev.extension, size: numVal } };
      }

      return prev;
    });
  };
  // 获取当前节点的参数
  const getRefernece = async (id: number) => {
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
  // 更新节点数据
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
    // setIsUpdate(true)
    const _res = await updateNode(params);

    if (_res.code === Constant.success) {
      if (update) {
        if (typeof update === 'string' && update !== 'moved') {
          // 新增和删除边以后，如果当前的节点是被连接的节点，那么就要更新当前节点的参数
          if (foldWrapItemRef.current.id === Number(update)) {
            getRefernece(Number(update));
          }
        } else {
          setFoldWrapItem(params);
        }
        if (config.type === 'Loop') {
          // 如果传递的是boolean，那么证明要更新这个节点
          getNodeConfig(Number(config.id));
        }
      } else {
        if (config.id === foldWrapItemRef.current.id) {
          // 如果传递的是boolean，那么证明要更新这个节点
          getNodeConfig(Number(config.id));
        }
      }
      if (graphRef.current) {
        graphRef.current.updateNode(params.id, params);
      } else {
        return;
      }
      // setIsModified(false);
      changeUpdateTime();
    }

    // setIsUpdate(false)
  };
  // 优化后的onFinish方法
  const onFinish = async () => {
    try {
      const values = form.getFieldsValue(true);
      let newNodeConfig;
      if (
        ['QA', 'IntentRecognition', 'Condition'].includes(foldWrapItem.type) &&
        foldWrapItemRef.current.id === foldWrapItem.id
      ) {
        const changeNode = changeNodeConfig(
          foldWrapItem.type,
          values,
          foldWrapItemRef.current.nodeConfig,
        );
        newNodeConfig = {
          ...foldWrapItem,
          nodeConfig: {
            ...foldWrapItem.nodeConfig,
            ...changeNode,
          },
        };
      } else {
        newNodeConfig = {
          ...foldWrapItemRef.current,
          nodeConfig: {
            ...foldWrapItemRef.current.nodeConfig,
            ...values,
          },
        };
      }
      await changeNode(newNodeConfig);
      setIsModified(false);
    } catch (error) {
      console.error('表单提交失败:', error);
    }
  };
  // 点击组件，显示抽屉
  const changeDrawer = async (child: ChildNode | null) => {
    setTestRun(false);
    setTestRunResult('');

    setFoldWrapItem((prev) => {
      if (prev.id === 0 && child === null) {
        return prev;
      } else {
        if (prev.id !== 0) {
          onFinish();
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }
        }
        if (child !== null) {
          if (!visible) setVisible(true);
          getRefernece(child.id);
          return child;
        }
        setVisible(false);
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
      // setFoldWrapItem(_res.data);
      changeDrawer(_res.data);
      graphRef.current.selectNode(_res.data.id);
      changeUpdateTime();
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
    const _res = await service.deleteNode(id);
    if (_res.code === Constant.success) {
      // console.log(graphRef.current)
      graphRef.current.deleteNode(id.toString());
      changeUpdateTime();
      // 如果传递了node,证明时循环节点下的子节点
      if (node) {
        // 如果是删除循环节点
        if (node.type === 'Loop') {
          setFoldWrapItem({ ...foldWrapItem, type: NodeTypeEnum.Start });
        } else {
          // 如果是删除循环的子节点,就要更新循环节点的数据
          getNodeConfig(node.loopNodeId as number);
        }
      }
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
  // 添加工作流，插件，知识库，数据库
  const onAdded = (val: CreatedNodeItem, parentFC?: string) => {
    if (parentFC && parentFC !== 'workflow') return;
    let _child: Child;
    if (val.targetType === AgentComponentTypeEnum.Knowledge) {
      _child = {
        name: val.name,
        key: 'general-Node',
        description: val.description,
        type: val.targetType,
        typeId: val.targetId,
        nodeConfig: {
          knowledgeBaseConfigs: [val],
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
    // graphRef.current.addNode(dragEvent, _child);
    setOpen(false);
  };
  // 拖拽组件到画布中
  const dragChild = (child: Child, e?: React.DragEvent<HTMLDivElement>) => {
    // 定义画布大小或获取自父组件/全局状态
    const canvasWidth = 1400;
    const canvasHeight = 600;

    // 获取坐标函数：优先使用拖拽事件坐标，否则生成随机坐标
    const getCoordinates = (
      e?: React.DragEvent<HTMLDivElement>,
    ): { x: number; y: number } => {
      if (e) {
        return { x: e.clientX, y: e.clientY };
      } else {
        return {
          x: Math.floor(canvasWidth / 2),
          y: Math.floor(canvasHeight / 2),
        };
      }
    };

    // 判断是否需要显示特定类型的创建面板
    const isSpecialType = ['Plugin', 'Workflow'].includes(child.type);

    if (isSpecialType) {
      setCreatedItem(child.type as AgentComponentTypeEnum);
      setOpen(true);
      setDragEvent(getCoordinates(e));
    } else {
      const coordinates = getCoordinates(e);
      if (e) {
        e.preventDefault();
      }
      addNode(child, coordinates);
    }
  };
  // 校验当前工作流
  const volidWorkflow = async () => {
    setLoading(false);
    const _res = await service.validWorkflow(info?.id as number);
    if (_res.code === Constant.success) {
      const _arr = _res.data.filter((item) => !item.success);
      if (_arr.length === 0) {
        return true;
      } else {
        setErrorParams({
          show: true,
          errorList: _arr.map((child) => ({
            nodeId: child.nodeId,
            error: child.messages.join(','),
          })),
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
        // 更新时间
        getDetails();
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
    setVisible(false);
    setTimeout(async () => {
      const _res = await service.getDetails(workflowId);
      const _nodeList = _res.data.nodes;
      setGraphParams((prev) => ({ ...prev, nodeList: _nodeList }));
      const volid = await volidWorkflow();
      if (volid) {
        setFoldWrapItem(_res.data.startNode);
        setTestRunResult('');
        setTestRun(true);
        setVisible(true);
      }
    }, 100);
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
      nodeTestRun(params);
    }
    setLoading(true);
  };
  // 右上角的相关操作
  const handleChangeNode = (val: string) => {
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
      default:
        break;
    }
  };
  // 关闭右侧抽屉
  const handleClose = () => {
    if (isModified) {
      onFinish();
    }
    setVisible(false);
  };
  // 保存当前画布中节点的位置
  useEffect(() => {
    getDetails();
    return () => {
      onFinish();
      setIsModified(false); // 重置修改状态
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
      const newFoldWrapItem = JSON.parse(JSON.stringify(foldWrapItem));
      // 重置表单状态
      form.resetFields();
      form.setFieldsValue(newFoldWrapItem.nodeConfig);
      // 处理特殊节点的默认值
      if (foldWrapItem.type === 'HTTPRequest') {
        if (!form.getFieldValue('method')) {
          form.setFieldValue('method', 'GET');
        }
        if (!form.getFieldValue('contentType')) {
          form.setFieldValue('contentType', 'JSON');
        }
      } else if (foldWrapItem.type === 'Variable') {
        if (!form.getFieldValue('configType')) {
          form.setFieldValue('configType', 'SET_VARIABLE');
        }
      } else if (foldWrapItem.type === 'QA') {
        if (!form.getFieldValue('answerType')) {
          form.setFieldValue('answerType', 'TEXT');
        }
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
        changeDrawer={changeDrawer}
        changeEdge={nodeChangeEdge}
        changeCondition={changeNode}
        removeNode={deleteNode}
        copyNode={copyNode}
        changeZoom={changeZoom}
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
        changeDrawer={changeDrawer}
        nodeList={graphParams.nodeList}
      />

      <Published
        id={info?.id || 0}
        open={showPublish}
        onCancel={() => setShowPublish(false)}
        onSubmit={onSubmit}
        loading={loading}
      />
    </div>
  );
};

export default Workflow;
