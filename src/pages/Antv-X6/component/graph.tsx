// 引入 AntV X6 的核心库和必要的插件。
import { Cell, Edge, Graph, Node, Shape } from '@antv/x6';

// 剪贴板插件，用于复制和粘贴节点
import { Clipboard } from '@antv/x6-plugin-clipboard';
// 历史记录插件，支持撤销/重做操作
import { History } from '@antv/x6-plugin-history';
// 键盘快捷键插件，提供快捷键操作
import { Keyboard } from '@antv/x6-plugin-keyboard';
// 对齐辅助线插件，帮助对齐节点
import { Selection } from '@antv/x6-plugin-selection';
import { Snapline } from '@antv/x6-plugin-snapline';
// 变换插件，支持缩放和平移操作
// import { Transform } from '@antv/x6-plugin-transform';
import { Child, ChildNode } from '@/types/interfaces/graph';
import { adjustParentSize } from '@/utils/graph';
import { message, Modal } from 'antd';
// 自定义类型定义
import PlusIcon from '@/assets/svg/plus_icon.svg';
import { GraphProp } from '@/types/interfaces/graph';
import {
  handleLoopEdge,
  handleSpecialNodeTypes,
  hasDuplicateEdge,
  isValidLoopConnection,
  setEdgeAttributes,
  updateEdgeArrows,
  validatePortConnection,
} from '@/utils/graph';
import { createCurvePath } from './registerCustomNodes';
import StencilContent from './stencil';
// import { PlusOutlined,} from '@ant-design/icons';
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
  createNodeToPortOrEdge,
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
      },
      {
        tagName: 'path',
        selector: 'line',
      },
    ],
    connector: { name: 'curveConnector' }, // 使用自定义的connector
    attrs: {
      wrap: {
        connection: true,
        strokeWidth: 10,
        strokeLinejoin: 'round',
        cursor: 'pointer',
        pointerEvents: 'none',
      },
      line: {
        connection: true,
        strokeWidth: 1,
        pointerEvents: 'none',
        targetMarker: {
          name: 'classic',
          size: 6,
        },
      },
    },
  });
  // 注册自定义边类型
  // Graph.registerEdge('data-processing-curve', Edge, true);

  // 通过边和连接桩创捷节点并添加连线
  const createNodeAndEdge = (
    graph: Graph,
    event: any,
    // 源节点
    sourceNode: ChildNode,
    // 源端口的id
    portId: string,
    targetNode?: ChildNode,
    edgeId?: string,
  ) => {
    const eventTarget =
      event.originalEvent.originalEvent || event.originalEvent;

    const position = graph.clientToLocal({
      x: eventTarget.clientX,
      y: eventTarget.clientY + 50,
    });

    const dragChild = (child: Child) => {
      createNodeToPortOrEdge(
        child,
        sourceNode,
        portId,
        position,
        targetNode,
        edgeId,
      );
    };
    const popoverContent = (
      <div className="confirm-popover">
        <StencilContent
          dragChild={(child: Child) => {
            dragChild(child);
            Modal.destroyAll();
          }}
        />
      </div>
    );
    Modal.confirm({
      content: popoverContent,
      footer: null,
      icon: null,
      width: 260,
      maskClosable: true,
      getContainer: () => document.body,
      style: {
        position: 'fixed',
        left: eventTarget?.clientX,
      },
    });
  };

  // 创建图形实例，并配置相关属性
  const graph = new Graph({
    container: graphContainer, // 设置 DOM 容器
    // grid: true, // 启用网格背景
    autoResize: true, // 自动调整大小
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
      allowMulti: true, // 允许同一个连接桩连接多个边
      allowNode: false,
      allowLoop: false, //禁止自己连接自己
      allowEdge: false,
      highlight: true, //当用户尝试创建连接且鼠标悬停在一个有效的连接点上时，该连接点会被高亮显示
      snap: {
        radius: 50, // 设置自定义的吸附半径，例如从默认的50px改为24px或其他值
        anchor: 'bbox', // 或者 'center'，决定计算距离时是基于节点中心还是包围盒
      },
      createEdge() {
        return new Shape.Edge({
          // shape: 'data-processing-curve', // 更改为使用注册的自定义边样式
          attrs: {
            line: {
              strokeDasharray: '5 5', // 示例：添加虚线效果
              strokeWidth: 1,
              targetMarker: null, // 初始不显示箭头
              style: {
                animation: 'ant-line 30s infinite linear',
              },
            },
          },
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
        const targetMagnetElement = targetMagnet.closest(
          '.x6-port-body',
        ) as HTMLElement;
        // 提取端口组信息 (关键修复：添加空值保护)
        const sourcePortGroup = sourceMagnet.getAttribute('port-group') || '';
        const targetPortGroup =
          targetMagnetElement.getAttribute('port-group') || '';

        // 获取源端口和目标端口的唯一标识符
        const sourcePortId = sourceMagnet.getAttribute('port');
        const targetPortId = targetMagnetElement.getAttribute('port');
        // 如果端口ID缺失，则阻止连接
        if (!sourcePortId || !targetPortId) {
          return false;
        }

        // 检查是否已经存在从 sourcePort 到 targetPort 的边
        const existingEdges = graph.getEdges();
        const isDuplicateEdge = existingEdges.some((edge) => {
          const edgeSource = edge.getSource();
          const edgeTarget = edge.getTarget();

          if (
            typeof edgeSource === 'object' &&
            'cell' in edgeSource &&
            'port' in edgeSource &&
            typeof edgeTarget === 'object' &&
            'cell' in edgeTarget &&
            'port' in edgeTarget
          ) {
            return (
              edgeSource.cell === sourceCell.id && // 源节点相同
              edgeSource.port === sourcePortId && // 源端口相同
              edgeTarget.cell === targetCell.id && // 目标节点相同
              edgeTarget.port === targetPortId // 目标端口相同
            );
          }

          return false; // 如果 edgeSource 或 edgeTarget 不符合预期类型，跳过检查
        });

        if (isDuplicateEdge) {
          // 如果存在重复的边，返回 false 以阻止新边创建
          return false;
        }

        // 定义类型断言函数
        const isLoopNode = (cell: Cell) => cell.getData()?.type === 'Loop';

        // 处理非 Loop 节点的连接限制 (逻辑优化)
        if (!isLoopNode(sourceCell) && !isLoopNode(targetCell)) {
          // 允许从 out 到 in 的正常连接
          if (
            (sourcePortGroup === 'out' || sourcePortGroup === 'special') &&
            targetPortGroup === 'in'
          ) {
            return true;
            // return validatePortConnection(sourcePortGroup, targetPortGroup);
          }
          return false; // 阻止其他类型的连接
        }

        // Loop 节点的 in 和 out 端口既可以作为 source 也可以作为 target
        if (isLoopNode(sourceCell) || isLoopNode(targetCell)) {
          return true;
        }

        return true;
      },
    },
    highlighting: {
      magnetAdsorbed: {
        name: 'stroke', // 当磁铁吸附时使用的高亮样式
        args: {
          attrs: {
            fill: '#5147FF', // 内部填充颜色
            stroke: '#5147FF', // 边框颜色
          },
        },
      },
    },
    embedding: {
      // 这里设置为false，设置为true会导致重叠节点一起移动
      enabled: false,
    },
  });

  const changePortSize = () => {
    graph.getNodes().forEach((node) => {
      const ports = node.getPorts();
      const updatedPorts = ports.map((p) => ({
        ...p,
        attrs: {
          ...p.attrs,
          // hotArea: { r: 15 }, // 保持热区不变
          circle: { r: 3 }, // 强制重置所有连接桩半径
          pointerEvents: 'all', // 保持事件穿透
          event: 'mouseenter',
        },
      }));
      node.prop('ports/items', updatedPorts);
    });
  };

  const changeZindex = (node?: Node) => {
    const nodes = graph.getNodes();
    // 先将其他节点的zindex设置为4
    nodes.forEach((n) => {
      n.setData({ selected: false });
      n.prop('zIndex', 4); // 正确设置层级
    });
    // 将loop节点设置为5
    const loopData = nodes.filter((item) => {
      const data = item.getData();
      return data.type === 'Loop';
    });
    // loop节点的子节点设置为8
    loopData.forEach((child) => {
      child.prop('zIndex', 5); // 正确设置层级
      const sun = child.getChildren();
      sun?.forEach((sun) => {
        sun.prop('zIndex', 8); // 正确设置层级
      });
    });
    if (node) {
      const data = node.getData();
      if (data.type === 'Loop') {
        const children = node.getChildren();
        children?.forEach((child) => {
          // 使用 X6 内置类型检查方法
          if (child.isEdge()) {
            child.prop('zIndex', 15);
          } else {
            child.prop('zIndex', 20);
          }
        });
        // 设置内部边的层级
        node.prop('zIndex', 10);
      } else {
        node.prop('zIndex', 99);
      }
    }
  };

  // 使用多个插件来增强图形编辑器的功能
  graph
    // .use(new Transform({ resizing: true, rotating: true })) // 启用变换插件，允许节点缩放和旋转
    .use(new Snapline()) // 启用对齐辅助线插件，帮助节点对齐
    .use(new Keyboard()) // 启用键盘插件，支持快捷键操作
    .use(new Clipboard()) // 启用剪贴板插件，支持复制和粘贴
    .use(new History()) // 启用历史记录插件，支持撤销和重做
    .use(new Selection()); // 启用选择插件，并配置选择限制

  // 监听连接桩鼠标进入事件
  graph.on('node:mouseenter', ({ node }) => {
    const currentPorts = node.getPorts();
    // 更新当前节点端口
    const updatedPorts = currentPorts.map((p) => ({
      ...p,
      attrs: {
        ...p.attrs,
        circle: {
          ...(p.attrs?.circle || {}),
          r: 8,
          stroke: '#5147FF',
          fill: '#5147FF',
        },
        icon: {
          ...(p.attrs?.icon || {}),
          width: 10, // 显示图标
          height: 10,
          x: -5, // 图标居中
          y: -5,
          opacity: 1, // 通过设置透明度来控制显示
        },
        hoverCircle: {
          pointerEvents: 'none',
        },
      },
    }));
    node.prop('ports/items', updatedPorts);
  });

  graph.on('node:mouseleave', ({ node }) => {
    const ports = node.getPorts();
    const updatedPorts = ports.map((p) => ({
      ...p,
      attrs: {
        ...p.attrs,
        circle: {
          ...(p.attrs?.circle || {}),
          r: 3, // 仅修改当前端口
          stroke: '#5147FF',
          fill: '#5147FF',
        },
        icon: {
          ...(p.attrs?.icon || {}),
          width: 0, // 显示图标
          height: 0,
          opacity: 0, // 设置为完全透明
        },
        hoverCircle: {
          pointerEvents: 'visiblePainted',
        },
      },
    }));
    node.prop('ports/items', updatedPorts);
  });

  graph.on('node:port:click', ({ node, port, e }) => {
    // 查看当前节点是否为循环的子节点
    const isLoopNode = node.getData()?.loopNodeId;
    if (isLoopNode) {
      const isIn = port?.includes('in');
      // 找到当前节点的父节点
      const parentNode = node.getParent()?.getData();
      // 查看当前节点是否为循环节点的开始的子节点或者结束的子节点
      const isStartNode = node.getData()?.id === parentNode.innerStartNodeId;
      const isEndNode = node.getData()?.id === parentNode.innerEndNodeId;

      if ((isStartNode && isIn) || (isEndNode && !isIn)) {
        message.warning('循环节点的开始和结束节点不能快捷添加其他节点');
        return;
      }
    }
    createNodeAndEdge(graph, e, node.getData(), port as string);
  });

  // // 在创建图形实例后添加事件监听
  graph.on('edge:mouseenter', ({ edge }) => {
    const sourceNode = edge.getSourceCell()?.getData();
    const targetNode = edge.getTargetCell()?.getData();
    if (
      (sourceNode.type === 'Loop' && targetNode.loopNodeId) ||
      (sourceNode.loopNodeId && targetNode?.type === 'Loop')
    )
      return;

    edge.addTools([
      {
        name: 'button',
        args: {
          markup: [
            {
              tagName: 'circle',
              selector: 'button',
              attrs: {
                r: 8,
                stroke: '#5147FF',
                strokeWidth: 1,
                fill: '#5147FF',
                cursor: 'pointer',
              },
            },
            {
              tagName: 'image',
              selector: 'icon',
              attrs: {
                href: PlusIcon,
                width: 10,
                height: 10,
                x: -5,
                y: -5,
                pointerEvents: 'none',
              },
            },
          ],
          distance: '50%',
          offset: { x: 0, y: 0 },
          onClick({ e }: { e: MouseEvent }) {
            const source = edge.getSourceCell()?.getData();
            const target = edge.getTargetCell()?.getData();
            const sourcePort = edge.getSourcePortId();

            if (!source || !target) return;
            createNodeAndEdge(
              graph,
              e,
              source,
              sourcePort as string,
              target,
              edge.id,
            );
          },
        },
      },
    ]);
  });

  graph.on('edge:mouseleave', ({ edge }) => {
    edge.removeTools();
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
    // 如果是循环内部的节点，要一并修改循环的宽度和位置
    if (data.loopNodeId) {
      const parentNode = graph.getCellById(data.loopNodeId) as Node;
      const _position = parentNode.getPosition();
      const children = parentNode.getChildren();
      if (children && children.length) {
        // // 找到循环节点中当前被移动的节点
        for (let item of children) {
          if (!item.isNode()) return;
          const childrenData = item.getData();
          if (childrenData.id === data.id) {
            childrenData.nodeConfig.extension.x = x;
            childrenData.nodeConfig.extension.y = y;
            changeCondition(childrenData, 'moved');
          }
        }
      }

      const _size = parentNode.getSize();

      // 更新当前循环节点的大小和位置
      const parent = parentNode.getData();
      if (parent) {
        parent.nodeConfig.extension.width = _size.width;
        parent.nodeConfig.extension.height = _size.height;
        parent.nodeConfig.extension.x = _position.x;
        parent.nodeConfig.extension.y = _position.y;
        changeCondition(parent, 'moved');
      }
      return;
    }

    if (data.type === 'Loop') {
      const children = node.getChildren();
      const innerNodes = data.innerNodes || [];

      if (children && children.length) {
        // 找到循环节点中当前被移动的节点
        for (let item of children) {
          // console.log(item.isNode())
          if (item.isNode()) {
            const position = item.getPosition();
            const childrenData = item.getData();

            childrenData.nodeConfig.extension.x = position.x;
            childrenData.nodeConfig.extension.y = position.y;
            //  如果当前innerNodes没有这个节点，就添加进去
            if (
              !innerNodes.find((node: ChildNode) => node.id === childrenData.id)
            ) {
              innerNodes.push(childrenData);
            } else {
              // 如果当前innerNodes有这个节点，就更新
              const index = innerNodes.findIndex(
                (node: ChildNode) => node.id === childrenData.id,
              );
              innerNodes[index] = childrenData;
            }
          }
        }
      }

      data.innerNodes = innerNodes;
      data.nodeConfig.extension.x = x;
      data.nodeConfig.extension.y = y;
      const _size = node.getSize();
      data.nodeConfig.extension.width = _size.width;
      data.nodeConfig.extension.height = _size.height;

      changeCondition(data, 'moved');
      return;
    }

    // node.prop('zIndex', 99);
    changeCondition(data, 'moved');
    changeZindex(node);
  });

  // 监听连接桩鼠标离开事件
  graph.on('node:mouseleave', () => {
    changePortSize();
  });
  // 监听边移除事件
  graph.on('edge:removed', () => {
    // 遍历所有节点
    changePortSize();
    // 统一调用更新
    updateEdgeArrows(graph);
  });
  // 点击空白处，取消所有的选中
  graph.on('blank:click', () => {
    const nodes = graph.getNodes();
    nodes.forEach((node) => {
      node.setData({ selected: false });
    });
    changeDrawer(null); // 调用回调函数以更新抽屉内容
    graph.cleanSelection();
  });
  // 监听边选中
  graph.on('edge:click', ({ edge }) => {
    edge.attr('line/stroke', '#37D0FF'); // 悬停时改为蓝色
  });
  // 监听边取消选中事件
  graph.on('edge:unselected', ({ edge }) => {
    edge.attr('line/stroke', '#5147FF'); // 恢复默认颜色
  });
  // 监听节点点击事件，调用 changeDrawer 函数更新右侧抽屉的内容
  graph.on('node:click', ({ node }) => {
    // 先取消所有节点的选中状态
    graph.cleanSelection();
    // 设置当前节点为选中状态
    changeZindex(node);
    // node.setData({ selected: true });
    graph.select(node); // 使用 AntV X6 的选中 API
    // 获取被点击节点的数据
    const latestData = {
      ...node.getData(),
      id: node.id,
    };
    changeDrawer(latestData);
  });

  graph.on('node:unselected', ({ node }: { node: Node }) => {
    node.setData({ selected: false });
  });

  // 新增连线
  graph.on('edge:connected', ({ isNew, edge }) => {
    changePortSize();
    // 是否是连接桩到连接桩
    edge.setRouter('manhattan');
    if (!isNew) return;
    // 查看当前的边是否已经有了
    const edges = graph.getEdges();
    const sourceCellId = edge.getSourceCellId();
    const targetNodeId = edge.getTargetCellId();
    // 获取边的两个连接桩
    const sourcePort = edge.getSourcePortId();
    const targetPort = edge.getTargetPortId();
    const sourceNode = edge.getSourceNode()?.getData();
    const targetNode = edge.getTargetNode()?.getData();

    if (!sourceNode || !targetNode || !sourcePort || !targetPort) return;
    // 检查是否存在具有相同source和target的边
    if (
      hasDuplicateEdge(
        edges,
        sourceCellId,
        targetNodeId,
        sourcePort,
        targetPort,
        edge.id,
      )
    ) {
      // [!code ++]
      edge.remove();
      message.warning('不能创建重复的边');
      return;
    }
    // 处理循环节点的逻辑
    if (sourceNode.type === 'Loop' || targetNode.type === 'Loop') {
      console.log(sourcePort);
      if (
        (sourceNode.type === 'Loop' &&
          !targetNode.loopNodeId &&
          sourcePort.includes('in')) ||
        (targetNode.type === 'Loop' &&
          !sourceNode.loopNodeId &&
          targetPort.includes('out'))
      ) {
        message.warning('不能连接外部的节点');
        edge.remove();
        return;
      }
      // 确保传递正确的参数类型给 handleLoopEdge 函数
      const _params = handleLoopEdge(
        sourceNode as ChildNode,
        targetNode as ChildNode,
      );
      if (typeof _params === 'string' && _params === 'error') {
        edge.remove();
        return;
      }
      if (_params && typeof _params !== 'string') {
        changeCondition(_params, targetNode.id);
        graph.addEdge(edge);
        setEdgeAttributes(edge);
        edge.toFront();
        return;
      }
    }
    // 校验是否从右侧连接桩连入，左侧连接桩连出
    if (!validatePortConnection(sourcePort, targetPort)) {
      edge.remove();
      return;
    }

    // 如果是循环内部的节点被外部的节点连接或者内部的节点连接外部的节点，就告知不能连接
    const currentLoopNodeId = sourceNode.loopNodeId || targetNode.loopNodeId;
    if (currentLoopNodeId) {
      if (
        !isValidLoopConnection(sourceNode, currentLoopNodeId) ||
        !isValidLoopConnection(targetNode, currentLoopNodeId)
      ) {
        message.warning('不能连接外部节点');
        edge.remove();
        return;
      }
    }
    // 处理特殊的三个节点
    if (
      sourceNode.type === 'Condition' ||
      sourceNode.type === 'IntentRecognition' ||
      (sourceNode.type === 'QA' &&
        sourceNode.nodeConfig.answerType === 'SELECT')
    ) {
      //
      const _params = handleSpecialNodeTypes(
        sourceNode,
        targetNode,
        sourcePort,
      );
      changeCondition(_params, targetNodeId);
      // 通知父组件更新节点信息
    } else {
      // 通知父组件创建边
      changeEdge('created', targetNodeId, sourceNode, edge.id);
    }
    graph.addEdge(edge);
    setEdgeAttributes(edge);
    // edge.toFront()
    setTimeout(() => {
      if (sourceNode.loopNodeId || targetNode.loopNodeId) {
        edge.prop('zIndex', 15);
      } else {
        edge.prop('zIndex', 1);
      }
      updateEdgeArrows(graph);
    }, 0);
    // 统一调用更新
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
    if (node.getData().type !== 'Loop') {
      node.toFront();
    }
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

  //

  return graph; // 返回初始化好的图形实例
};

export default initGraph;
