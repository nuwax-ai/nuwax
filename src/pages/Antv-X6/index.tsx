import FoldWrap from '@/components/FoldWrap';
import { Button, Popover, Select } from 'antd';
import { useEffect, useRef, useState } from 'react';
import EventHandlers from './component/eventHandlers';
import InitGraph from './component/graph';
import { registerCustomNodes } from './component/registerCustomNodes'; // 引入自定义节点注册函数
import StencilContent from './component/stencil';
// 引入一些图标
import { ICON_END, ICON_START } from '@/constants/images.constants';
import { FoldWrapType } from '@/types/interfaces/common';
import { HomeOutlined, PlusOutlined } from '@ant-design/icons';
import { Node } from '@antv/x6';
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
    onClose: () => {},
  });

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

  // 子组件新增节点
  const dragChild = (e: React.DragEvent<HTMLDivElement>, child: Child) => {
    e.preventDefault();

    // 将鼠标位置转换为画布坐标系中的位置
    const point = graphRef.current.clientToGraph(e.clientX, e.clientY);

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
  // 点击组件，显示抽屉
  const changeDrawer = (child: Child) => {
    console.log('abcdefg', graphRef.current);
    setFoldWrapItem({
      ...foldWrapItem,
      title: child.title,
      visible: true,
      desc: typeof child.content === 'string' ? child.content : '',
      icon: child.icon,
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
        key: 'start',
        type: 'general-Node',
        content: '工作流起始节点，用于设定启动工作流需要的信息',
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
      width: 344,
      height: 83,
      data: {
        title: '结束',
        icon: <ICON_END />,
        key: 'start',
        type: 'general-Node',
        content: '工作流的最终节点，用于返回工作流运行后的结果信息',
        backgroundColor: '#EEEEFF',
        noPopover: true,
        width: 384,
        height: 83,
      },
      zIndex: 2, // 新节点的层级设置为2
    });

    // 绑定事件处理器并获取清理函数
    const cleanup = EventHandlers(graphRef.current);
    // 在这里可以放置任何需要在组件卸载时清理的代码
    return () => {
      console.log('12312412', graphRef.current);
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
      {/* 右侧的操作栏 */}
      <FoldWrap
        className="foldWrapStyle"
        lineMargin
        title={foldWrapItem.title}
        visible={foldWrapItem.visible}
        onClose={closeDrawer}
        icon={foldWrapItem.icon}
      >
        123
      </FoldWrap>
    </div>
  );
};

export default AntvX6;
