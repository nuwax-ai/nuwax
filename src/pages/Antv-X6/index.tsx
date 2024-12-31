import { Button, Drawer, Popover, Select } from 'antd';
import { useEffect, useRef, useState } from 'react';
import EventHandlers from './component/eventHandlers';
import InitGraph from './component/graph';
import { registerCustomNodes } from './component/registerCustomNodes'; // 引入自定义节点注册函数
import StencilContent from './component/stencil';
// 引入一些图标
import { HomeOutlined, PlusOutlined } from '@ant-design/icons';
import './index.less';
import { Child } from './type';

// 确保在应用启动时就注册所有自定义节点
registerCustomNodes();

const AntvX6 = () => {
  // 画布的ref
  const containerRef = useRef<HTMLDivElement>(null);
  // 是否显示抽屉
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  // 抽屉的title
  const [drawerItem, setDrawerItem] = useState<Child>({
    title: '',
    image: '',
    key: '',
    type: '',
    content: '',
  });

  // 初始化定义画布
  let graph: any;
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
    // 阻止默认行为以防止页面跳转等意外情况
    e.preventDefault();
    // 计算相对于画布的鼠标位置
    const point = graph.clientToGraph(e.clientX, e.clientY);
    console.log(graph);

    // 使用 getCellAt 方法获取鼠标指针下的单元
    const targetNode = graph.getCellAt(point.x, point.y);

    // 根据子组件传递过来的数据，创建节点
    const newNode = graph.addNode({
      shape: child.type,
      x: e.clientX - 310,
      y: e.clientY,
      data: child, // 确保这样设置了数据
    });

    // 如果有目标节点，并且它允许嵌套子节点，则将新节点添加到目标节点内
    if (targetNode && targetNode.isNode() && targetNode.canHaveChildren()) {
      targetNode.addChild(newNode);
    } else {
      // 否则直接添加到画布上
      graph.addCell(newNode);
    }
  };

  // 点击组件，显示抽屉
  const changeDrawer = (child: Child) => {
    console.log(child);
    setDrawerItem(child);
    setShowDrawer(true);
  };
  // 创建一个用于存放图形的容器
  useEffect(() => {
    if (!containerRef.current) return;
    // 确保在调用任何需要DOM操作的函数之前，已经创建了必要的DOM元素
    preWork();
    // #region 初始化画布
    graph = InitGraph({
      containerId: 'graph-container',
      changeDrawer: changeDrawer,
    });
    // 绑定事件处理器并获取清理函数
    const cleanup = EventHandlers(graph);
    // 在这里可以放置任何需要在组件卸载时清理的代码
    return () => {
      cleanup();
      // 确保释放资源
      graph.dispose();
    };
  }, []); // 空数组意味着这个效果只会在组件首次挂载时运行
  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
      id="container"
    >
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
        <Popover
          content={<StencilContent dragChild={dragChild} />}
          trigger="click"
        >
          <Button icon={<PlusOutlined />} type="primary">
            添加节点
          </Button>
        </Popover>
      </div>
      <Drawer
        title={
          <>
            <div>
              <img
                src={drawerItem.image}
                alt=""
                style={{ marginRight: '10px', width: '20px', height: '20px' }}
              />
              <span>{drawerItem.title}</span>
            </div>
            {typeof drawerItem.content === 'string' && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#979797',
                  marginTop: '10px',
                }}
              >
                {drawerItem.content}
              </div>
            )}
          </>
        }
        autoFocus
        closable={false}
        onClose={() => setShowDrawer(false)}
        open={showDrawer}
      >
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </Drawer>
    </div>
  );
};

export default AntvX6;
