import Created from '@/components/Created';
import CreateWorkflow from '@/components/CreateWorkflow';
import TestRun from '@/components/TestRun';
import Constant from '@/constants/codes.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import type { IgetDetails } from '@/services/workflow';
import service, { IUpdateDetails } from '@/services/workflow';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { NodeTypeEnum } from '@/types/enums/common';
import { WorkflowModeEnum } from '@/types/enums/library';
import { CreatedNodeItem, DefaultObjectType } from '@/types/interfaces/common';
import { ChildNode, Edge } from '@/types/interfaces/graph';
import { NodePreviousAndArgMap } from '@/types/interfaces/node';
import { createSSEConnection } from '@/utils/fetchEventSource';
import { getNodeRelation, updateNode } from '@/utils/updateNode';
import { getEdges } from '@/utils/workflow';
import { message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useModel, useParams } from 'umi';
import ControlPanel from './controlPanel';
import ErrorList from './errorList';
import GraphContainer from './graphContainer';
import Header from './header';
import './index.less';
import NodeDrawer from './nodeDrawer';
import { Child } from './type';
const Workflow: React.FC = () => {
  // 当前工作流的id
  const workflowId = Number(useParams().workflowId);
  // 显示隐藏右侧节点抽屉
  const [visible, setVisible] = useState(false);
  // 右侧抽屉的部分信息
  const [foldWrapItem, setFoldWrapItem] = useState<ChildNode>({
    id: 0,
    description: '',
    workflowId: workflowId,
    type: NodeTypeEnum.Start,
    nodeConfig: {
      extension: {
        x: 0,
        y: 0,
      },
    },
    name: '',
    icon: '',
  });
  // 工作流左上角的详细信息
  const [info, setInfo] = useState<IgetDetails | null>(null);
  // 定义一个节点试运行返回值
  const [testRunResult, setTestRunResult] = useState<string>('');

  // 上级节点的输出参数
  const [referenceList, setReferenceList] = useState<NodePreviousAndArgMap>({
    previousNodes: [],
    innerPreviousNodes: [],
    argMap: {},
  });
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
  // 当前画布中的节点和边的数据
  const [graphParams, setGraphParams] = useState<{
    nodeList: ChildNode[];
    edgeList: Edge[];
  }>({ nodeList: [], edgeList: [] });

  // 错误列表的参数
  const [errorParams, setErrorParams] = useState({
    errorList: [],
    show: false,
  });
  // 画布的ref
  const graphRef = useRef<any>(null);
  // 是否显示创建工作流，插件，知识库，数据库的弹窗和试运行的弹窗
  const { setTestRun } = useModel('model');

  // 修改更新时间
  const changeUpdateTime = () => {
    const _time = new Date();
    setInfo({ ...(info as IgetDetails), modified: _time.toString() });
  };
  // 按钮是否处于loading
  const [loading, setLoading] = useState(false);

  /** -----------------  需要调用接口的方法  --------------------- */

  // 获取当前画布的信息
  const getDetails = async () => {
    try {
      // 调用接口，获取当前画布的所有节点和边
      const _res = await service.getDetails(workflowId);
      // 获取左上角的信息
      setInfo(_res.data);
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
    setInfo({ ...(info as IgetDetails), ...value });
    setShowCreateWorkflow(false);
    changeUpdateTime();
  };

  // 查询节点的指定信息
  const getNodeConfig = async (id: number) => {
    const _res = await service.getNodeConfig(id);
    if (_res.code === Constant.success) {
      setFoldWrapItem(_res.data);
    }
  };

  // 更新节点数据
  const changeNode = async (config: ChildNode, update?: boolean) => {
    graphRef.current.updateNode(config.id, config);
    if (foldWrapItem.id === config.id) {
      setFoldWrapItem(config);
    }
    const _res = await updateNode(config);
    if (_res.code === Constant.success) {
      if (update) {
        getNodeConfig(Number(config.id));
      }
      changeUpdateTime();
    }
  };
  // 点击组件，显示抽屉
  const changeDrawer = async (child: ChildNode | null) => {
    setTestRun(false);
    if (child === null) {
      setVisible(false);
      return;
    } else {
      // 先更新状态再执行后续逻辑
      setFoldWrapItem((prev) => {
        // 执行关联操作
        if (!visible) setVisible(true);
        // 如果ID相同则阻止更新
        if (prev.id === child.id) return prev;

        // 返回新值触发更新
        return child;
      });
    }

    // 如果有组件正在展示,那么就要看是否修改了参数,
    // 如果修改了参数,那么就提交数据

    if (child.nodeConfig.inputArgs === null) {
      child.nodeConfig.inputArgs = [];
    }
    if (child.nodeConfig.outputArgs === null) {
      child.nodeConfig.outputArgs = [];
    }

    // 获取节点需要的引用参数
    const _res = await service.getOutputArgs(Number(child.id));
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

  // 新增节点
  const addNode = async (
    child: Child,
    dragEvent: { x: number; y: number; height?: number },
  ) => {
    let _params = JSON.parse(JSON.stringify(child));
    _params.workflowId = workflowId;
    _params.extension = dragEvent;

    // 查看当前是否有选中的节点以及被选中的节点的type是否是Loop

    const loopParentId = graphRef.current.findLoopParentAtPosition(dragEvent);
    if ((visible && foldWrapItem.type === 'Loop') || loopParentId) {
      _params.loopNodeId = Number(loopParentId || foldWrapItem.id);
    }
    // 如果是条件分支，需要增加高度
    if (child.type === 'Condition') {
      _params.extension = { ...dragEvent };
    }
    if (child.type === 'Loop') {
      _params.extension = { ...dragEvent, height: 240, width: 600 };
    }

    const _res = await service.addNode(_params);

    if (_res.code === Constant.success) {
      _res.data.key = _res.data.type === 'Loop' ? 'loop-node' : 'general-Node';
      graphRef.current.addNode(dragEvent, _res.data);
      setFoldWrapItem(_res.data);
      graphRef.current.selectNode(_res.data.id);
      changeUpdateTime();
    }
  };

  // 复制节点
  const copyNode = async (child: ChildNode) => {
    const _res = await service.copyNode(child.id.toString());
    if (_res.code === Constant.success) {
      const _dragEvent = {
        x: 100,
        y: 100,
      };
      const _newNode = JSON.parse(JSON.stringify(_res.data));
      _newNode.key = 'general-Node';
      graphRef.current.addNode(_dragEvent, _newNode);
      // 选中新增的节点
      graphRef.current.selectNode(_res.data.id);
      changeUpdateTime();
    }
  };

  // 删除指定的节点
  const deleteNode = async (id: number | string) => {
    setVisible(false);
    // if(Number(id)===Number(foldWrapItem.id)){
    // }
    const _res = await service.deleteNode(id);
    if (_res.code === Constant.success) {
      // console.log(graphRef.current)
      graphRef.current.deleteNode(id.toString());
      changeUpdateTime();
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
    }
    const _res = await service.addEdge(_params);
    // 如果接口不成功，就需要删除掉那一条添加的线
    if (_res.code !== Constant.success) {
      graphRef.current.deleteEdge(id);
    }
  };

  // 发布，保存数据
  const onSubmit = () => {
    // 获取所有节点,保存位置
    console.log('onSubmit', graphParams);
  };

  const handleNodeChange = (action: string, data: ChildNode) => {
    switch (action) {
      case 'TestRun':
        setTestRun(true);
        break;
      case 'Duplicate':
        copyNode(data);
        break;
      case 'Rename':
        changeNode(data);
        break;
      case 'Delete':
        {
          deleteNode(data.id);
        }
        break;
      default:
        break;
    }
  };
  // 添加工作流，插件，知识库，数据库
  const onAdded = (val: CreatedNodeItem, parentFC?: string) => {
    if (parentFC && parentFC !== 'workflow') return;
    const _child: Child = {
      name: val.name,
      key: 'general-Node',
      description: val.description,
      type: createdItem,
      typeId: val.targetId,
    };
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
    const isSpecialType = ['Plugin', 'Workflow', 'Knowledge'].includes(
      child.type,
    );

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

  // 调整画布的大小
  const changeGraph = (val: number) => {
    graphRef.current.changeGraphZoom(val);
    changeUpdateTime();
  };

  //
  const changeZoom = (val: number | string) => {
    console.log(val);
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
          console.log(data);
        } else {
          if (data.data) {
            setTestRunResult(JSON.stringify(data.data));
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
  const testRunAllNode = async (params: DefaultObjectType) => {
    // 获取完整的连线列表
    const _edges = await getNodeRelation(
      graphParams.nodeList,
      info?.startNode.id as number,
    );
    if (!_edges) {
      message.warning('没有完整的连线，需要一条从开始一直贯穿到结束的连线');
      return;
    }
    // 根据连线列表，查看是否有第一个数据是开始节点的id，最后一个是结束节点的信息
    const fullPath = _edges.filter((item: number[]) => {
      return (
        item[0] === info?.startNode.id &&
        item[item.length - 1] === info.endNode.id
      );
    });
    // 如果有完整的连线，那么就可以进行试运行
    if (fullPath && fullPath.length > 0) {
      await getDetails();
      // 遍历检查所有节点是否都已经输入了参数
      const _params = {
        workflowId: info?.id,
        params,
        requestId: new Date(),
      };
      const abortConnection = await createSSEConnection({
        url: `${process.env.BASE_URL}/api/workflow/test/execute`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`,
          Accept: ' application/json, text/plain, */* ',
        },
        body: _params,
        onMessage: (data) => {
          const _nodeId = data.data.nodeId;
          graphRef.current.selectNode(_nodeId);
          if (!data.success) {
            if (data.data && data.data.result) {
              setErrorParams({
                errorList: [...errorParams.errorList, data.data.result],
                show: true,
              });
            }
          } else {
            if (data.data && data.data.output) {
              setTestRunResult(data.data.output);
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
    } else {
      message.warning('连线不完整');
      return;
    }
    changeUpdateTime();
  };

  // 试运行所有节点
  const testRunAll = async () => {
    setErrorParams({
      errorList: [],
      show: false,
    });
    const _res = await service.getDetails(workflowId);
    setFoldWrapItem(_res.data.startNode);
    setVisible(false);
    setTestRun(true);
    // testRunAllNode();
  };

  // 节点试运行
  const runTest = (type: string, params?: DefaultObjectType) => {
    if (type === 'Start') {
      testRunAllNode(params || {});
    } else {
      nodeTestRun(params);
    }
    setLoading(true);
  };
  // 保存当前画布中节点的位置
  useEffect(() => {
    getDetails();
  }, []);

  return (
    <div id="container">
      {/* 顶部的名称和发布等按钮 */}
      <Header
        info={info ?? {}}
        onSubmit={onSubmit}
        setShowCreateWorkflow={() => setShowCreateWorkflow(true)}
      />
      <GraphContainer
        graphParams={graphParams}
        handleNodeChange={handleNodeChange}
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
        changeGraph={changeGraph}
        handleTestRun={() => testRunAll()}
      />
      <NodeDrawer
        visible={visible}
        onClose={() => setVisible(false)}
        foldWrapItem={foldWrapItem}
        onGetNodeConfig={changeNode} // 新增这一行
        handleNodeChange={handleNodeChange}
        referenceList={referenceList}
      />
      <Created
        checkTag={createdItem as AgentComponentTypeEnum}
        onAdded={onAdded}
        targetId={info?.id}
        spaceId={info?.spaceId || 0}
        open={open}
        onCancel={() => setOpen(false)}
      />
      <TestRun
        type={foldWrapItem.type}
        run={runTest}
        visible={visible}
        title={foldWrapItem.name}
        inputArgs={foldWrapItem.nodeConfig.inputArgs ?? []}
        testRunResult={testRunResult}
        loading={loading}
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
        onClose={() => setErrorParams({ ...errorParams, show: false })}
        changeDrawer={changeDrawer}
        nodeList={graphParams.nodeList}
      />
    </div>
  );
};

export default Workflow;
