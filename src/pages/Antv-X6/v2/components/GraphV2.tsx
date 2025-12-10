/**
 * V2 图形初始化
 *
 * 初始化 AntV X6 图形编辑器
 * 包含 History 插件配置，支持撤销/重做
 *
 * 完全独立，不依赖 v1 任何代码
 */

import { Edge, Graph, Shape } from '@antv/x6';
import { Clipboard } from '@antv/x6-plugin-clipboard';
import { History } from '@antv/x6-plugin-history';
import { Keyboard } from '@antv/x6-plugin-keyboard';
import { Selection } from '@antv/x6-plugin-selection';
import { Snapline } from '@antv/x6-plugin-snapline';

import { GRAPH_CONFIG_V2, HISTORY_CONFIG_V2 } from '../constants';
import type { ChildNodeV2, EdgeV2, GraphPropV2 } from '../types';
import { NodeTypeEnumV2, PortGroupEnumV2 } from '../types';
import {
  registerCustomConnectorV2,
  registerCustomNodesV2,
} from './registerCustomNodesV2';

// ==================== 图形初始化 ====================

export interface InitGraphV2Options extends GraphPropV2 {
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
  onPortClick?: (
    sourceNode: ChildNodeV2,
    portId: string,
    position: { x: number; y: number },
    isInLoop: boolean,
  ) => void;
  onEdgeButtonClick?: (
    sourceNode: ChildNodeV2,
    targetNode: ChildNodeV2,
    portId: string,
    edgeId: string,
    position: { x: number; y: number },
    isInLoop: boolean,
  ) => void;
}

/**
 * 初始化图形编辑器
 */
