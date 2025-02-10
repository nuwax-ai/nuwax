import Created from '@/components/Created';
import CreateWorkflow from '@/components/CreateWorkflow';
import TestRun from '@/components/TestRun';
import Constant from '@/constants/codes.constants';
import service, { IUpdateDetails } from '@/services/workflow';
import { NodeTypeEnum, PluginAndLibraryEnum } from '@/types/enums/common';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { ChildNode, Edge } from '@/types/interfaces/workflow';
import { debounce } from '@/utils/debounce';
import { updateNode } from '@/utils/updateNode';
import { getEdges } from '@/utils/workflow';
import React, { useEffect, useRef, useState } from 'react';
import { useModel } from 'umi';
import Monaco from './component/monaco';
import ControlPanel from './controlPanel';
import GraphContainer from './graphContainer';
import Header from './header';
import './index.less';
import NodeDrawer from './nodeDrawer';
import { Child } from './type';

const AntvX6: React.FC = () => {
  // 显示隐藏右侧节点抽屉
  const [visible, setVisible] = useState(false);
  // 右侧抽屉的部分信息
  const [foldWrapItem, setFoldWrapItem] = useState<ChildNode>({
    id: 0,
    description: '',
    workflowId: 0,
    type: NodeTypeEnum.Start,
    nodeConfig: {
      extension: {
        x: 0,
        y: 0,
      },
    },
    name: '',
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
  // 画布的ref
  const graphRef = useRef<any>(null);
  // 是否显示创建工作流，插件，知识库，数据库的弹窗和试运行的弹窗
  const { setShow, setTestRun } = useModel('model');

  /** -----------------  需要调用接口的方法  --------------------- */

  // 获取当前画布的信息
  const getDetails = async () => {
    try {
      // 调用接口，获取当前画布的所有节点和边
      const _res = await service.getDetails(6);
      // 获取左上角的信息
      const _params = {
        name: _res.data.name,
        icon: _res.data.icon,
        publishStatus: _res.data.publishStatus,
        created: _res.data.created,
        modified: _res.data.modified,
        id: _res.data.id,
        description: _res.data.description,
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
    const _res = await service.updateDetails({ ...value, id: info.id });
    if (_res.code === Constant.success) {
      setInfo({ ...info, ...value });
      setShowCreateWorkflow(false);
    }
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
  const changeDrawer = (child: ChildNode) => {
    // 如果有组件正在展示,那么就要看是否修改了参数,
    // 如果修改了参数,那么就提交数据
    if (visible) {
    } else {
      setVisible(true);
    }
    if (child.nodeConfig.inputArgs === null) {
      child.nodeConfig.inputArgs = [];
    }
    if (child.nodeConfig.outputArgs === null) {
      child.nodeConfig.outputArgs = [];
    }
    setFoldWrapItem(child);
  };

  // 新增节点
  const addNode = async (
    child: Child,
    dragEvent: { x: number; y: number; height?: number },
  ) => {
    let _params = JSON.parse(JSON.stringify(child));
    _params.workflowId = 6;
    _params.extension = dragEvent;

    // 如果是条件分支，需要增加高度
    if (child.type === 'Condition') {
      _params.extension = { ...dragEvent, height: 140 };
    }

    const _res = await service.addNode(_params);
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
          console.log(data);
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
  const dragChild = (e: React.DragEvent<HTMLDivElement>, child: Child) => {
    e.preventDefault();
    if (
      ['Plugin', 'Workflow', 'KnowledgeBase', 'Database'].includes(child.type)
    ) {
      console.log(child);
      setCreatedItem(child.type as PluginAndLibraryEnum);
      setShow(true);
      setDragEvent({ x: e.clientX, y: e.clientY });
    } else {
      addNode(child, { x: e.clientX, y: e.clientY });
      // graphRef.current.addNode({ x: e.clientX, y: e.clientY }, child);
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
      <Monaco />
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
        handleTestRun={() => console.log('Test run clicked')}
      />
      <NodeDrawer
        visible={visible}
        onClose={() => setVisible(false)}
        foldWrapItem={foldWrapItem}
        onGetNodeConfig={changeNode} // 新增这一行
        handleNodeChange={handleNodeChange}
      />
      <Created
        checkTag={createdItem as PluginAndLibraryEnum}
        onAdded={onAdded}
        targetId={info.id}
      />
      <TestRun type={foldWrapItem.type} run={nodeTestRun} />

      <CreateWorkflow
        onConfirm={onConfirm}
        onCancel={() => setShowCreateWorkflow(false)}
        type={1}
        name={info.name}
        icon={info.icon}
        description={info.description}
        open={showCreateWorkflow}
      />
    </div>
  );
};

export default AntvX6;
