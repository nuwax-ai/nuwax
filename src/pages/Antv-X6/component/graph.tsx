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
import { Transform } from '@antv/x6-plugin-transform';
// 自定义类型定义
import { GraphProp } from '@/types/interfaces/workflow';

/**
 * 初始化图形编辑器的函数，接收一个包含容器 ID 和改变抽屉内容回调的对象作为参数。
 * @param param0 - 包含容器 ID 和改变抽屉内容回调的对象
 * @returns 返回初始化后的图形实例
 */
const initGraph = ({ containerId, changeDrawer }: GraphProp) => {
  const graphContainer = document.getElementById(containerId);
  // 如果找不到容器，则抛出错误
  if (!graphContainer) throw new Error('Container not found');

  // 创建图形实例，并配置相关属性
  const graph = new Graph({
    container: graphContainer, // 设置 DOM 容器
    // grid: true, // 启用网格背景
    mousewheel: {
      enabled: true, // 启用鼠标滚轮缩放
      zoomAtMousePosition: true, // 在鼠标位置进行缩放
      modifiers: 'ctrl', // 需要按住 Ctrl 键才能触发缩放
      minScale: 0.5, // 最小缩放比例
      maxScale: 3, // 最大缩放比例
    },
    connecting: {
      router: 'manhattan', // 连接线路由方式，使用曼哈顿路径
      connector: {
        name: 'rounded', // 连接点样式，使用圆角矩形
        args: {
          radius: 8, // 圆角半径
        },
      },
      anchor: 'center', // 默认连接点位于元素中心
      connectionPoint: 'anchor', // 连接点类型为锚点
      allowBlank: false, // 禁止在空白区域创建连接
      snap: {
        radius: 20, // 连接时的吸附距离
      },
      createEdge() {
        // 创建新边时的默认设置
        return new Shape.Edge({
          attrs: {
            line: {
              stroke: '#A2B1C3', // 边的颜色
              strokeWidth: 2, // 边的宽度
              targetMarker: {
                name: 'block', // 目标端点标记类型
                width: 12, // 标记宽度
                height: 8, // 标记高度
              },
            },
          },
          zIndex: 0, // 设置边的 z-index 层级
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
    .use(new Transform({ resizing: true, rotating: true })) // 启用变换插件，允许节点缩放和旋转
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
    const data = node.getData(); // 获取被点击节点的数据
    data.id = node.id;
    changeDrawer(data); // 调用回调函数以更新抽屉内容
  });

  // 确保所有新的边都有更高的层级,这里可以触发父组件的方法，调用接口添加边
  graph.on('edge:added', ({ edge }) => {
    console.log('edge:added', edge);
    edge.setZIndex(3); // 边的层级设置为3
  });

  return graph; // 返回初始化好的图形实例
};

export default initGraph;
