// AntV X6 graph with plugins.
import { Cell, Edge, Graph, Node, Shape } from '@antv/x6';

import { Clipboard } from '@antv/x6-plugin-clipboard';
import { History } from '@antv/x6-plugin-history';
import { Keyboard } from '@antv/x6-plugin-keyboard';
import { Selection } from '@antv/x6-plugin-selection';
import { Snapline } from '@antv/x6-plugin-snapline';
// import { Transform } from '@antv/x6-plugin-transform';
import PlusIcon from '@/assets/svg/plus_icon.svg';
import { t } from '@/services/i18nRuntime';
import { AnswerTypeEnum, NodeTypeEnum } from '@/types/enums/common';
import {
  NodeUpdateEnum,
  PortGroupEnum,
  UpdateEdgeType,
} from '@/types/enums/node';
import {
  ChildNode,
  GraphProp,
  StencilChildNode,
} from '@/types/interfaces/graph';
import { ExceptionHandleConfig } from '@/types/interfaces/node';
import { cloneDeep } from '@/utils/common';
import { message, Modal } from 'antd';
import StencilContent from '../components/layout/Sidebar';
import {
  adjustParentSize,
  getPortGroup,
  handleLoopEdge,
  handleSpecialNodeTypes,
  needUpdateNodes,
  registerNodeClickAndDblclick,
  setEdgeAttributes,
  showExceptionPort,
  updateEdgeArrows,
  validateConnect,
} from '../utils/graphV3';
import { generatePorts } from '../utils/workflowV3';
import { createCurvePath } from './registerCustomNodes';

// Initialization flag. Ignore history commands while loading workflow data.
let isInitializing = true;
// Internal flag to avoid recording side effects during undo/redo.
let isHistoryProcessing = false;

export const setGraphInitializing = (value: boolean) => {
  isInitializing = value;
};

export const setHistoryProcessing = (value: boolean) => {
  isHistoryProcessing = value;
};
/**
 *
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
 *
 */
type PortStatus = 'normal' | 'active';

