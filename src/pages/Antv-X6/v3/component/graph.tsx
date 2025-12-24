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
import { ChildNode, StencilChildNode } from '@/types/interfaces/graph';
import { message, Modal } from 'antd';
import {
  adjustParentSize,
  registerNodeClickAndDblclick,
  showExceptionPort,
  validateConnect,
} from '../utils/graphV3';

// 初始化标志：当为true时，所有历史记录操作将被忽略
// 用于在工作流加载时阻止初始化操作被记录到历史栈
let isInitializing = true;

// 导出控制初始化标志的函数
export const setGraphInitializing = (value: boolean) => {
  isInitializing = value;
};
// 自定义类型定义
import PlusIcon from '@/assets/svg/plus_icon.svg';
import { AnswerTypeEnum, NodeTypeEnum } from '@/types/enums/common';
import {
  NodeUpdateEnum,
  PortGroupEnum,
  UpdateEdgeType,
} from '@/types/enums/node';
import { GraphProp } from '@/types/interfaces/graph';
import { ExceptionHandleConfig } from '@/types/interfaces/node';
import { cloneDeep } from '@/utils/common';
import StencilContent from '../components/layout/Sidebar';
import {
  getPortGroup,
  handleLoopEdge,
  handleSpecialNodeTypes,
  needUpdateNodes,
  setEdgeAttributes,
  updateEdgeArrows,
} from '../utils/graphV3';
import { generatePorts } from '../utils/workflowV3';
import { createCurvePath } from './registerCustomNodes';
/**
 * 端口配置接口
 */
interface PortConfig {
  attrs: {
    circle?: {
      r: number;
      stroke: string;
      fill: string;
    };
    icon?: {
      width: number;
      height: number;
      x?: number;
      y?: number;
      opacity: number;
    };
    hoverCircle?: {
      pointerEvents: string;
    };
  };
}

/**
 * 端口状态类型
 */
type PortStatus = 'normal' | 'active';

/**
 * 初始化图形编辑器的函数，接收一个包含容器 ID 和改变抽屉内容回调的对象作为参数。
 * @param param0 - 包含容器 ID 和改变抽屉内容回调的对象
 * @returns 返回初始化后的图形实例
 */
