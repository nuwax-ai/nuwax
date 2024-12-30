import { Button, Popover, Select } from 'antd';
import { useEffect, useRef } from 'react';
import registerCustomNodes from './component/customNodes'; // 引入自定义节点注册函数
import EventHandlers from './component/eventHandlers';
import InitGraph from './component/graph';
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
  // 创建一个用于存放图形的容器
  useEffect(() => {
    if (!containerRef.current) return;
    // 确保在调用任何需要DOM操作的函数之前，已经创建了必要的DOM元素
    preWork();
    // #region 初始化画布
    graph = InitGraph('graph-container');
    // 绑定事件处理器并获取清理函数
    const cleanup = EventHandlers(graph);
    // 在这里可以放置任何需要在组件卸载时清理的代码
    return () => {
      cleanup();
      // 确保释放资源
      graph.dispose();
    };
  }, []); // 空数组意味着这个效果只会在组件首次挂载时运行

  // 子组件新增节点
  const dragChild = (e: React.DragEvent<HTMLDivElement>, child: Child) => {
    // 根据子组件传递过来的数据，创建节点
    console.log(e, child);
    graph.addNode({
      shape: child.type,
      x: e.clientX - 310,
      y: e.clientY,
      attrs: {
        image: {
          'xlink:href': child.image, // 动态设置图像路径
        },
        title: {
          text: child.title,
        },
        content: {
          text: child.content,
        },
        moreOptions: {
          text: '...',
        },
      },
    });
  };

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
    </div>
  );
};

export default AntvX6;
