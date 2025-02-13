// 引入 AntV X6 的核心库和必要的插件。
import { Graph, Shape } from '@antv/x6';
// 剪贴板插件，用于复制和粘贴节点
import { Clipboard } from '@antv/x6-plugin-clipboard';
// 历史记录插件，支持撤销/重做操作
import { History } from '@antv/x6-plugin-history';
// 键盘快捷键插件，提供快捷键操作
import { Keyboard } from '@antv/x6-plugin-keyboard';
// 选择插件，支持多选和框选功能
import { Selection } from '@antv/x6-plugin-selection';
// 对齐辅助线插件，帮助对齐节点
import { Snapline } from '@antv/x6-plugin-snapline';
// 变换插件，支持缩放和平移操作
// import { Transform } from '@antv/x6-plugin-transform';
import { message, Popover } from 'antd';
import ReactDOM from 'react-dom/client';
// 自定义类型定义
import { GraphProp } from '@/types/interfaces/graph';
import { createCurvePath } from './registerCustomNodes';
let currentPopover: any = null; // 用于跟踪当前显示的Popover
/**
 * 初始化图形编辑器的函数，接收一个包含容器 ID 和改变抽屉内容回调的对象作为参数。
 * @param param0 - 包含容器 ID 和改变抽屉内容回调的对象
 * @returns 返回初始化后的图形实例
 */
