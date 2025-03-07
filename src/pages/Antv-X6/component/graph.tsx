// 引入 AntV X6 的核心库和必要的插件。
import { Cell, Edge, Graph, Node, Shape } from '@antv/x6';
// 剪贴板插件，用于复制和粘贴节点
import { Clipboard } from '@antv/x6-plugin-clipboard';
// 历史记录插件，支持撤销/重做操作
import { History } from '@antv/x6-plugin-history';
// 键盘快捷键插件，提供快捷键操作
import { Keyboard } from '@antv/x6-plugin-keyboard';
// 对齐辅助线插件，帮助对齐节点
import { Snapline } from '@antv/x6-plugin-snapline';

import { Selection } from '@antv/x6-plugin-selection';
// 变换插件，支持缩放和平移操作
// import { Transform } from '@antv/x6-plugin-transform';
import { message } from 'antd';

import { ChildNode } from '@/types/interfaces/graph';
import { adjustParentSize } from '@/utils/graph';
// 自定义类型定义
import { GraphProp } from '@/types/interfaces/graph';
import { createCurvePath } from './registerCustomNodes';

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
  changeZoom,
}: GraphProp) => {
  const graphContainer = document.getElementById(containerId);
  // 如果找不到容器，则抛出错误
  if (!graphContainer) throw new Error('Container not found');

  // 注册自定义连接器
  Graph.registerConnector('curveConnector', createCurvePath, true);

  // 配置并注册新的边类型
  Edge.config({
    markup: [
      {
        tagName: 'path',
        selector: 'wrap',
        attrs: {
          fill: 'none',
          cursor: 'pointer',
          stroke: 'transparent',
          strokeLinecap: 'round',
        },
      },
      {
        tagName: 'path',
        selector: 'line',
        attrs: {
          fill: 'none',
          pointerEvents: 'none',
        },
      },
    ],
    connector: { name: 'curveConnector' }, // 使用自定义的connector
    attrs: {
      wrap: {
        connection: true,
        strokeWidth: 10,
        strokeLinejoin: 'round',
      },
      line: {
        connection: true,
        stroke: '#A2B1C3',
        strokeWidth: 1,
        targetMarker: {
          name: 'classic',
          size: 6,
        },
      },
    },
  });
  // 注册自定义边类型
  Graph.registerEdge('data-processing-curve', Edge, true);

  // 创建图形实例，并配置相关属性
  const graph = new Graph({
    container: graphContainer, // 设置 DOM 容器
    // grid: true, // 启用网格背景
    panning: true, //允许拖拽画布
    mousewheel: {
      enabled: true, // 启用鼠标滚轮缩放
      zoomAtMousePosition: true, // 在鼠标位置进行缩放
      modifiers: 'ctrl', // 需要按住 Ctrl 键才能触发缩放
      factor: 1.1,
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
      snap: true,
      createEdge() {
        return new Shape.Edge({
          shape: 'data-processing-curve', // 更改为使用注册的自定义边样式
          attrs: {
            line: {
              strokeDasharray: '5 5', // 示例：添加虚线效果
              strokeWidth: 1,
            },
          },
          zIndex: -1,
        });
      },
      validateConnection({
        sourceMagnet,
        targetMagnet,
        sourceCell,
        targetCell,
      }) {
        // 添加类型守卫，过滤 null/undefined
        if (!sourceMagnet || !targetMagnet || !sourceCell || !targetCell) {
          return false;
        }

        // 防止自己连接自己
        if (sourceCell === targetCell) {
          return false;
        }

        // 提取端口组信息
        const sourcePortGroup = sourceMagnet.getAttribute('port-group');
        const targetPortGroup = targetMagnet.getAttribute('port-group');

        // 边界检查：确保端口组属性存在
        if (!sourcePortGroup || !targetPortGroup) {
          return false;
        }

        // 定义类型断言函数
        const isLoopNode = (cell: Cell) => cell.getData()?.type === 'Loop';

        // 处理非 Loop 节点的连接限制
        if (!isLoopNode(sourceCell) && !isLoopNode(targetCell)) {
          // 非 Loop 节点的 in 端口只能作为 target
          if (sourcePortGroup === 'in') {
            return false; // 不允许 in 端口作为 source
          }
          // 非 Loop 节点的 out 端口只能作为 source
          if (targetPortGroup === 'out') {
            return false; // 不允许 out 端口作为 target
          }
        }

        // Loop 节点的 in 和 out 端口既可以作为 source 也可以作为 target
        if (isLoopNode(sourceCell) || isLoopNode(targetCell)) {
          return true; // Loop 节点允许任意连接
        }

        // 默认返回 true 允许其他类型的连接（这里已经通过了前面的所有检查）
        return true;
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
    embedding: {
      // 这里设置为false，设置为true会导致重叠节点一起移动
      enabled: false,
      // findParent({ e }) {
      //   // 根据鼠标位置找到可能的父节点
      //   const pos = graph.getPointByClient(e.clientX, e.clientY);
      //   return graph.findModelsInLayer(pos, (model) => model.isNode())[0];
      // },
    },
  });
  // let ctrlPressed = false
  // const embedPadding = 20

  // 使用多个插件来增强图形编辑器的功能
  graph
    // .use(new Transform({ resizing: true, rotating: true })) // 启用变换插件，允许节点缩放和旋转
    .use(new Snapline()) // 启用对齐辅助线插件，帮助节点对齐
    .use(new Keyboard()) // 启用键盘插件，支持快捷键操作
    .use(new Clipboard()) // 启用剪贴板插件，支持复制和粘贴
    .use(new History()) // 启用历史记录插件，支持撤销和重做
    .use(new Selection()); // 启用历史记录插件，支持撤销和重做

  // 监听连接桩鼠标进入事件
  graph.on('node:port:mouseenter', ({ port, node }) => {
    // 确保端口和端口ID存在
    if (!port) return;
    // 获取当前节点的端口
    const ports = node.getPorts();
    // 找到并更新特定端口的样式
    const updatedPorts = ports.map((p) => {
      if (p.id === port) {
        // 更新目标端口的尺寸
        p.attrs = {
          ...p.attrs,
          circle: { r: 10 }, // 假设你使用的是圆形作为端口图形，这里设置半径为8
        };
      }
      return p;
    });

    // 应用新的端口配置
    node.prop('ports/items', updatedPorts);
  });

  // 监听鼠标离开事件以恢复原始大小
  graph.on('node:port:mouseleave', ({ port, node }) => {
    // 确保端口和端口ID存在
    if (!port) return;

    // 获取当前节点的所有端口配置
    const ports = node.getPorts();

    // 找到并恢复特定端口的原始样式
    const updatedPorts = ports.map((p) => {
      if (p.id === port) {
        // 恢复目标端口的尺寸
        p.attrs = {
          ...p.attrs,
          circle: { r: 4 }, // 假设原始半径为4
        };
      }
      return p;
    });

    // 应用新的端口配置
    node.prop('ports/items', updatedPorts);
  });
  // 监听边鼠标进入事件
  graph.on('edge:click', ({ edge }) => {
    edge.attr('line/stroke', '#1890FF'); // 悬停时改为蓝色
  });
  // 监听边鼠标离开事件
  graph.on('edge:unselected', ({ edge }) => {
    edge.attr('line/stroke', '#C2C8D5'); // 恢复默认颜色
  });
  // 监听节点点击事件，调用 changeDrawer 函数更新右侧抽屉的内容
  graph.on('node:click', ({ node }) => {
    // 判断点击的是空白处还是节点
    if (node && node.isNode()) {
      // 先取消所有节点的选中状态
      graph.getNodes().forEach((n) => n.setData({ selected: false }));
      // 设置当前节点为选中状态
      node.setData({ selected: true });
      // 获取被点击节点的数据
      const data = node.getData(); // 获取被点击节点的数据
      data.id = node.id;
      changeDrawer(data); // 调用回调函数以更新抽屉内容
    }
  });

  graph.on('node:unselected', ({ node }: { node: Node }) => {
    node.setData({ selected: false });
  });

  // 假设 graph 是你的图实例
  graph.on('edge:connected', ({ isNew, edge }) => {
    // 新增：连接完成后恢复端口尺寸
    const restorePortSize = (node: Node, portId: string) => {
      const ports = node.getPorts();
      const updatedPorts = ports.map((p) => {
        if (p.id === portId) {
          p.attrs = { ...p.attrs, circle: { r: 4 } };
        }
        return p;
      });
      node.prop('ports/items', updatedPorts);
    };
    // 是否是连接桩到连接桩
    if (isNew) {
      edge.setRouter('manhattan');
      // 获取边的两个连接桩
      const sourcePort = edge.getSourcePortId();
      const getsourceNode = edge.getSourceNode();
      const targetPort = edge.getTargetPortId();
      const sourceNode = edge.getSourceNode()?.getData();
      const targetNode = edge.getTargetNode()?.getData();
      const targetNodeId = edge.getTargetCellId();
      if (getsourceNode && sourcePort) {
        restorePortSize(getsourceNode, sourcePort);
      }

      if (sourceNode.type === 'Loop') {
        console.log(targetNode);
        console.log(sourceNode.id);
        // 看连接的点是否时内部的节点
        if (targetNode.loopNodeId && targetNode.loopNodeId === sourceNode.id) {
          const _params = { ...sourceNode };
          _params.innerStartNodeId = targetNodeId;
          changeCondition(_params);
          edge.setZIndex(999); // 使用专用方法设置层级
          return;
        }
      }

      if (targetNode.type === 'Loop') {
        // 看连接的点是否时内部的节点

        if (sourceNode.loopNodeId && sourceNode.loopNodeId === targetNodeId) {
          const _params = { ...targetNode };
          _params.innerEndNodeId = sourceNode.id;
          changeCondition(_params);
          edge.setZIndex(999); // 使用专用方法设置层级
          return;
        }
      }

      // 这里统一让left作为接入点，right作为输出点
      if (sourcePort?.includes('left') || targetPort?.includes('right')) {
        graph.removeCell(edge.id);
        message.warning('左侧连接桩只能作为接入点，右侧连接桩只能作为输出点');
      }

      if (!sourceNode) return;

      // 查看出发的节点是否时意图识别和条件分支
      if (
        sourceNode.type === 'Condition' ||
        sourceNode.type === 'IntentRecognition' ||
        (sourceNode.type === 'QA' &&
          sourceNode.nodeConfig.answerType === 'SELECT')
      ) {
        if (!sourcePort) return;
        // 修改当前的数据
        const newNodeParams = JSON.parse(JSON.stringify(sourceNode));
        // 提取更新nextNodeIds的通用逻辑
        const updateNextNodeIds = (item: any, targetNodeId: number) => {
          item.nextNodeIds = item.nextNodeIds
            ? [...item.nextNodeIds, targetNodeId]
            : [targetNodeId];
        };
        if (sourceNode.type === 'Condition') {
          for (let item of newNodeParams.nodeConfig.conditionBranchConfigs) {
            if (sourcePort.includes(item.uuid)) {
              updateNextNodeIds(item, Number(targetNodeId));
            }
          }
        } else if (sourceNode.type === 'IntentRecognition') {
          for (let item of newNodeParams.nodeConfig.intentConfigs) {
            if (sourcePort.includes(item.uuid)) {
              updateNextNodeIds(item, Number(targetNodeId));
            }
          }
        } else {
          for (let item of newNodeParams.nodeConfig.options) {
            console.log('item', sourcePort, item.uuid);
            if (sourcePort.includes(item.uuid)) {
              updateNextNodeIds(item, Number(targetNodeId));
            }
          }
          console.log(newNodeParams);
        }

        changeCondition(newNodeParams);
        // 通知父组件更新节点信息
      } else {
        // 通知父组件创建边
        changeEdge('created', targetNodeId, sourceNode, edge.id);
        if (targetNode.loopNodeId && sourceNode.loopNodeId) {
          edge.setZIndex(999); // 使用专用方法设置层级
        }
      }

      edge.attr({
        line: {
          strokeDasharray: '', // 移除虚线样式
          stroke: '#C2C8D5', // 设置边的颜色
          strokeWidth: 1, // 设置边的宽度
        },
      });
    }
  });

  // 监听节点的拖拽移动位置
  graph.on('node:moved', ({ node, e }) => {
    e.stopPropagation(); // 阻止事件冒泡

    // 获取节点被拖拽到的位置
    const { x, y } = node.getPosition();
    const data = node.getData();
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
    // 如果时移动循环节点，且节点内有子节点
    if (data.type === 'Loop' && data.innerNodes && data.innerNodes.length > 0) {
      // 更新内部节点的位置信息
      data.innerNodes.forEach((innerNode: ChildNode) => {
        const childNode = graph.getCellById(innerNode.id.toString()) as Node;
        if (childNode) {
          const { x, y } = childNode.getPosition();
          if (innerNode.nodeConfig.extension) {
            innerNode.nodeConfig.extension.x = x;
            innerNode.nodeConfig.extension.y = y;
          } else {
            innerNode.nodeConfig.extension = { x, y };
          }
        }
      });
    }
    // 如果时循环内部的节点，要一并修改循环的宽度和位置
    if (data.loopNodeId) {
      const parentNode = graph.getCellById(data.loopNodeId) as Node;
      const _size = parentNode.getSize();
      const _position = parentNode.getPosition();
      const extension = {
        x: _position.x,
        y: _position.y,
        width: _size.width,
        height: _size.height,
      };
      const _data = parentNode.getData();
      _data.nodeConfig.extension = extension;
      changeCondition(_data);
    }

    changeCondition(data);
  });

  graph.on('blank:click', () => {
    // 先取消所有节点的选中状态
    graph.getNodes().forEach((n) => n.setData({ selected: false }));

    changeDrawer(null); // 调用回调函数以更新抽屉内容
  });

  // 监听画布缩放
  graph.on('scale', ({ sx }) => {
    changeZoom(sx);
  });

  graph.on('node:change:size', ({ node }) => {
    const children = node.getChildren();
    if (children && children.length) {
      node.prop('originSize', node.getSize());
    }
  });

  graph.on('node:change:position', ({ node }) => {
    // 优化点1：直接通过父子关系API获取父节点
    let parentNode = node.getParent();
    //
    const data = node.getData();
    if (!parentNode && data.loopNodeId) {
      const cell = graph.getCellById(data.loopNodeId);
      if (cell && cell.isNode()) {
        parentNode = cell as Node;
        // 确保传入的是 Node 类型
        if (parentNode instanceof Node) {
          adjustParentSize(parentNode);
        }
      }
      // return
    }
    // 优化点2：仅处理Loop类型的父节点
    if (
      parentNode &&
      parentNode.isNode() &&
      parentNode.getData()?.type === 'Loop'
    ) {
      adjustParentSize(parentNode);
    }
  });

  return graph; // 返回初始化好的图形实例
};

export default initGraph;
