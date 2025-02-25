import Created from '@/components/Created';
import CreateWorkflow from '@/components/CreateWorkflow';
import TestRun from '@/components/TestRun';
import Constant from '@/constants/codes.constants';
import service, { IUpdateDetails } from '@/services/workflow';
import { NodeTypeEnum } from '@/types/enums/common';
import { CreatedNodeItem, DefaultObjectType } from '@/types/interfaces/common';
import { ChildNode, Edge } from '@/types/interfaces/graph';
import { NodePreviousAndArgMap } from '@/types/interfaces/node';
import { debounce } from '@/utils/debounce';
import { getNodeRelation, updateNode } from '@/utils/updateNode';
import { getEdges } from '@/utils/workflow';
import { message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useModel, useParams } from 'umi';
// import Monaco from '../../components/CodeEditor/monaco';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { WorkflowModeEnum } from '@/types/enums/library';
import { createSSEConnection } from '@/utils/fetchEventSource';
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
  const [info, setInfo] = useState({
    name: '',
    icon: '',
    publishStatus: '',
    created: '',
    modified: '2025-02-14T09:24:07.000+00:00',
    id: 0,
    description: '',
    startNodeId: 0,
    endNodeId: 0,
    spaceId: 0,
  });
  // 定义一个节点试运行返回值
  const [testRunResult, setTestRunResult] = useState<string>();

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
    setInfo({ ...info, modified: _time.toString() });
  };

  /** -----------------  需要调用接口的方法  --------------------- */

  // 获取当前画布的信息
  const getDetails = async () => {
    try {
      // 调用接口，获取当前画布的所有节点和边
      const _res = await service.getDetails(workflowId);
      // 获取左上角的信息
      const _params = {
        name: _res.data.name,
        icon: _res.data.icon,
        publishStatus: _res.data.publishStatus,
        created: _res.data.created,
        modified: _res.data.modified,
        id: _res.data.id,
        description: _res.data.description,
        startNodeId: _res.data.startNode.id,
        spaceId: _res.data.spaceId,
        endNodeId: _res.data.endNode.id,
      };
      setInfo(_params);
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
    setInfo({ ...info, ...value });
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
  const changeNode = debounce(async (config: ChildNode, update?: boolean) => {
    const _res = await updateNode(config);
    if (_res.code === Constant.success) {
      graphRef.current.updateNode(config.id, config);
      if (update) {
        getNodeConfig(Number(config.id));
        setFoldWrapItem(config);
        changeUpdateTime();
      }
    }
  }, 1000);
  // 点击组件，显示抽屉
  const changeDrawer = async (child: ChildNode | null) => {
    if (child === null) {
      setVisible(false);
      return;
    }
    // 如果有组件正在展示,那么就要看是否修改了参数,
    // 如果修改了参数,那么就提交数据
    if (!visible) {
      setVisible(true);
    }
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
      }
    }
    setFoldWrapItem(child);
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
      _params.extension = { ...dragEvent, height: 140 };
    }

    const _res = await service.addNode(_params);

    if (_res.code === Constant.success) {
      _res.data.key = 'general-Node';
      graphRef.current.addNode(dragEvent, _res.data);
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
      if (
        child.nodeConfig &&
        child.nodeConfig.extension &&
        child.nodeConfig.extension.x
      ) {
        _dragEvent.x = child.nodeConfig.extension.x;
      }
      if (
        child.nodeConfig &&
        child.nodeConfig.extension &&
        child.nodeConfig.extension.y
      ) {
        _dragEvent.y = child.nodeConfig.extension.y;
      }
      child.id = _res.data;
      child.key = 'general-Node';
      graphRef.current.addNode(_dragEvent, child);
      changeUpdateTime();
    }
  };

  // 删除指定的节点
  const deleteNode = async (id: number | string) => {
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
          setVisible(false);
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
          x: Math.floor(Math.random() * canvasWidth),
          y: Math.floor(Math.random() * canvasHeight),
        };
      }
    };

    // 判断是否需要显示特定类型的创建面板
    const isSpecialType = [
      'Plugin',
      'Workflow',
      'KnowledgeBase',
      'Database',
    ].includes(child.type);

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

  // 节点试运行
  const nodeTestRun = async (params: DefaultObjectType) => {
    const _params = {
      nodeId: foldWrapItem.id,
      params,
    };
    // const _res = await service.executeNode(_params);
    // console.log(_res)
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
        setTestRunResult(data.data.output);
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
        console.log('连接关闭');
      },
    });
    // 主动关闭连接
    abortConnection();
  };

  // 调整画布的大小
  const changeGraph = (val: number) => {
    graphRef.current.changeGraphZoom(val);
    changeUpdateTime();
  };

  // 试运行所有节点
  const testRunAll = async () => {
    // 获取完整的连线列表
    const _edges = await getNodeRelation(graphParams.nodeList, 15);
    if (!_edges) {
      message.warning('没有完整的连线，需要一条从开始一直贯穿到结束的连线');
      return;
    }
    // 根据连线列表，查看是否有第一个数据是开始节点的id，最后一个是结束节点的信息
    const fullPath = _edges.filter((item: number[]) => {
      return (
        item[0] === info.startNodeId && item[item.length - 1] === info.endNodeId
      );
    });
    // 如果有完整的连线，那么就可以进行试运行
    if (fullPath) {
      await getDetails();
      // 遍历检查所有节点是否都已经输入了参数
      const params = {
        workflowId: info.id,
      };
      const abortConnection = await createSSEConnection({
        url: `${process.env.BASE_URL}/api/workflow/test/execute`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}`,
          Accept: ' application/json, text/plain, */* ',
        },
        body: params,
        onMessage: (data) => {
          // setTestRunResult(data);
          if (!data.success) {
            if (data.data && data.data.result) {
              setErrorParams({
                errorList: [...errorParams.errorList, data.data.result],
                show: true,
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
          console.log('连接关闭');
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

  // 保存当前画布中节点的位置
  useEffect(() => {
    getDetails();
  }, []);

  return (
    <div id="container">
      {/* 顶部的名称和发布等按钮 */}
      <Header
        info={info}
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
        targetId={info.id}
        spaceId={info.spaceId}
        open={open}
        onCancel={() => setOpen(false)}
      />
      <TestRun
        type={foldWrapItem.type}
        run={nodeTestRun}
        title={foldWrapItem.name}
        inputArgs={foldWrapItem.nodeConfig.inputArgs ?? []}
        testRunResult={testRunResult}
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