export function initGraphV2(options: InitGraphV2Options): Graph {
  const {
    containerId,
    onNodeSelect,
    onNodeChange,
    onEdgeAdd,
    onEdgeDelete,
    onZoomChange,
    createNodeByPortOrEdge: _createNodeByPortOrEdge,
    onClickBlank,
    onHistoryChange,
    onPortClick,
    onEdgeButtonClick,
  } = options;

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container with id "${containerId}" not found`);
  }

  // 注册自定义节点和连接器
  registerCustomNodesV2();
  registerCustomConnectorV2();

  // 配置并注册边类型
  Edge.config({
    markup: [
      { tagName: 'path', selector: 'wrap' },
      { tagName: 'path', selector: 'line' },
    ],
    connector: { name: 'curveConnectorV2' },
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

  // 创建图形实例
  const graph = new Graph({
    container,
    ...GRAPH_CONFIG_V2,
    autoResize: true,
    panning: true,
    connecting: {
      ...GRAPH_CONFIG_V2.connecting,
      router: 'manhattan',
      connector: 'curveConnectorV2',
      connectionPoint: 'anchor',
      createEdge() {
        return new Shape.Edge({
          attrs: {
            line: {
              strokeDasharray: '5 5',
              strokeWidth: 1,
              targetMarker: null,
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
        // 基础验证
        if (!sourceMagnet || !targetMagnet || !sourceCell || !targetCell) {
          return false;
        }

        // 不能自己连自己
        if (sourceCell === targetCell) {
          return false;
        }

        // 获取端口组信息
        const sourcePortGroup = sourceMagnet.getAttribute('port-group') || '';
        const targetPortGroup =
          (targetMagnet.closest('.x6-port-body') as HTMLElement)?.getAttribute(
            'port-group',
          ) || '';

        // 验证端口连接规则
        const sourceData = sourceCell.getData() as ChildNodeV2;
        const targetData = targetCell.getData() as ChildNodeV2;

        // 循环节点特殊处理
        const isSourceLoop = sourceData?.type === NodeTypeEnumV2.Loop;
        const isTargetLoop = targetData?.type === NodeTypeEnumV2.Loop;

        if (isSourceLoop || isTargetLoop) {
          return true; // 循环节点有特殊规则，允许连接
        }

        // 普通节点：out -> in
        if (
          (sourcePortGroup === PortGroupEnumV2.out ||
            sourcePortGroup === PortGroupEnumV2.special ||
            sourcePortGroup === PortGroupEnumV2.exception) &&
          targetPortGroup === PortGroupEnumV2.in
        ) {
          return true;
        }

        return false;
      },
    },
    highlighting: {
      magnetAdsorbed: {
        name: 'stroke',
        args: {
          attrs: {
            fill: '#5147FF',
            stroke: '#5147FF',
          },
        },
      },
    },
    embedding: {
      enabled: false,
    },
    interacting: {
      nodeMovable(view) {
        const node = view.cell;
        const data = node.getData();
        return data?.enableMove !== false;
      },
    },
  });

  // 使用插件
  graph
    .use(new Snapline())
    .use(new Keyboard())
    .use(new Clipboard())
    .use(
      new History({
        enabled: HISTORY_CONFIG_V2.enabled,
        stackSize: HISTORY_CONFIG_V2.stackSize,
        ignoreChange: HISTORY_CONFIG_V2.ignoreChange,
        ignoreAdd: HISTORY_CONFIG_V2.ignoreAdd,
        ignoreRemove: HISTORY_CONFIG_V2.ignoreRemove,
      }),
    )
    .use(new Selection());

  // ==================== 事件监听 ====================

  // 历史记录变化
  graph.on('history:change', () => {
    onHistoryChange?.(graph.canUndo(), graph.canRedo());
  });

  // 节点点击 - 选中节点并打开配置面板
  graph.on('node:click', ({ node }) => {
    const data = node.getData() as ChildNodeV2;

    // 如果之前已经聚焦了，需要重新打开右侧属性面板
    if (data?.isFocus) {
      // 清除并重置之前 runResult 时的 focus 数据
      node.updateData({ isFocus: false });
      graph.cleanSelection();
    }

    // 选中节点
    graph.select(node);
  });

  // 节点选中事件 - 触发配置面板打开
  graph.on('node:selected', ({ node }) => {
    const data = node.getData() as ChildNodeV2;
    if (data && !data.isFocus) {
      onNodeSelect(data);
    }
  });

  // 空白区域点击
  graph.on('blank:click', () => {
    const cells = graph.getSelectedCells();
    graph.unselect(cells);
    graph.cleanSelection();
    onClickBlank();
  });

  // 节点移动完成
  graph.on('node:moved', ({ node }) => {
    const { x, y } = node.getPosition();
    const data = node.getData() as ChildNodeV2;

    if (data) {
      const updatedData = {
        ...data,
        nodeConfig: {
          ...data.nodeConfig,
          extension: {
            ...data.nodeConfig?.extension,
            x,
            y,
          },
        },
      };
      onNodeChange(updatedData);
    }
  });

  // 边连接完成
  graph.on('edge:connected', ({ isNew, edge }) => {
    if (!isNew) return;

    const sourceCell = edge.getSourceCell();
    const targetCell = edge.getTargetCell();

    if (sourceCell && targetCell) {
      const newEdge: EdgeV2 = {
        source: sourceCell.id,
        target: targetCell.id,
        sourcePort: edge.getSourcePortId() || undefined,
        targetPort: edge.getTargetPortId() || undefined,
        zIndex: 1,
      };
      onEdgeAdd(newEdge);
    }
  });

  // 边删除
  graph.on('edge:removed', ({ edge }) => {
    onEdgeDelete({
      source: edge.getSourceCellId(),
      target: edge.getTargetCellId(),
      sourcePort: edge.getSourcePortId() || undefined,
      targetPort: edge.getTargetPortId() || undefined,
      zIndex: edge.getZIndex?.(),
    });
  });

  // 画布缩放
  graph.on('scale', ({ sx }) => {
    onZoomChange(sx);
  });

  const handlePortConfig = (
    port: any,
    portStatus: 'normal' | 'active' = 'active',
    color?: string,
  ) => {
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

    const configs = {
      normal: {
        ...baseConfig,
        attrs: {
          ...baseConfig.attrs,
          circle: { ...baseConfig.attrs.circle, r: 3 },
          icon: {
            ...(port.attrs?.icon || {}),
            width: 0,
            height: 0,
            opacity: 0,
          },
          hoverCircle: { pointerEvents: 'visiblePainted' },
        },
      },
      active: {
        ...baseConfig,
        attrs: {
          ...baseConfig.attrs,
          circle: { ...baseConfig.attrs.circle, r: 8 },
          icon: {
            ...(port.attrs?.icon || {}),
            width: 10,
            height: 10,
            x: -5,
            y: -5,
            opacity: 1,
          },
          hoverCircle: { pointerEvents: 'none' },
        },
      },
    };

    return configs[portStatus];
  };

  // 节点鼠标进入 - 显示端口
  graph.on('node:mouseenter', ({ node }) => {
    const data = node.getData() as ChildNodeV2;
    const ports = node.getPorts();
    const portStatusList: Record<string, 'normal' | 'active'> = {
      in: 'active',
      out: 'active',
    };

    if (data?.type === NodeTypeEnumV2.LoopStart) {
      portStatusList.in = 'normal';
    }
    if (data?.type === NodeTypeEnumV2.LoopEnd) {
      portStatusList.out = 'normal';
    }

    const updatedPorts = ports.map((port) =>
      handlePortConfig(
        port,
        portStatusList[port.group || PortGroupEnumV2.in] || 'active',
        port.attrs?.circle?.fill as string,
      ),
    );
    node.prop('ports/items', updatedPorts);
  });

  // 节点鼠标离开 - 隐藏端口
  graph.on('node:mouseleave', ({ node }) => {
    const ports = node.getPorts();
    const updatedPorts = ports.map((port) =>
      handlePortConfig(port, 'normal', port.attrs?.circle?.fill as string),
    );
    node.prop('ports/items', updatedPorts);
  });

  // 端口点击 - 快捷添加节点
  graph.on('node:port:click', ({ node, port, e }) => {
    const data = node.getData() as ChildNodeV2;
    if (!data || !port) return;

    // 检查是否在循环节点内
    const isInLoop = !!data.loopNodeId;

    // 如果是循环内的节点，检查是否可以添加
    if (isInLoop) {
      const isInputPort = port.includes('in');
      const parentNode = node.getParent()?.getData() as ChildNodeV2;

      if (parentNode) {
        const isStartNode = data.id === parentNode.innerStartNodeId;
        const isEndNode = data.id === parentNode.innerEndNodeId;

        // 循环开始节点的输入端口和结束节点的输出端口不能添加节点
        if ((isStartNode && isInputPort) || (isEndNode && !isInputPort)) {
          return;
        }
      }
    }

    // 计算点击位置
    const targetRect = (e.target as HTMLElement).getBoundingClientRect();
    const centerX = targetRect.left + targetRect.width / 2;
    const centerY = targetRect.top + targetRect.height / 2;

    const position = graph.clientToLocal({
      x: centerX,
      y: centerY,
    });

    // 触发端口点击回调
    onPortClick?.(data, port, position, isInLoop);

    // 选中节点
    graph.select(node);
  });

  // 边鼠标进入 - 显示添加按钮
  graph.on('edge:mouseenter', ({ edge }) => {
    const sourceNode = edge.getSourceCell()?.getData() as ChildNodeV2;
    const targetNode = edge.getTargetCell()?.getData() as ChildNodeV2;

    // 循环节点与其内部节点之间的边不显示添加按钮
    if (
      (sourceNode?.type === NodeTypeEnumV2.Loop && targetNode?.loopNodeId) ||
      (sourceNode?.loopNodeId && targetNode?.type === NodeTypeEnumV2.Loop)
    ) {
      return;
    }

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
              tagName: 'text',
              selector: 'icon',
              attrs: {
                fill: '#fff',
                fontSize: 16,
                textAnchor: 'middle',
                dominantBaseline: 'central',
                pointerEvents: 'none',
                text: '+',
              },
            },
          ],
          distance: '50%',
          onClick({ e }: { e: MouseEvent }) {
            const source = edge.getSourceCell()?.getData() as ChildNodeV2;
            const target = edge.getTargetCell()?.getData() as ChildNodeV2;
            const sourcePort = edge.getSourcePortId();

            if (source && target) {
              const position = graph.clientToLocal({
                x: e.clientX,
                y: e.clientY,
              });

              // 检查是否在循环内
              const isInLoop = !!(source.loopNodeId || false);

              // 触发边上按钮点击回调
              onEdgeButtonClick?.(
                source,
                target,
                sourcePort || `${source.id}-out`,
                edge.id,
                position,
                isInLoop,
              );

              // 清除选中状态
              onClickBlank();
              graph.cleanSelection();
            }
          },
        },
      },
    ]);
  });

  // 边鼠标离开 - 移除工具
  graph.on('edge:mouseleave', ({ edge }) => {
    edge.removeTools();
  });

  // 边选中
  graph.on('edge:click', ({ edge }) => {
    edge.attr('line/stroke', '#37D0FF');
    onClickBlank();
  });

  // 边取消选中
  graph.on('edge:unselected', ({ edge }) => {
    edge.attr('line/stroke', '#5147FF');
  });

  return graph;
}

// ==================== 图形操作 ====================

/**
 * 绘制图形
 */
export function drawGraphV2(
  graph: Graph,
  _nodes: ChildNodeV2[],
  _edges: EdgeV2[],
): void {
  // 清除现有元素
  graph.clearCells();

  // 导入节点和边
  // 这里需要根据实际的节点数据结构来创建 X6 节点
  // 简化实现，实际需要根据 graphV2.ts 中的函数来创建

  // 自适应视图
  setTimeout(() => {
    graph.zoomToFit({
      padding: { top: 128, left: 18, right: 18, bottom: 18 },
      maxScale: 1,
      minScale: 0.2,
    });
  }, 100);
}

/**
 * 缩放到适合
 */
export function zoomToFitV2(graph: Graph): void {
  graph.zoomToFit({
    padding: { top: 128, left: 18, right: 18, bottom: 18 },
    maxScale: 1,
    minScale: 0.2,
    preserveAspectRatio: true,
  });
}

/**
 * 设置缩放
 */
export function setZoomV2(graph: Graph, zoom: number): void {
  graph.zoomTo(zoom);
}

/**
 * 选中节点
 */
export function selectNodeV2(graph: Graph, nodeId: string): void {
  const node = graph.getCellById(nodeId);
  if (node) {
    graph.cleanSelection();
    graph.select(node);
  }
}

/**
 * 居中节点
 */
export function centerNodeV2(graph: Graph, nodeId: string): void {
  const cell = graph.getCellById(nodeId);
  if (cell) {
    graph.centerCell(cell);
  }
}

export default {
  initGraphV2,
  drawGraphV2,
  zoomToFitV2,
  setZoomV2,
  selectNodeV2,
  centerNodeV2,
};