const initGraph = ({
  containerId,
  changeDrawer,
  changeEdge,
  changeCondition,
}: GraphProp) => {
  const graphContainer = document.getElementById(containerId);
  // 如果找不到容器，则抛出错误
  if (!graphContainer) throw new Error('Container not found');

  // 注册自定义连接器
  // 注册自定义连接器
  Graph.registerConnector('curveConnector', createCurvePath, true);

  Graph.registerEdge(
    'dag-edge',
    {
      inherit: 'edge',
      attrs: {
        line: {
          stroke: '#C2C8D5',
          strokeWidth: 1,
          targetMarker: null,
        },
      },
    },
    true,
  );

  // 创建图形实例，并配置相关属性
  const graph = new Graph({
    container: graphContainer, // 设置 DOM 容器
    // grid: true, // 启用网格背景
    panning: true, //允许拖拽画布
    mousewheel: {
      enabled: true, // 启用鼠标滚轮缩放
      zoomAtMousePosition: true, // 在鼠标位置进行缩放
      modifiers: 'ctrl', // 需要按住 Ctrl 键才能触发缩放
      minScale: 0.5, // 最小缩放比例
      maxScale: 3, // 最大缩放比例
    },
    connecting: {
      router: 'manhattan', // 连接线路由方式，使用曼哈顿路径
      connector: 'curveConnector',
      // anchor: 'center', // 默认连接点位于元素中心
      connectionPoint: 'anchor', // 连接点类型为锚点
      allowBlank: false, // 禁止在空白区域创建连接
      allowMulti: true,
      allowLoop: false, //禁止自己连接自己
      highlight: true, //当用户尝试创建连接且鼠标悬停在一个有效的连接点上时，该连接点会被高亮显示
      snap: {
        radius: 20, // 连接时的吸附距离
      },
      createEdge() {
        // 创建新边时的默认设置
        return new Shape.Edge({
          shape: 'dag-edge',
          attrs: {
            line: {
              strokeDasharray: '5 5',
            },
          },
          zIndex: -1,
        });
      },
      validateConnection({ targetMagnet }) {
        return !!targetMagnet; // 验证连接是否有效，只有目标有磁铁时才允许连接
      },
    },
    highlighting: {
      magnetAdsorbed: {
        name: 'stroke', // 当磁铁吸附时使用的高亮样式
        args: {
          attrs: {
            fill: '#5F95FF', // 内部填充颜色
            stroke: '#5F95FF', // 边框颜色
          },
        },
      },
    },
  });

  // 使用多个插件来增强图形编辑器的功能
  graph
    // .use(new Transform({ resizing: true, rotating: true })) // 启用变换插件，允许节点缩放和旋转
    .use(new Selection({ rubberband: true, showNodeSelectionBox: true })) // 启用选择插件，允许框选和显示选择框
    .use(new Snapline()) // 启用对齐辅助线插件，帮助节点对齐
    .use(new Keyboard()) // 启用键盘插件，支持快捷键操作
    .use(new Clipboard()) // 启用剪贴板插件，支持复制和粘贴
    .use(new History()); // 启用历史记录插件，支持撤销和重做

  /**
   * 控制连接桩（ports）的显示与隐藏
   * @param ports - 查询到的所有连接桩元素
   * @param show - 是否显示连接桩
   */
  const showPorts = (ports: NodeListOf<SVGElement>, show: boolean) => {
    for (let i = 0, len = ports.length; i < len; i += 1) {
      ports[i].style.visibility = show ? 'visible' : 'hidden';
    }
  };

  // 监听鼠标进入节点事件，显示连接桩
  graph.on('node:mouseenter', () => {
    const ports = graphContainer.querySelectorAll(
      '.x6-port-body',
    ) as NodeListOf<SVGElement>;
    showPorts(ports, true);
  });

  // 监听鼠标离开节点事件，隐藏连接桩
  graph.on('node:mouseleave', () => {
    const ports = graphContainer.querySelectorAll(
      '.x6-port-body',
    ) as NodeListOf<SVGElement>;
    showPorts(ports, false);
  });

  // 监听节点点击事件，调用 changeDrawer 函数更新右侧抽屉的内容
  graph.on('node:click', ({ node }) => {
    // 判断点击的是空白处还是节点
    if (node && node.isNode()) {
      // 获取被点击节点的数据
      const data = node.getData(); // 获取被点击节点的数据
      data.id = node.id;
      changeDrawer(data); // 调用回调函数以更新抽屉内容
    }
  });

  // 假设 graph 是你的图实例
  graph.on('edge:connected', ({ isNew, edge }) => {
    // 是否是连接桩到连接桩
    if (isNew) {
      edge.setRouter('manhattan');
      // 获取边的两个连接桩
      const sourcePort = edge.getSourcePortId();
      const targetPort = edge.getTargetPortId();
      // 这里统一让left作为接入点，right作为输出点
      if (sourcePort?.includes('left') || targetPort?.includes('right')) {
        graph.removeCell(edge.id);
        message.warning('左侧连接桩只能作为接入点，右侧连接桩只能作为输出点');
      }

      const sourceNode = edge.getSourceNode()?.getData();
      const targetNodeId = edge.getTargetCellId();

      if (!sourceNode) return;
      // 查看出发的节点是否时意图识别和条件分支
      if (
        sourceNode.type === 'Condition' ||
        sourceNode.type === 'IntentRecognition'
      ) {
        if (!sourcePort) return;
        // console.log(Number(sourcePort))
        // 获取当前连接桩的输出端口
        const _index: string = sourcePort.split('-')[1];
        // 修改当前的数据
        const newNodeParams = JSON.parse(JSON.stringify(sourceNode));
        newNodeParams.nodeConfig.conditionBranchConfigs[
          _index
        ].nextNodeIds.push(targetNodeId);
        changeCondition(newNodeParams);
        // 通知父组件更新节点信息
      } else {
        // 通知父组件创建边
        changeEdge(sourceNode, targetNodeId, 'created', edge.id);
      }
    }
  });

  // 创建一个动态容器用于渲染 Popover
  const popoverContainer = document.createElement('div');
  document.body.appendChild(popoverContainer);
  // 给所有的边添加一个右键监听
  // 监听边的右键事件
  graph.on('edge:contextmenu', ({ edge, x, y, e }) => {
    e.preventDefault(); // 阻止默认右键菜单
    // 如果当前已经有Popover显示，先销毁它
    if (currentPopover) {
      currentPopover.unmount();
      currentPopover = null;
    }
    // 渲染 Popover 内容
    currentPopover = ReactDOM.createRoot(popoverContainer);
    // 创建一个删除边的回调函数
    const handleDeleteEdge = () => {
      const sourceNode = edge.getSourceNode()?.getData();
      const targetNodeId = edge.getTargetCellId();

      if (
        sourceNode.type === 'Condition' ||
        sourceNode.type === 'IntentRecognition'
      ) {
        // 获取边的两个连接桩
        const sourcePort = edge.getSourcePortId();
        if (!sourcePort) return;
        // 获取当前连接桩的输出端口
        const _index: string = sourcePort.split('-')[1];
        // 修改当前的数据
        const newNodeParams = JSON.parse(JSON.stringify(sourceNode));
        newNodeParams.nodeConfig.conditionBranchConfigs[_index].nextNodeIds =
          newNodeParams.nodeConfig.conditionBranchConfigs[
            _index
          ].nextNodeIds.filter((item: number) => item !== Number(targetNodeId));
        changeCondition(newNodeParams);
      } else {
        // 通知父组件删除边
        changeEdge(sourceNode, targetNodeId, 'delete', edge.id);
      }

      // 销毁Popover
      if (currentPopover) {
        currentPopover.unmount();
        currentPopover = null;
      }
      // 删除边
      graph.removeEdge(edge.id);
    };

    currentPopover.render(
      <Popover
        defaultOpen={true}
        destroyTooltipOnHide
        placement="top"
        overlayStyle={{
          position: 'absolute',
          left: `${x}px`,
          top: `${y + 40}px`,
        }}
        content={<p onClick={handleDeleteEdge}>删除</p>}
      />,
    );
  });

  // 监听节点的拖拽移动位置
  graph.on('node:moved', ({ node }) => {
    // 获取节点被拖拽到的位置
    const { x, y } = node.getPosition();
    const data = node.getData();
    console.log(' data.nodeConfig.extension', x);
    // 将节点的extension属性设置为拖拽后的位置
    if (data.nodeConfig && data.nodeConfig.extension) {
      data.nodeConfig.extension.x = x;
      data.nodeConfig.extension.y = y;
    } else {
      data.nodeConfig.extension = {
        x,
        y,
      };
    }
    changeCondition(data);
  });

  return graph; // 返回初始化好的图形实例
};

export default initGraph;