/**
 * ， ID
 * @param param0 -  ID
 * @returns
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
  if (!graphContainer) throw new Error('Container not found');

  Graph.registerConnector('curveConnector', createCurvePath, true);

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
    connector: { name: 'curveConnector' }, // connector
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
  // Graph.registerEdge('data-processing-curve', Edge, true);

  const createNodeAndEdge = (
    graph: Graph,
    event: any,
    sourceNode: ChildNode,
    // id
    portId: string,
    targetNode?: ChildNode,
    edgeId?: string,
  ) => {
    // const eventTarget =
    //   event.originalEvent.originalEvent || event.originalEvent;
    const targetRect = event.target.getBoundingClientRect();
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

  const graph = new Graph({
    container: graphContainer, //  DOM
    grid: {
      visible: true,
      type: 'dot',
      size: 22,
      args: {
        color: '#606060',
        thickness: 1,
      },
    }, //
    autoResize: true, //
    panning: true, //
    mousewheel: {
      enabled: true, //
      zoomAtMousePosition: true, //
      minScale: 0.2, //
      maxScale: 3, //
      modifiers: ['ctrl', 'meta'],
    },
    background: {
      color: '#f2f2f2', //
    },

    connecting: {
      router: 'manhattan', // ，
      connector: 'curveConnector',
      // anchor: 'center', //
      connectionPoint: 'anchor', //
      allowBlank: false, //
      allowMulti: true, //
      allowNode: false,
      allowLoop: false, //
      allowEdge: false,
      highlight: true, //，
      snap: {
        radius: 22, // ，50px24px
        anchor: 'bbox', //  'center'，
      },
      createEdge() {
        return new Shape.Edge({
          // shape: 'data-processing-curve', //
          attrs: {
            line: {
              strokeDasharray: '5 5', // ：
              strokeWidth: 1,
              targetMarker: null, //
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
        // ， null/undefined
        if (!sourceMagnet || !targetMagnet || !sourceCell || !targetCell) {
          return false;
        }
        if (sourceCell === targetCell) {
          return false;
        }
        const targetMagnetElement = targetMagnet.closest(
          '.x6-port-body',
        ) as HTMLElement;
        const sourcePortGroup = sourceMagnet.getAttribute('port-group') || '';
        const targetPortGroup =
          targetMagnetElement.getAttribute('port-group') || '';

        const sourcePortId = sourceMagnet.getAttribute('port');
        const targetPortId = targetMagnetElement.getAttribute('port');
        // ID，
        if (!sourcePortId || !targetPortId) {
          return false;
        }

        //  sourcePort  targetPort
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
              edgeSource.cell === sourceCell.id && //
              edgeSource.port === sourcePortId && //
              edgeTarget.cell === targetCell.id && //
              edgeTarget.port === targetPortId //
            );
          }

          return false; //  edgeSource  edgeTarget ，
        });

        if (isDuplicateEdge) {
          // ， false
          return false;
        }

        //   LoopEnd
        const targetNode = targetCell.getData();
        const sourceNode = sourceCell.getData();
        if (
          sourceNode.type === NodeTypeEnum.LoopBreak &&
          targetNode.type !== NodeTypeEnum.LoopEnd
        ) {
          return false;
        }

        const isLoopNode = (cell: Cell) => cell.getData()?.type === 'Loop';

        //  Loop  ()
        if (!isLoopNode(sourceCell) && !isLoopNode(targetCell)) {
          //  out  in
          if (
            (sourcePortGroup === PortGroupEnum.out ||
              sourcePortGroup === PortGroupEnum.special ||
              sourcePortGroup === PortGroupEnum.exception) &&
            targetPortGroup === PortGroupEnum.in
          ) {
            return true;
            // return validatePortConnection(sourcePortGroup, targetPortGroup);
          }
          return false; //
        }

        // Loop  in  out  source  target
        if (isLoopNode(sourceCell) || isLoopNode(targetCell)) {
          return true;
        }

        return true;
      },
    },
    highlighting: {
      magnetAdsorbed: {
        name: 'stroke', //
        args: {
          attrs: {
            fill: '#5147FF', //
            stroke: '#5147FF', //
          },
        },
      },
    },
    embedding: {
      // false，true
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
          // hotArea: { r: 15 }, //
          circle: { r: 3 }, //
          pointerEvents: 'all', //
          event: 'mouseenter',
        },
      }));
      node.prop('ports/items', updatedPorts);
    });
  };

  const changeZIndex = (node?: Node) => {
    const nodes = graph.getNodes();
    // zindex4
    nodes.forEach((n) => {
      // n.setData({ selected: false });
      n.prop('zIndex', 4); //
    });
    // loop5
    const loopData = nodes.filter((item) => {
      const data = item.getData();
      return data.type === 'Loop';
    });
    // loop8
    loopData.forEach((child) => {
      child.prop('zIndex', 5); //
      const sun = child.getChildren();
      sun?.forEach((sun) => {
        sun.prop('zIndex', 8); //
      });
    });
    if (node) {
      const data = node.getData();
      if (data.type === 'Loop') {
        const children = node.getChildren();
        children?.forEach((child) => {
          //  X6
          if (child.isEdge()) {
            child.prop('zIndex', 15);
          } else {
            child.prop('zIndex', 20);
          }
        });
        node.prop('zIndex', 10);
      } else {
        node.prop('zIndex', 99);
      }
    }
  };

  graph
    // .use(new Transform({ resizing: true, rotating: true })) // ，
    .use(
      new Snapline({
        sharp: true, //
        clean: 100, //  100ms
      }),
    ) // ，
    .use(new Keyboard()) // ，
    .use(new Clipboard()) // ，
    .use(
      new History({
        enabled: true, // ， beforeAddCommand  isInitializing
        beforeAddCommand: (_event, args: any) => {
          //  Undo/Redo
          if (isInitializing || isHistoryProcessing) {
            return false;
          }
          // （hover ）
          if (args.key === 'ports' || args.key === 'ports/items') {
            return false;
          }
          //  zIndex
          if (args.key === 'zIndex') {
            return false;
          }
          // （Edge hover）
          if (args.key === 'tools') {
            return false;
          }
          //  Edge
          // args.key  'attrs/line/stroke'  'attrs'
          if (
            (args.key as string)?.startsWith('attrs/line') ||
            (args.key as string)?.startsWith('attrs')
          ) {
            return false;
          }
          return true;
        },
      }),
    ) // ，
    .use(
      new Selection({
        enabled: true,
        multiple: false,
        rubberband: false,
        showNodeSelectionBox: false,
        showEdgeSelectionBox: false,
        pointerEvents: 'none', //
      }),
    ); // ，

  /**
   *
   * @param port -
   * @param portStatus - ， 'active'
   * @returns
   */
  const handlePortConfig = (
    port: PortConfig,
    portStatus: PortStatus = 'active',
    color?: string,
  ): PortConfig => {
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
  graph.on('node:mouseenter', ({ node }) => {
    const currentPorts = node.getPorts();
    const portStatusList: Record<string, PortStatus> = {
      in: 'active',
      out: 'active',
    };
    if (node.getData()?.type === 'LoopStart') {
      portStatusList.in = 'normal';
    }
    if (node.getData()?.type === 'LoopEnd') {
      portStatusList.out = 'normal';
    }
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
    const isLoopNode = node.getData()?.loopNodeId;
    if (isLoopNode) {
      const isIn = port?.includes('in');
      const parentNode = node.getParent()?.getData();
      const isStartNode = node.getData()?.id === parentNode.innerStartNodeId;
      const isEndNode = node.getData()?.id === parentNode.innerEndNodeId;

      if ((isStartNode && isIn) || (isEndNode && !isIn)) {
        message.warning(
          t('PC.Pages.AntvX6Graph.cannotQuickAddNodeForLoopBoundary'),
        );
        return;
      }
    }
    createNodeAndEdge(graph, e, node.getData(), port as string);
    graph.select(node);
  });

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
  graph.on('node:moved', ({ node, e }: { node: Node; e: MouseEvent }) => {
    e.stopPropagation(); //
    const { x, y } = node.getPosition();
    const data = node.getData();

    // extension
    //  updateData ， History
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
    //  data
    const updatedData = node.getData();
    if (data.loopNodeId) {
      const parentNode = graph.getCellById(data.loopNodeId) as Node;
      const _position = parentNode.getPosition();
      const children = parentNode.getChildren();
      if (children && children.length) {
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

      const parent = parentNode.getData();
      if (parent) {
        parent.nodeConfig.extension.width = _size.width;
        parent.nodeConfig.extension.height = _size.height;
        parent.nodeConfig.extension.x = _position.x;
        parent.nodeConfig.extension.y = _position.y;
        //  innerNodes
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
        for (let item of children) {
          // console.log(item.isNode())
          if (item.isNode()) {
            const position = item.getPosition();
            const childrenData = item.getData();

            childrenData.nodeConfig.extension.x = position.x;
            childrenData.nodeConfig.extension.y = position.y;
            //  innerNodes，
            if (
              !innerNodes.find((node: ChildNode) => node.id === childrenData.id)
            ) {
              innerNodes.push(childrenData);
            } else {
              // innerNodes，
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

  graph.on('node:mouseleave', () => {
    changePortSize();
  });
  graph.on('edge:removed', () => {
    changePortSize();
    updateEdgeArrows(graph);
  });
  graph.on('blank:click', () => {
    const cells = graph.getSelectedCells();
    graph.unselect(cells);
    // null，isModified
    graph.cleanSelection();
    onClickBlank?.();
  });
  graph.on('edge:click', ({ edge }) => {
    edge.attr('line/stroke', '#37D0FF'); //
    onClickBlank?.();
  });
  graph.on('edge:unselected', ({ edge }) => {
    edge.attr('line/stroke', '#5147FF'); //
  });

  // graph.on('node:change:data', (...args) => {
  //   console.log('node:change:data', args);
  graph.on(
    'node:custom:save',
    ({ data, payload }: { data: ChildNode; payload: Partial<ChildNode> }) => {
      onSaveNode(data, payload);
    },
  );
  graph.on('node:selected', ({ node }) => {
    // 1.
    // 2.API，，

    changeZIndex(node);
    const data = node.getData();
    if (data.isFocus) {
      return;
    }
    const newData = {
      ...data,
      id: node.id,
    };
    changeDrawer(newData);
  });
  // graph.on('node:unselected', (...args) => {
  //   console.log('node:unselected', args);
  // ， changeDrawer
  graph.on('node:mousedown', ({ node }) => {
    const data = node.getData();
    if (data.isFocus) {
      // runResult  focus
      node.updateData({
        isFocus: false,
      });
      graph.cleanSelection();
    }

    // ： focus  blur
    //  TreeNodeTitle  onBlur
    //  blur，
    const activeElement = document.activeElement as HTMLElement;
    if (
      activeElement &&
      activeElement.tagName === 'INPUT' &&
      typeof activeElement.blur === 'function'
    ) {
      activeElement.blur();
    }

    //  mousedown ，
    graph.select(node);
  });

  const _handleExceptionItemEdgeAdd = (
    edge: Edge,
    doSuccess: (newNodeParams: ChildNode) => void,
  ): boolean => {
    const sourcePort = edge.getSourcePortId();
    const sourceNode = edge.getSourceNode()?.getData();
    const targetNode = edge.getTargetNode()?.getData();

    //  out port
    const protGroup = getPortGroup(edge.getSourceNode(), sourcePort);
    if (showExceptionPort(sourceNode, protGroup)) {
      const newNodeParams: ChildNode = cloneDeep(sourceNode);
      const { exceptionHandleNodeIds = [] } =
        newNodeParams.nodeConfig?.exceptionHandleConfig || {};
      if (exceptionHandleNodeIds.includes(targetNode.id)) {
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

  graph.on('edge:connected', ({ isNew, edge }) => {
    changePortSize();
    edge.setRouter('manhattan');
    if (!isNew) return;
    const edges = graph.getEdges();
    const targetNodeId = edge.getTargetCellId();
    const sourcePort = edge.getSourcePortId();
    const targetPort = edge.getTargetPortId();
    const sourceNode = edge.getSourceNode()?.getData();
    const targetNode = edge.getTargetNode()?.getData();

    if (!sourceNode || !targetNode || !sourcePort || !targetPort) return;
    const result = validateConnect(edge, edges);
    if (result !== false) {
      edge.remove();
      if (result && typeof result === 'string') {
        message.warning(result);
      }
      return;
    }

    //  out port
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

    if (sourceNode.type === 'Loop' || targetNode.type === 'Loop') {
      console.log(sourcePort);
      //  handleLoopEdge
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

    if (
      sourceNode.type === NodeTypeEnum.Condition ||
      sourceNode.type === NodeTypeEnum.IntentRecognition ||
      (sourceNode.type === NodeTypeEnum.QA &&
        sourceNode.nodeConfig.answerType === AnswerTypeEnum.SELECT)
    ) {
      const _params = handleSpecialNodeTypes(
        sourceNode,
        targetNode,
        sourcePort,
      );
      changeNodeConfigWithRefresh({
        nodeData: _params,
        targetNodeId: targetNode.id.toString(),
      });
    } else {
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
  });

  graph.on('scale', ({ sx }) => {
    changeZoom(sx);
  });

  // ， attrs  History ，
  // ，（Condition/IntentRecognition/QA/Exception） History ，
  const fixAfterHistory = () => {
    //  setTimeout  undo/redo
    setTimeout(() => {
      // ， undo/redo
      graph.disableHistory();

      try {
        // 1.
        graph.getEdges().forEach((edge) => {
          setEdgeAttributes(edge);
        });
        updateEdgeArrows(graph);

        // 2. ：
        graph.getNodes().forEach((node) => {
          const data = node.getData() as ChildNode;
          if (!data) return;

          // （Condition/IntentRecognition/QA/Exception ）
          if (needUpdateNodes(data)) {
            const newPorts = generatePorts(data);
            //  setProp ， silent  UI
            node.prop('ports', newPorts);
          }
        });
      } finally {
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
    // 1：API
    let parentNode = node.getParent();
    const data = node.getData();
    if (!parentNode && data.loopNodeId) {
      const cell = graph.getCellById(data.loopNodeId);
      if (cell && cell.isNode()) {
        parentNode = cell as Node;
        //  Node
        if (parentNode instanceof Node) {
          adjustParentSize(parentNode);
        }
      }
      // return
    }
    // 2：Loop
    if (
      parentNode &&
      parentNode.isNode() &&
      parentNode.getData()?.type === 'Loop'
    ) {
      adjustParentSize(parentNode);
    }
  });

  registerNodeClickAndDblclick({ graph, changeZIndex });

  return graph; //
};

export default initGraph;
