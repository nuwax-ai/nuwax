import Created from '@/components/Created';
import CreateWorkflow from '@/components/CreateWorkflow';
import TestRun from '@/components/TestRun';
import Constant from '@/constants/codes.constants';
import service, { IUpdateDetails } from '@/services/workflow';
import { NodeTypeEnum, PluginAndLibraryEnum } from '@/types/enums/common';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { ChildNode, Edge } from '@/types/interfaces/graph';
import { NodePreviousAndArgMap } from '@/types/interfaces/node';
import { debounce } from '@/utils/debounce';
import { getNodeRelation, updateNode } from '@/utils/updateNode';
import { getEdges } from '@/utils/workflow';
import { message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useModel, useParams } from 'umi';
// import Monaco from '../../components/CodeEditor/monaco';
import { WorkflowModeEnum } from '@/types/enums/library';
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
    modified: '',
    id: 0,
    description: '',
    startNodeId: 0,
    endNodeId: 0,
    spaceId: 0,
  });

  // 上级节点的输出参数
  const [referenceList, setReferenceList] = useState<NodePreviousAndArgMap>({
    previousNodes: [],
    innerPreviousNodes: [],
    argMap: {},
  });

  // 展示修改工作流的弹窗
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  // 创建工作流，插件，知识库，数据库
  const [createdItem, setCreatedItem] = useState<PluginAndLibraryEnum>(
    PluginAndLibraryEnum.Plugin,
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
    errorList: [{ ...graphParams.nodeList[0], error: '123456' }],
    show: false,
  });
  // 画布的ref
  const graphRef = useRef<any>(null);
  // 是否显示创建工作流，插件，知识库，数据库的弹窗和试运行的弹窗
  const { setShow, setTestRun } = useModel('model');

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
    // console.log({ ...value, id: info.id });
    setInfo({ ...info, ...value });
    setShowCreateWorkflow(false);
    // const _res = await service.updateDetails({ ...value, id: info.id });
    // if (_res.code === Constant.success) {
    // }
  };

  // 更新节点数据
  const changeNode = debounce(async (config: ChildNode) => {
    const _res = await updateNode(config);
    if (_res.code === Constant.success) {
      graphRef.current.updateNode(config.id, config);
      setFoldWrapItem(config);
    }
  }, 1000);
  // 点击组件，显示抽屉
  const changeDrawer = async (child: ChildNode) => {
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
    console.log(_res);
    if (_res.code === Constant.success) {
      _res.data.key = 'general-Node';
      graphRef.current.addNode(dragEvent, _res.data);
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
    }
  };

  // 删除指定的节点
  const deleteNode = async (id: number | string) => {
    const _res = await service.deleteNode(id);
    if (_res.code === Constant.success) {
      // console.log(graphRef.current)
      graphRef.current.deleteNode(id.toString());
    }
  };

  // 节点添加或移除边
  const nodeChangeEdge = async (
    sourceNode: ChildNode,
    targetId: string,
    type: string,
    id: string,
  ) => {
    // 获取当前节点的nextNodeIds
    const _nextNodeIds =
      sourceNode.nextNodeIds === null
        ? []
        : (sourceNode.nextNodeIds as number[]);
    // 组装参数
    const _params = {
      nodeId: Number(sourceNode.id),
      integers: _nextNodeIds,
    };
    // 根据类型判断，如果type是created，那么就添加边，如果type是deleted，那么就删除边
    if (type === 'created') {
      // 如果已经有了这一条边，那么就不再创建
      if (_params.integers.includes(Number(targetId))) {
        graphRef.current.deleteEdge(id);
        return;
      }
      _params.integers = [..._nextNodeIds, Number(targetId)];
    } else {
      _params.integers = _nextNodeIds?.filter(
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
  const onAdded = (val: CreatedNodeItem) => {
    const _child: Child = {
      name: val.name,
      key: 'general-Node',
      description: val.description,
      type: createdItem,
      typeId: val.targetId,
    };
    addNode(_child, dragEvent);
    // graphRef.current.addNode(dragEvent, _child);
    setShow(false);
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
      setCreatedItem(child.type as PluginAndLibraryEnum);
      setShow(true);
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
  const nodeTestRun = async () => {
    console.log('testRun', foldWrapItem);
  };

  // 调整画布的大小
  const changeGraph = (val: number) => {
    graphRef.current.changeGraphZoom(val);
  };

  // 试运行所有节点
  const testRunAll = async () => {
    // 获取完整的连线列表
    const _edges = await getNodeRelation(graphParams.nodeList, 15);
    if (!_edges) {
      message.warning('需要添加连线');
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
      // 遍历检查所有节点是否都已经输入了参数
      console.log('submit');
      setErrorParams({ ...errorParams, show: true });
    } else {
      message.warning('连线不完整');
      return;
    }
  };

  // 保存当前画布中节点的位置
  useEffect(() => {
    getDetails();

    return () => {
      // 组件销毁时，清除定时器
      graphRef.current.saveAllNodes();
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }} id="container">
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
        checkTag={createdItem as PluginAndLibraryEnum}
        onAdded={onAdded}
        targetId={info.id}
        spaceId={info.spaceId}
      />
      <TestRun type={foldWrapItem.type} run={nodeTestRun} />

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
      />
    </div>
  );
};

export default Workflow;