const initGraph = ({
  containerId,
  changeDrawer,
  changeCondition,
  changeEdgeConfigWithRefresh,
  changeNodeConfigWithRefresh,
  changeZoom,
  createNodeByPortOrEdge,
  onSaveNode,
  onClickBlank,
}: GraphProp): Graph => {
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
    // const eventTarget =
    //   event.originalEvent.originalEvent || event.originalEvent;
    const targetRect = event.target.getBoundingClientRect();
    // 计算中心点
    const centerX = targetRect.left + targetRect.width / 2;
    const centerY = targetRect.top + targetRect.height / 2;

    const position = graph.clientToLocal({
      x: centerX,
      y: centerY,
    });
    const dragChild = (child: StencilChildNode) => {
      createNodeByPortOrEdge({
        child,
        sourceNode,
        portId,
        position,
        targetNode,
        edgeId,
      });
    };
    // 如果当前节点在循环内，或者源节点本身就是循环节点，则不展示循环节点选项
    const isInLoop = !!(
      sourceNode?.loopNodeId || sourceNode?.type === NodeTypeEnum.Loop
    );
    const popoverContent = (
      <div className="confirm-popover">
        <StencilContent
          dragChild={(child: StencilChildNode) => {
            dragChild(child);
            Modal.destroyAll();
          }}
          isLoop={isInLoop}
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
        left: centerX,
      },
    });
  };

  // 创建图形实例，并配置相关属性
  const graph = new Graph({
    container: graphContainer, // 设置 DOM 容器
    grid: {
      visible: true,
      type: 'dot',
      size: 22,
      args: {
        color: '#606060',
        thickness: 1,
      },
    }, // 启用网格背景
    autoResize: true, // 自动调整大小
    panning: true, //允许拖拽画布
    mousewheel: {
      enabled: true, // 启用鼠标滚轮缩放
      zoomAtMousePosition: true, // 在鼠标位置进行缩放
      minScale: 0.2, // 最小缩放比例
      maxScale: 3, // 最大缩放比例
      modifiers: ['ctrl', 'meta'],
    },
    background: {
      color: '#f2f2f2', // 设置背景颜色
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
        radius: 22, // 设置自定义的吸附半径，例如从默认的50px改为24px或其他值
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
              zIndex: 1,
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
        //拉线连接校验，防止非法连接

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

        // 终止循环节点的的下一个节点 只能是为 LoopEnd节点
        const targetNode = targetCell.getData();
        const sourceNode = sourceCell.getData();
        if (
          sourceNode.type === NodeTypeEnum.LoopBreak &&
          targetNode.type !== NodeTypeEnum.LoopEnd
        ) {
          return false;
        }

        // 定义类型断言函数
        const isLoopNode = (cell: Cell) => cell.getData()?.type === 'Loop';

        // 处理非 Loop 节点的连接限制 (逻辑优化)
        if (!isLoopNode(sourceCell) && !isLoopNode(targetCell)) {
          // 允许从 out 到 in 的正常连接
          if (
            (sourcePortGroup === PortGroupEnum.out ||
              sourcePortGroup === PortGroupEnum.special ||
              sourcePortGroup === PortGroupEnum.exception) &&
            targetPortGroup === PortGroupEnum.in
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
    interacting: {
      nodeMovable(view) {
        const node = view.cell;
        const { enableMove } = node.getData();
        return enableMove;
      },
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

  const changeZIndex = (node?: Node) => {
    const nodes = graph.getNodes();
    // 先将其他节点的zindex设置为4
    nodes.forEach((n) => {
      // n.setData({ selected: false });
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
    .use(
      new Snapline({
        sharp: true, // 使用尖角对齐参考线
        clean: 100, // 对齐线延迟 100ms 后自动清除
      }),
    ) // 启用对齐辅助线插件，帮助节点对齐
    .use(new Keyboard()) // 启用键盘插件，支持快捷键操作
    .use(new Clipboard()) // 启用剪贴板插件，支持复制和粘贴
    .use(
      new History({
        enabled: true, // 启用历史记录，但通过 beforeAddCommand 中的 isInitializing 标志控制
        // 过滤不需要记录的操作，避免历史记录过多
        beforeAddCommand: (_event, args: any) => {
          // 初始化阶段忽略所有历史记录
          if (isInitializing) {
            return false;
          }
          // 忽略端口属性变化（hover 效果）
          if (args.key === 'ports' || args.key === 'ports/items') {
            return false;
          }
          // 忽略 zIndex 变化
          if (args.key === 'zIndex') {
            return false;
          }
          // 忽略工具栏变化（Edge hover）
          if (args.key === 'tools') {
            return false;
          }
          // 忽略 Edge 选中样式的颜色变化
          // args.key 可能是 'attrs/line/stroke' 或 'attrs'
          if (
            (args.key as string)?.startsWith('attrs/line') ||
            (args.key as string)?.startsWith('attrs')
          ) {
            return false;
          }
          return true;
        },
      }),
    ) // 启用历史记录插件，支持撤销和重做
    .use(
      new Selection({
        enabled: true,
        multiple: false,
        rubberband: false,
        showNodeSelectionBox: false,
        showEdgeSelectionBox: false,
        pointerEvents: 'none', // 防止选择框干扰鼠标事件
      }),
    ); // 启用选择插件，并配置选择限制

  /**
   * 处理端口配置
   * @param port - 端口配置对象
   * @param portStatus - 端口状态，默认为 'active'
   * @returns 更新后的端口配置
   */
  const handlePortConfig = (
    port: PortConfig,
    portStatus: PortStatus = 'active',
    color?: string,
  ): PortConfig => {
    // 基础配置
    const baseConfig = {
      ...port,
      attrs: {
        ...port.attrs,
        circle: {
          ...(port.attrs?.circle || {}),
          stroke: color || '#5147FF',
          fill: color || '#5147FF',
        },
      },
    };

    // 根据状态返回不同的配置
    const configs = {
      normal: {
        ...baseConfig,
        attrs: {
          ...baseConfig.attrs,
          circle: {
            ...baseConfig.attrs.circle,
            r: 3,
          },
          icon: {
            ...(port.attrs?.icon || {}),
            width: 0,
            height: 0,
            opacity: 0,
          },
          hoverCircle: {
            pointerEvents: 'visiblePainted',
          },
        },
      },
      active: {
        ...baseConfig,
        attrs: {
          ...baseConfig.attrs,
          circle: {
            ...baseConfig.attrs.circle,
            r: 8,
          },
          icon: {
            ...(port.attrs?.icon || {}),
            width: 10,
            height: 10,
            x: -5,
            y: -5,
            opacity: 1,
          },
          hoverCircle: {
            pointerEvents: 'none',
          },
        },
      },
    };

    return configs[portStatus];
  };
  // 监听连接桩鼠标进入事件
  graph.on('node:mouseenter', ({ node }) => {
    const currentPorts = node.getPorts();
    const portStatusList: Record<string, PortStatus> = {
      in: 'active',
      out: 'active',
    };
    // 这里需要根据节点类型来展示
    if (node.getData()?.type === 'LoopStart') {
      portStatusList.in = 'normal';
    }
    if (node.getData()?.type === 'LoopEnd') {
      portStatusList.out = 'normal';
    }
    // 更新当前节点端口
    const updatedPorts = currentPorts.map((port) => {
      const portConfig = handlePortConfig(
        port as PortConfig,
        portStatusList[port.group || 'in'],
        port.attrs?.circle?.fill as string,
      );
      return portConfig;
    });
    node.prop('ports/items', updatedPorts);
  });

  graph.on('node:mouseleave', ({ node }) => {
    const ports = node.getPorts();
    const updatedPorts = ports.map((port) =>
      handlePortConfig(
        port as PortConfig,
        'normal',
        port.attrs?.circle?.fill as string,
      ),
    );
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
    //选中节点
    graph.select(node);
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
            // 清除所有选中 和关闭右侧节点抽屉
            onClickBlank?.();
            graph.cleanSelection();
          },
        },
      },
    ]);
  });

  graph.on('edge:mouseleave', ({ edge }) => {
    edge.removeTools();
  });
  // 监听节点的拖拽移动位置
  graph.on('node:moved', ({ node, e }: { node: Node; e: MouseEvent }) => {
    e.stopPropagation(); // 阻止事件冒泡
    // 获取节点被拖拽到的位置
    const { x, y } = node.getPosition();
    const data = node.getData();

    // 将节点的extension属性设置为拖拽后的位置
    // 使用 updateData 而非直接修改，确保 History 插件能记录变化
    const extension = data.nodeConfig?.extension || {};
    node.updateData({
      nodeConfig: {
        ...data.nodeConfig,
        extension: {
          ...extension,
          x,
          y,
        },
      },
    });
    // 重新获取更新后的 data
    const updatedData = node.getData();
    // 如果是循环内部的节点，要一并修改循环的宽度和位置
    if (data.loopNodeId) {
      const parentNode = graph.getCellById(data.loopNodeId) as Node;
      const _position = parentNode.getPosition();
      const children = parentNode.getChildren();
      if (children && children.length) {
        // // 找到循环节点中当前被移动的节点
        for (let item of children) {
          if (!item.isNode()) continue;
          const childrenData = item.getData();
          if (childrenData.id === data.id) {
            childrenData.nodeConfig.extension.x = x;
            childrenData.nodeConfig.extension.y = y;
            changeCondition({
              nodeData: childrenData,
              update: NodeUpdateEnum.moved,
            });
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
        // 同步更新 innerNodes
        if (children && children.length) {
          parent.innerNodes = children
            .filter((item) => item?.isNode())
            .map((item) => item.getData());
        }
        changeCondition({ nodeData: parent, update: NodeUpdateEnum.moved });
      }
      return;
    }

    if (updatedData.type === NodeTypeEnum.Loop) {
      const children = node.getChildren();
      const innerNodes = updatedData.innerNodes || [];

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

      changeCondition({ nodeData: updatedData, update: NodeUpdateEnum.moved });
      return;
    }

    // node.prop('zIndex', 99);
    changeCondition({ nodeData: updatedData, update: NodeUpdateEnum.moved });
    changeZIndex(node);
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
    const cells = graph.getSelectedCells();
    graph.unselect(cells);
    // 传入对象而不是null，包含isModified状态
    graph.cleanSelection();
    onClickBlank?.();
  });
  // 监听边选中
  graph.on('edge:click', ({ edge }) => {
    edge.attr('line/stroke', '#37D0FF'); // 悬停时改为蓝色
    onClickBlank?.();
  });
  // 监听边取消选中事件
  graph.on('edge:unselected', ({ edge }) => {
    edge.attr('line/stroke', '#5147FF'); // 恢复默认颜色
  });

  // graph.on('node:change:data', (...args) => {
  //   console.log('node:change:data', args);
  // });
  graph.on(
    'node:custom:save',
    ({ data, payload }: { data: ChildNode; payload: Partial<ChildNode> }) => {
      onSaveNode(data, payload);
    },
  );
  graph.on('node:selected', ({ node }) => {
    //现在分为两处场景
    // 1.用户点击节点 这个时间需要打开右侧属性面板
    // 2.通过API选择节点，是通过聚焦的方式选中的，不需要打开右侧属性面板
    // 设置当前节点为选中状态

    changeZIndex(node);
    const data = node.getData();
    if (data.isFocus) {
      // 如果当前节点是聚焦状态，则不打开右侧属性面板
      return;
    }
    // 获取被点击节点的数据
    const newData = {
      ...data,
      id: node.id,
    };
    changeDrawer(newData);
  });
  // graph.on('node:unselected', (...args) => {
  //   console.log('node:unselected', args);
  // });
  // 监听节点点击事件，调用 changeDrawer 函数更新右侧抽屉的内容
  graph.on('node:mousedown', ({ node }) => {
    const data = node.getData();
    //如果之前已经聚焦了，需要重新打开右侧属性面板
    if (data.isFocus) {
      //清除并重置之前 runResult 时的 focus 数据
      node.updateData({
        isFocus: false,
      });
      graph.cleanSelection();
    }
    // 每次 mousedown 都选中节点，解决需要点击两次才能选中的问题
    graph.select(node);
  });

  // 处理异常处理节点连边的逻辑，返回是否是异常处理节点
  const _handleExceptionItemEdgeAdd = (
    edge: Edge,
    doSuccess: (newNodeParams: ChildNode) => void,
  ): boolean => {
    // 获取边的两个连接桩
    const sourcePort = edge.getSourcePortId();
    const sourceNode = edge.getSourceNode()?.getData();
    const targetNode = edge.getTargetNode()?.getData();

    // 处理节点的异常处理 out port 连边的逻辑
    const protGroup = getPortGroup(edge.getSourceNode(), sourcePort);
    if (showExceptionPort(sourceNode, protGroup)) {
      const newNodeParams: ChildNode = cloneDeep(sourceNode);
      const { exceptionHandleNodeIds = [] } =
        newNodeParams.nodeConfig?.exceptionHandleConfig || {};
      if (exceptionHandleNodeIds.includes(targetNode.id)) {
        // 不重复添加异常处理节点
        return true;
      }
      exceptionHandleNodeIds.push(targetNode.id);
      const exceptionHandleConfig = {
        ...(newNodeParams.nodeConfig?.exceptionHandleConfig || {}),
        exceptionHandleNodeIds,
      };
      newNodeParams.nodeConfig.exceptionHandleConfig =
        exceptionHandleConfig as ExceptionHandleConfig;
      doSuccess(newNodeParams);
      return true;
    }
    return false;
  };
  graph.on('edge:mousedown', () => {
    graph.cleanSelection();
    onClickBlank?.();
  });

  // 新增连线
  graph.on('edge:connected', ({ isNew, edge }) => {
    changePortSize();
    // 是否是连接桩到连接桩
    edge.setRouter('manhattan');
    if (!isNew) return;
    // 查看当前的边是否已经有了
    const edges = graph.getEdges();
    const targetNodeId = edge.getTargetCellId();
    // 获取边的两个连接桩
    const sourcePort = edge.getSourcePortId();
    const targetPort = edge.getTargetPortId();
    const sourceNode = edge.getSourceNode()?.getData();
    const targetNode = edge.getTargetNode()?.getData();

    if (!sourceNode || !targetNode || !sourcePort || !targetPort) return;
    // 校验是否可以连接
    const result = validateConnect(edge, edges);
    if (result !== false) {
      edge.remove();
      if (result && typeof result === 'string') {
        message.warning(result);
      }
      return;
    }

    // 处理节点的异常处理 out port 连边的逻辑
    const isException = _handleExceptionItemEdgeAdd(
      edge,
      (newNodeParams: ChildNode) => {
        changeNodeConfigWithRefresh({
          nodeData: newNodeParams,
          targetNodeId: targetNode.id.toString(),
        });
        graph.addEdge(edge);
        setEdgeAttributes(edge);
        edge.toFront();
        updateEdgeArrows(graph);
      },
    );
    if (isException) return;

    // 处理循环节点的逻辑
    if (sourceNode.type === 'Loop' || targetNode.type === 'Loop') {
      console.log(sourcePort);
      // 确保传递正确的参数类型给 handleLoopEdge 函数
      const _params = handleLoopEdge(
        sourceNode as ChildNode,
        targetNode as ChildNode,
      );
      if (_params && typeof _params !== 'string') {
        changeNodeConfigWithRefresh({
          nodeData: _params,
          targetNodeId: targetNode.id.toString(),
        });
        graph.addEdge(edge);
        setEdgeAttributes(edge);
        edge.toFront();
        return;
      }
    }

    // 处理特殊的三个节点
    if (
      sourceNode.type === NodeTypeEnum.Condition ||
      sourceNode.type === NodeTypeEnum.IntentRecognition ||
      (sourceNode.type === NodeTypeEnum.QA &&
        sourceNode.nodeConfig.answerType === AnswerTypeEnum.SELECT)
    ) {
      //
      const _params = handleSpecialNodeTypes(
        sourceNode,
        targetNode,
        sourcePort,
      );
      changeNodeConfigWithRefresh({
        nodeData: _params,
        targetNodeId: targetNode.id.toString(),
      });
      // 通知父组件更新节点信息
    } else {
      // 通知父组件创建边
      changeEdgeConfigWithRefresh({
        type: UpdateEdgeType.created,
        targetId: targetNodeId,
        sourceNode,
        id: edge.id,
      });
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

  // 修复撤销/重做后边变成虚线的问题，以及动态端口未更新的问题
  // 边在创建时使用虚线样式，但 attrs 变化被 History 插件过滤，
  // 所以撤销/重做恢复边时会带着虚线样式，需要在这里修复
  // 同时，动态端口（Condition/IntentRecognition/QA/Exception）也不会被 History 记录，
  // 需要根据节点数据重新生成端口
  const fixAfterHistory = () => {
    // 使用 setTimeout 确保在 undo/redo 操作完成后执行
    setTimeout(() => {
      // 暂时禁用历史记录，避免修复操作被记录到 undo/redo 栈
      graph.disableHistory();

      try {
        // 1. 修复边样式
        graph.getEdges().forEach((edge) => {
          setEdgeAttributes(edge);
        });
        updateEdgeArrows(graph);

        // 2. 修复动态端口：重新生成需要动态端口的节点的端口配置
        graph.getNodes().forEach((node) => {
          const data = node.getData() as ChildNode;
          if (!data) return;

          // 检查是否需要更新端口（Condition/IntentRecognition/QA/Exception 等节点）
          if (needUpdateNodes(data)) {
            const newPorts = generatePorts(data);
            // 使用 setProp 更新端口配置，不使用 silent 以确保 UI 更新
            node.prop('ports', newPorts);
          }
        });
      } finally {
        // 重新启用历史记录
        graph.enableHistory();
      }
    }, 0);
  };

  graph.on('history:undo', fixAfterHistory);
  graph.on('history:redo', fixAfterHistory);

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

  registerNodeClickAndDblclick({ graph, changeZIndex });

  return graph; // 返回初始化好的图形实例
};

export default initGraph;
