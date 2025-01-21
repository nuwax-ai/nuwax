import Created from '@/components/Created';
import service from '@/services/workflow';
import { PluginAndLibraryEnum } from '@/types/enums/common';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { ChildNode, Edge } from '@/types/interfaces/workflow';
import { getEdges } from '@/utils/workflow';
import React, { useEffect, useRef, useState } from 'react';
import { useModel } from 'umi';
import Monaco from './component/monaco';

import Constant from '@/constants/codes.constants';
import { debounce } from '@/utils/debounce';
import { updateNode } from '@/utils/updateNode';
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
    type: 'Start',
    nodeConfig: {},
    name: '',
  });

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

  const handleNodeChange = (action: string, data?: ChildNode) => {
    switch (action) {
      case 'TestRun':
        setTestRun(true);
        break;
      case 'Duplicate':
        console.log(data);
        break;
      case 'Delete':
        setVisible(false);
        break;
      default:
        break;
    }
  };

  const onAdded = (val: CreatedNodeItem) => {
    const _child: Child = {
      name: val.label,
      type: 'general-Node',
      description: val.desc,
      key: createdItem,
    };
    graphRef.current.addNode(dragEvent, _child);
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
      graphRef.current.addNode({ x: e.clientX, y: e.clientY }, child);
    }
  };

  /** -----------------  需要调用接口的方法  --------------------- */
  // 获取当前画布的信息
  const getList = async () => {
    try {
      // 调用接口，获取当前画布的所有节点和边
      const _res = await service.getNodeList(6);
      // 获取节点和边的数据
      const _nodeList = _res.data;
      const _edgeList = getEdges(_nodeList);
      // 修改数据，更新画布
      setGraphParams({ edgeList: _edgeList, nodeList: _nodeList });
    } catch (error) {
      console.error('Failed to fetch graph data:', error);
    }
  };

  // 更新节点数据
  const changeNode = debounce(async (config: ChildNode) => {
    const _res = await updateNode(config);
    if (_res.code === Constant.success) {
      graphRef.current.updateNode(config.id, config);
    }
  }, 1000);
  // 点击组件，显示抽屉
  const changeDrawer = (child: ChildNode) => {
    console.log(child);
    // 如果有组件正在展示,那么就要看是否修改了参数,
    // 如果修改了参数,那么就提交数据
    if (visible) {
    } else {
      setVisible(true);
    }
    setFoldWrapItem(child);
  };

  // 发布，保存数据
  const onSubmit = () => {
    // 获取所有节点,保存位置
    console.log('onSubmit');
  };

  // 保存当前画布中节点的位置
  useEffect(() => {
    getList();
    return () => {
      // 组件销毁时，清除定时器
      graphRef.current.saveAllNodes();
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }} id="container">
      {/* 顶部的名称和发布等按钮 */}
      <Header title={'123'} onSubmit={onSubmit} />
      <Monaco />
      <GraphContainer
        graphParams={graphParams}
        handleNodeChange={handleNodeChange}
        ref={graphRef}
        changeDrawer={changeDrawer}
      />
      <ControlPanel
        dragChild={dragChild}
        handleTestRun={() => console.log('Test run clicked')}
      />
      <NodeDrawer
        visible={visible}
        onClose={() => setVisible(false)}
        foldWrapItem={foldWrapItem}
        onGetNodeConfig={changeNode} // 新增这一行
      />
      <Created
        checkTag={createdItem as PluginAndLibraryEnum}
        onAdded={onAdded}
      />
    </div>
  );
};

export default AntvX6;
