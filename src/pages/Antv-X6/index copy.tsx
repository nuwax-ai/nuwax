import FoldWrap from '@/components/FoldWrap';
import TestRun from '@/components/TestRun';
import { Button, Popover, Select } from 'antd';
import { useEffect, useRef, useState } from 'react';
import Monaco from '../../components/CodeEditor/monaco';
import FoldWarpNode from './component/disposeNode';
import EventHandlers from './component/eventHandlers';
import InitGraph from './component/graph';
import { registerCustomNodes } from './component/registerCustomNodes'; // 引入自定义节点注册函数
import StencilContent from './component/stencil';
// 引入一些图标
import Created from '@/components/Created';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { ChildNode, Edge } from '@/types/interfaces/graph';
import {
  CaretRightOutlined,
  HomeOutlined,
  PlusOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Node } from '@antv/x6';
import { useModel } from 'umi';
import './index.less';
import { Child } from './type';
// 节点样例数据，后期删除
import service from '@/services/workflow';
import { getEdges, returnImg } from '@/utils/workflow';
// 确保在应用启动时就注册所有自定义节点
registerCustomNodes();

const AntvX6 = () => {
  /** -------------------- 定义一些变量 -------------------- */
  // 画布的ref
  const containerRef = useRef<HTMLDivElement>(null);
  // 抽屉的visible
  const [visible, setVisible] = useState(false);
  // 抽屉的title
  const [foldWrapItem, setFoldWrapItem] = useState<ChildNode>({
    id: 0,
    description: 'string',
    workflowId: 0,
    type: 'string',
    nodeConfig: {},
    name: '',
  });
  // 创建插件、工作流、知识库、数据库所需的参数
  const [createdItem, setCreatedItem] = useState({
    checkTag: 'plugInNode',
  });

  // 当前被拖拽节点的x和y
  const [dragEvent, setDragEvent] = useState({
    x: 0,
    y: 0,
  }); // 拖拽子节点到画布中

  // 打开或者关闭添加工作流或者插件
  const { setShow, setTestRun } = useModel('model');

  // 所有的节点
  const [graphParams, setGraphParams] = useState<any>({
    nodeList: [],
    edgeList: [],
  });

  /** -------------------- 无需调用方法的接口 -------------------- */
  // 点击组件，显示抽屉
  const changeDrawer = (child: ChildNode) => {
    setFoldWrapItem(child);
    setVisible(true);
  };

  // 使用 useRef 来保持 graph 实例在整个组件生命周期内的引用
  const graphRef = useRef<any>(null);
  function preWork() {
    // 这里协助演示的代码，在实际项目中根据实际情况进行调整
    const container = containerRef.current;
    if (!container) return;

    const graphContainer = document.createElement('div');
    graphContainer.id = 'graph-container';

    // 使用可选链操作符确保容器存在
    container?.appendChild(graphContainer);
  }

  // 打开试运行的模板
  const showTestRun = () => {
    setTestRun(true);
  };

  // 试运行
  const handleTestRun = () => {
    console.log('123');
  };
  // 子节点如果有要发生改变的地方
  const handleNodeChange = (action: string, data?: any) => {
    // 处理节点变化逻辑，例如：重命名、创建副本、删除等
    switch (action) {
      case 'TestRun':
        // 运行测试
        showTestRun();
        break;
      case 'Duplicate':
        // 创建副本
        break;
      case 'Delete':
        // 删除节点
        {
          graphRef.current?.removeNode(data ? data.id : foldWrapItem.id);
          setVisible(false);
        }
        break;
      default:
        break;
    }
  };
  // 创建子节点
  const addNode = (e: { x: number; y: number }, child: Child) => {
    // 将鼠标位置转换为画布坐标系中的位置
    const point = graphRef.current.clientToGraph(e.x, e.y);

    // 获取所有节点，并尝试找到位于拖拽位置的目标父节点
    let targetNode: Node | null = null;
    graphRef.current.getNodes().some((node: Node) => {
      if (node.getData<ChildNode>()?.type === 'Loop') {
        const bbox = node.getBBox();
        if (bbox.containsPoint(point)) {
          // 添加的位置上有其他节点，且节点允许添加子节点
          targetNode = node;
          return true; // 退出循环
        }
      }
      return false;
    });
    console.log('aaa', child);

    // 创建新节点
    const newNode = graphRef.current.addNode({
      shape: child.key,
      x: point.x, // 使用转换后的坐标
      y: point.y,
      // 后面要改
      width: 304,
      height: 83,
      data: {
        ...child,
        // 将父组件的方法作为属性传递给子组件
        onChange: handleNodeChange,
      },
      zIndex: 2, // 新节点的层级设置为2
    });

    // 如果没有节点，就直接添加到画布上
    if (targetNode === null) {
      graphRef.current.addCell(newNode);
    } else {
      // 如果找到了允许嵌套子节点的目标节点，则添加新节点为子节点
      (targetNode as Node<Node.Properties>).setZIndex(1); // 降低父节点层级
      (targetNode as Node<Node.Properties>).addChild(newNode);
    }
  };

  // 拖拽子节点到画布中
  const dragChild = (e: React.DragEvent<HTMLDivElement>, child: Child) => {
    e.preventDefault();

    // 这里要区分创建的节点是插件和工作流还是其他，如果是插件和工作流，就要先展示弹窗，待用户选中后再添加节点
    if (
      child.key === 'Plugin' ||
      child.key === 'Workflow' ||
      child.key === 'KnowledgeBase' ||
      child.key === 'Database'
    ) {
      setCreatedItem({ ...createdItem, checkTag: child.key });
      // 展示可以选择的选项蒙版层
      setShow(true);
      setDragEvent({
        x: e.clientX,
        y: e.clientY,
      });
    } else {
      addNode(
        {
          x: e.clientX,
          y: e.clientY,
        },
        child,
      );
    }
  };

  // 添加插件,工作流,知识库,数据库
  const onAdded = (val: CreatedNodeItem) => {
    // 组装数据
    const _child = {
      name: val.label,
      type: 'general-Node',
      description: val.desc,
      key: createdItem.checkTag,
    };
    // 添加节点
    addNode(dragEvent, _child);
    // 关闭新增差价工作流,知识库,数据库的弹窗
    setShow(false);
  };

  /** -------------------- 需要调用方法的接口 -------------------- */
  // 获取当前画布信息
  const getList = async () => {
    // 调用接口，获取当前画布的所有节点和边
    const _res = await service.getNodeList(6);
    // const _res = await servic
    // 获取节点的数据
    const _nodeList = _res.data;
    // 获取边的数据
    const _edgeList = getEdges(_nodeList);
    // 通过便利获取边的数据
    setGraphParams({ edgeList: _edgeList, nodeList: _nodeList });
  };

  // 创建一个用于存放图形的容器
  useEffect(() => {
    getList();
    if (!containerRef.current) return;
    // 确保在调用任何需要DOM操作的函数之前，已经创建了必要的DOM元素
    preWork();
    // #region 初始化画布
    graphRef.current = InitGraph({
      containerId: 'graph-container',
      changeDrawer: changeDrawer,
    });

    // 绑定事件处理器并获取清理函数
    const cleanup = EventHandlers(graphRef.current);
    // 在这里可以放置任何需要在组件卸载时清理的代码
    return () => {
      cleanup();
      // 确保释放资源
      graphRef.current.dispose();
    };
    // 空数组意味着这个效果只会在组件首次挂载时运行
  }, []);

  useEffect(() => {
    // 当graphParams变化时，更新图形
    if (graphRef.current && graphParams.nodeList.length > 0) {
      const cells = graphParams.nodeList
        .map((node: ChildNode) => {
          console.log(node);
          return {
            id: node.id.toString(),
            shape: 'general-Node',
            x: 50 + Math.random() * 700, // 随机位置，实际应用中应该根据具体需求调整
            y: 50 + Math.random() * 400,
            width: 304,
            height: 83,
            label: node.name,
            data: {
              ...node,
              onChange: handleNodeChange,
            },
          };
        })
        .concat(
          graphParams.edgeList.map((edge: Edge) => ({
            shape: 'edge',
            source: { id: edge.source.toString() },
            target: { id: edge.target.toString() },
          })),
        );

      graphRef.current.fromJSON({ cells });
      // graphRef.current.zoomToFit(); // 自动缩放以适应所有元素
    }
  }, [graphParams]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
      id="container"
    >
      <Monaco />
      {/* 绝对定位的容器，用以添加节点等 */}
      <div className="absolute-box">
        <Select
          defaultValue="lucy"
          options={[
            { value: 'jack', label: 'Jack' },
            { value: 'lucy', label: 'Lucy' },
            { value: 'Yiminghe', label: 'yiminghe' },
            { value: 'disabled', label: 'Disabled' },
          ]}
        />
        <HomeOutlined />
        {/* 添加节点 */}
        <Popover
          content={<StencilContent dragChild={dragChild} />}
          trigger="click"
        >
          <Button icon={<PlusOutlined />} type="primary">
            添加节点
          </Button>
        </Popover>
      </div>
      {/* 绝对定位的容器，用以试运行 */}
      <div className="absolute-test">
        <ToolOutlined />
        <Button icon={<CaretRightOutlined />} type="primary">
          试运行
        </Button>
      </div>
      {/* 右侧的操作栏 */}
      <FoldWrap
        className="fold-wrap-style"
        lineMargin
        title={foldWrapItem.name}
        visible={visible}
        onClose={() => setVisible(false)}
        desc={foldWrapItem.description}
        icon={returnImg(foldWrapItem.type)}
        // otherAction={
        //   <OtherOperations
        //     onChange={(val: string) => handleNodeChange(val)}
        //     testRun={foldWrapItem.testRun}
        //   />
        // }
      >
        <div className="dispose-node-style">
          <FoldWarpNode params={foldWrapItem} />
        </div>
      </FoldWrap>

      {/* 添加工作流,节点等 */}
      <Created
        checkTag={
          createdItem.checkTag as
            | 'plugInNode'
            | 'workflowNode'
            | 'knowledgeNode'
            | 'databaseNode'
        }
        onAdded={onAdded}
      />
      {/* 试运行的弹窗 */}
      <TestRun type={'noInput'} run={handleTestRun} />
    </div>
  );
};

export default AntvX6;
