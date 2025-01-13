import FoldWrap from '@/components/FoldWrap';
import { Button, Popover, Select } from 'antd';
import { useEffect, useRef, useState } from 'react';
import FoldWarpNode from './component/disposeNode';
import EventHandlers from './component/eventHandlers';
import InitGraph from './component/graph';
import Monaco from './component/monaco';
import { registerCustomNodes } from './component/registerCustomNodes'; // 引入自定义节点注册函数
import StencilContent from './component/stencil';
// 引入一些图标
import Created from '@/components/Created';
import { ICON_END, ICON_START } from '@/constants/images.constants';
import { CreatedNodeItem, FoldWrapType } from '@/types/interfaces/common';
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
// 确保在应用启动时就注册所有自定义节点
registerCustomNodes();

const AntvX6 = () => {
  // 画布的ref
  const containerRef = useRef<HTMLDivElement>(null);
  // 抽屉的title
  const [foldWrapItem, setFoldWrapItem] = useState<FoldWrapType>({
    title: '',
    desc: '',
    visible: false,
    icon: null,
    key: '',
    onClose: () => {},
  });
  // 创建插件、工作流、知识库、数据库所需的参数
  const [createdItem, setCreatedItem] = useState({
    checkTag: '',
  });

  // 当前被拖拽节点的x和y
  const [dragEvent, setDragEvent] = useState({
    x: 0,
    y: 0,
  }); // 拖拽子节点到画布中

  // 打开或者关闭添加工作流或者插件
  const { setShow } = useModel('model');

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

  // 创建子节点
  const addNode = (e: { x: number; y: number }, child: Child) => {
    // 将鼠标位置转换为画布坐标系中的位置
    const point = graphRef.current.clientToGraph(e.x, e.y);

    // 获取所有节点，并尝试找到位于拖拽位置的目标父节点
    let targetNode: Node | null = null;
    graphRef.current.getNodes().some((node: Node) => {
      if (node.getData<Child>()?.isParent) {
        const bbox = node.getBBox();
        if (bbox.containsPoint(point)) {
          // 添加的位置上有其他节点，且节点允许添加子节点
          targetNode = node;
          return true; // 退出循环
        }
      }
      return false;
    });
    // 创建新节点
    const newNode = graphRef.current.addNode({
      shape: child.type,
      x: point.x, // 使用转换后的坐标
      y: point.y,
      width: child.width ? child.width : 304,
      height: child.height ? child.height : 83,
      data: child,
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
      child.key === 'plugInNode' ||
      child.key === 'workflowNode' ||
      child.key === 'knowledgeNode' ||
      child.key === 'databaseNode'
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
      title: val.label,
      icon: val.image,
      type: 'general-Node',
      content: val.desc,
      desc: val.desc,
      key: createdItem.checkTag,
    };
    // 添加节点
    addNode(dragEvent, _child);
    // 关闭新增差价工作流,知识库,数据库的弹窗
    setShow(false);
  };
  // 点击组件，显示抽屉
  const changeDrawer = (child: Child) => {
    setFoldWrapItem({
      ...foldWrapItem,
      title: child.title,
      visible: true,
      desc: child.desc,
      icon: child.icon,
      key: child.key,
    });
  };

  // 关闭抽屉
  const closeDrawer = () => {
    setFoldWrapItem({ ...foldWrapItem, visible: false });
  };

  // 创建一个用于存放图形的容器
  useEffect(() => {
    if (!containerRef.current) return;
    // 确保在调用任何需要DOM操作的函数之前，已经创建了必要的DOM元素
    preWork();
    // #region 初始化画布
    graphRef.current = InitGraph({
      containerId: 'graph-container',
      changeDrawer: changeDrawer,
    });

    // 新进页面，创建两个节点

    graphRef.current.addNode({
      shape: 'general-Node',
      x: 200, // 使用转换后的坐标
      y: 200,
      width: 304,
      height: 83,
      data: {
        title: '开始',
        icon: <ICON_START />,
        key: 'startNode',
        type: 'general-Node',
        content: '工作流起始节点，用于设定启动工作流需要的信息',
        desc: '工作流起始节点，用于设定启动工作流需要的信息',
        backgroundColor: '#EEEEFF',
        noPopover: true,
        width: 304,
        height: 83,
      },
      zIndex: 2, // 新节点的层级设置为2
    });

    graphRef.current.addNode({
      shape: 'general-Node',
      x: 1000, // 使用转换后的坐标
      y: 200,
      width: 324,
      height: 83,
      data: {
        title: '结束',
        icon: <ICON_END />,
        key: 'endNode',
        type: 'general-Node',
        content: '工作流的最终节点，用于返回工作流运行后的结果信息',
        desc: '工作流的最终节点，用于返回工作流运行后的结果信息',
        backgroundColor: '#EEEEFF',
        noPopover: true,
        width: 324,
        height: 83,
      },
      zIndex: 2, // 新节点的层级设置为2
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

        <Button
          icon={<CaretRightOutlined />}
          type="primary"
          onClick={() =>
            changeDrawer({
              ...foldWrapItem,
              title: '试运行',
              desc: '',
              icon: null,
              key: 'testNode',
              type: '',
              content: '',
            })
          }
        >
          试运行
        </Button>
      </div>
      {/* 右侧的操作栏 */}
      <FoldWrap
        className="fold-wrap-style"
        lineMargin
        title={foldWrapItem.title}
        visible={foldWrapItem.visible}
        onClose={closeDrawer}
        desc={foldWrapItem.desc}
        icon={foldWrapItem.icon}
      >
        <div className="dispose-node-style">
          <FoldWarpNode type={foldWrapItem.key as string} />
        </div>
      </FoldWrap>

      {/* 添加工作流,节点等 */}
      <Created checkTag={createdItem.checkTag} onAdded={onAdded} />
    </div>
  );
};

export default AntvX6;
