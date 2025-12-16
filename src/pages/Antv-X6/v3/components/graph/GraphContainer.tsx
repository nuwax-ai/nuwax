import { NodeTypeEnum, RunResultStatusEnum } from '@/types/enums/common';
import { NodeSizeGetTypeEnum } from '@/types/enums/node';
import type {
  ChildNode,
  Edge,
  GraphContainerProps,
  GraphContainerRef,
  GraphRect,
  RunResultItem,
} from '@/types/interfaces/graph';
import { ChangeEdgeProps, ChangeNodeProps } from '@/types/interfaces/graph';
import { NodeConfig } from '@/types/interfaces/node';
import { cloneDeep, mergeObject } from '@/utils/common';
import {
  adjustParentSize,
  needUpdateNodes,
  updateEdgeArrows,
} from '@/utils/graph';
import { getWidthAndHeight } from '@/utils/updateNode';
import {
  createBaseNode,
  createChildNode,
  createEdge,
  generatePorts,
  getEdges,
  getNodeSize,
} from '@/utils/workflow';
import { Graph, Node } from '@antv/x6';
import { App } from 'antd';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import EventHandlers from '../../component/eventHandlers';
import InitGraph from '../../component/graph';
import { registerCustomNodes } from '../../component/registerCustomNodes';
const GRAPH_CONTAINER_ID = 'graph-container';
const GraphContainer = forwardRef<GraphContainerRef, GraphContainerProps>(
  (
    {
      graphParams,
      changeDrawer,
      changeEdge,
      changeCondition,
      copyNode,
      removeNode,
      changeZoom,
      createNodeByPortOrEdge,
      onSaveNode,
      onClickBlank,
      onInit,
      onRefresh,
    },
    ref,
  ) => {
    const { modal, message } = App.useApp();
    registerCustomNodes();
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<any>(null);

    // 新增一个ref标记是否已初始化
    const hasInitialized = useRef(false);

    function preWork() {
      const container = containerRef.current;
      if (!container) return;
      const graphContainer = document.createElement('div');
      graphContainer.id = GRAPH_CONTAINER_ID;
      container?.appendChild(graphContainer);
    }
    // 绘制画布
    const addLoopChildNode = (callback: (data: any) => boolean): Node[] => {
      const loopNodeList = graphRef.current.getNodes().filter((item: Node) => {
        const data = item.getData();
        return callback(data);
      });
      // 创建循环的子节点
      if (loopNodeList.length) {
        loopNodeList.forEach((element: Node) => {
          element.prop('zIndex', 4);
          const data = element.getData();
          if (!data.innerNodes?.length) return;
          data.innerNodes.forEach((childDef: ChildNode) => {
            const child = createChildNode(data.id, childDef); // 创建子节点配置
            const childNode = graphRef.current.addNode(child); // 添加子节点到图中
            // childNode.setZIndex(6);  // 新增显式层级设置方法
            // 更新父节点的子节点列表（如果必要）
            element.addChild(childNode);
          });
        });
      }
      return loopNodeList;
    };

    const batchAddEdges = (edgeList: Edge[]) => {
      // 4. 创建边（需要验证节点存在性）
      const edges = edgeList
        .map((edge: Edge) => {
          return createEdge(edge);
        })
        .filter(Boolean);

      // 5. 批量添加边
      graphRef.current.addEdges(edges);

      updateEdgeArrows(graphRef.current);
    };

    const _doAddNode = (e: GraphRect, child: ChildNode) => {
      const point = graphRef.current.clientToGraph(e.x, e.y);

      const { width, height } = getWidthAndHeight(child);

      // 根据情况，动态给予右侧的out连接桩
      const newNode = graphRef.current.addNode({
        shape: child.shape,
        id: child.id,
        x: point.x,
        y: point.y,
        width: width,
        height: height,
        data: {
          ...child,
        },
        resizable: true,
        zIndex: 99,
        ports: generatePorts(child),
      });
      // 添加节点
      graphRef.current.addNode(newNode);
      if (child.loopNodeId) {
        // 获取刚刚添加的子节点的实例，并设置父子关系
        const childNodeInstance = graphRef.current.getCellById(newNode.id);
        // 直接在graph实例中添加子节点并设置父子关系
        const parentNode = graphRef.current.getCellById(child.loopNodeId);
        parentNode.addChild(childNodeInstance);
        // 更改循环节点的大小
        adjustParentSize(parentNode);
        const size = parentNode.getSize();
        const position = parentNode.getPosition();
        const _params = parentNode.getData() as ChildNode;
        _params.nodeConfig.extension = {
          ..._params.nodeConfig.extension,
          width: size.width,
          height: size.height,
          x: position.x,
          y: position.y,
        };
        changeCondition({ nodeData: _params });
      }
    };

    // 新增节点
    const graphAddNode: GraphContainerRef['graphAddNode'] = (
      e: GraphRect,
      child: ChildNode,
    ) => {
      if (!graphRef.current) return;
      _doAddNode(e, child);
      // 找出循环节点 子节点如果有就添加
      const LoopNodeList = addLoopChildNode((data) => {
        return data.id === child.id && data.type === 'Loop';
      });
      if (LoopNodeList.length) {
        let edgeList: Edge[] = [];
        LoopNodeList.forEach((element: Node) => {
          const data = element.getData();
          edgeList = edgeList.concat(getEdges([data], false));
          if (data.innerNodes && data.innerNodes.length > 0) {
            edgeList = edgeList.concat(getEdges(data.innerNodes, false));
          }
        });
        // 5. 批量添加边
        batchAddEdges(edgeList);
      }
    };

    // 修改节点信息
    const graphUpdateNode = (nodeId: string, newData: ChildNode | null) => {
      if (!graphRef.current || !newData) return;
      const node = graphRef.current.getCellById(nodeId);
      if (node && node.isNode()) {
        const position = node.getPosition();
        if (position) {
          // 确保 newData.nodeConfig 存在
          if (!newData.nodeConfig) {
            newData.nodeConfig = {
              extension: {},
            };
          }

          newData.nodeConfig.extension = {
            ...newData.nodeConfig.extension,
            x: position.x,
            y: position.y,
          };
        }
        if (needUpdateNodes(newData)) {
          // 需要更新端口配置的节点
          const newPorts = generatePorts(newData);
          if (
            newData.type === NodeTypeEnum.QA ||
            newData.type === NodeTypeEnum.Condition
          ) {
            // 问答节点
            const { width, height } = getNodeSize({
              data: newData,
              ports: newPorts.items,
              type: NodeSizeGetTypeEnum.update,
            });
            node.setSize(width, height);
          }
          node.prop('ports', newPorts);
        }

        node.updateData(newData);
      }
    };
    // 修改节点通过表单数据
    const graphUpdateByFormData = (
      changedValues: any,
      fullFormValues: any,
      nodeId: string,
    ) => {
      if (!graphRef.current) return;
      const cell = graphRef.current.getCellById(nodeId);
      if (!cell || !cell.isNode()) return;
      const oldNodeData = cell.getData() as ChildNode;
      if (!oldNodeData) {
        return;
      }

      const { nodeConfig, ...rest } = oldNodeData;
      const fullChangedValues = Object.keys(changedValues).reduce(
        (acc: Record<string, any>, key) => {
          if (typeof key === 'string' && key) {
            acc[key] = fullFormValues[key];
          }
          return acc;
        },
        {} as Record<string, any>,
      );

      graphUpdateNode(nodeId, {
        ...rest,
        nodeConfig: mergeObject(
          cloneDeep(nodeConfig),
          fullChangedValues,
        ) as NodeConfig,
      });

      //如果节点是循环节点，则需要调整父节点大小
      const loopNodeId = rest.loopNodeId;
      if (loopNodeId) {
        const parentNode = graphRef.current.getCellById(loopNodeId.toString());
        if (parentNode) {
          adjustParentSize(parentNode); // 初始调整父节点大小
        }
      }
    };

    // 删除节点
    const graphDeleteNode = (nodeId: string, node?: ChildNode) => {
      if (!graphRef.current) return;

      // 删除节点
      graphRef.current.removeCell(nodeId);

      // 删除后需要重新计算 父级节点(循环节点)的大小
      if (node && node.loopNodeId) {
        const parentNode = graphRef.current.getCellById(
          node.loopNodeId,
        ) as Node;
        adjustParentSize(parentNode);
      }
    };

    // 删除边
    const graphDeleteEdge = (id: string) => {
      if (!graphRef.current) return;
      // 先更新sourceNode的nextNodeIds
      const edge = graphRef.current.getCellById(id);
      if (edge && edge.isEdge()) {
        const sourceNode = edge.getSourceNode();
        if (sourceNode) {
          const nextNodeIds = sourceNode.getData().nextNodeIds;
          if (nextNodeIds) {
            sourceNode.updateData({
              nextNodeIds: nextNodeIds.filter(
                (item: number) => item !== Number(edge.getTargetNode().id),
              ),
            });
          }
        }
      }
      graphRef.current.removeCell(id);
    };

    // 创建边
    const graphCreateNewEdge = (
      source: string,
      target: string,
      isLoop?: boolean,
    ) => {
      // graphRef.current.addEdge({source,target})
      const edge = createEdge({ source, target, zIndex: isLoop ? 25 : 1 });

      if (!graphRef.current) return;
      graphRef.current.addEdge(edge);
    };

    // 选中节点 切换节点
    const graphSelectNode = (id: string) => {
      const node = graphRef.current.getCellById(id);
      if (!node || !graphRef.current) return;
      node.updateData({
        isFocus: false,
      });
      // 清除其他的节点选中
      graphRef.current.cleanSelection();
      const cells = graphRef.current.getSelectedCells();
      graphRef.current.unselect(cells);
      // 设置当前节点为选中状态
      graphRef.current.select(node);
    };

    // 激活节点
    const graphActiveNodeRunResult = (id: string, runResult: RunResultItem) => {
      const node = graphRef.current.getCellById(id);
      if (!node || !graphRef.current) return;
      const beforeData = node.getData();
      // 如果是循环执行目前只会有串行 后续如果有并行需要考虑
      node.updateData({
        isFocus: true,
        runResults: [
          ...(beforeData.runResults || []).filter(
            (item: RunResultItem) =>
              item.status !== RunResultStatusEnum.EXECUTING,
          ),
          runResult,
        ],
      });
      graphRef.current.select(node);
    };

    const graphResetRunResult = () => {
      if (!graphRef.current) return;
      const nodes = graphRef.current.getNodes();
      nodes.forEach((node: Node) => {
        node.updateData({
          runResults: [],
        });
      });
    };

    const graphTriggerBlankClick = () => {
      if (!graphRef.current) return;
      graphRef.current.trigger('blank:click');
    };

    // 保存所有节点的位置
    // const graphSaveAllNodes = () => {
    //   const nodes = graphRef.current.getNodes().map((node: Node) => {
    //     const data = node.getData() as ChildNode;
    //     const position = node.getPosition();
    //     if (position) {
    //       data.nodeConfig.extension = {
    //         ...data.nodeConfig.extension,
    //         x: position.x,
    //         y: position.y,
    //       };
    //     }
    //     return data;
    //   });
    //   return nodes;
    // };

    // 改变画布缩放比例
    const graphChangeZoom = (val: number) => {
      if (!graphRef.current) return;
      graphRef.current.zoomTo(Number(val));
    };

    // 缩放适配
    const graphChangeZoomToFit = () => {
      if (!graphRef.current) return;
      graphRef.current.zoomToFit({
        padding: {
          top: 128 + 18,
          left: 18,
          right: 18,
          bottom: 18,
        },
        maxScale: 1,
        minScale: 0.2,
        preserveAspectRatio: true,
        useCellGeometry: true,
      });
    };

    const drawGraph = () => {
      if (graphRef.current && graphParams.nodeList.length > 0) {
        // 清除现有元素，防止重复渲染
        graphRef.current.clearCells();

        const notLoopChildrenNodes = graphParams.nodeList.filter(
          (item) => !item.loopNodeId,
        );

        // 创建主节点
        const mainNodes = notLoopChildrenNodes.map((node) =>
          createBaseNode(node),
        );
        graphRef.current.fromJSON({
          nodes: mainNodes, // X6 会自动实例化节点
        });
        // 找出循环节点 子节点如果有就添加
        addLoopChildNode((node) => {
          return node.type === NodeTypeEnum.Loop;
        });

        // 批量添加边
        batchAddEdges(graphParams.edgeList);

        // 添加zoomToFit调用，确保在绘制完成后自动调整视图
        graphRef.current.once('render:done', () => {
          setTimeout(() => {
            graphChangeZoomToFit();
            onInit();
          }, 20);
        });
      }
    };

    // 获取当前可视区域的x，y，width，height
    const getCurrentViewPort = () => {
      if (!graphRef.current) return { x: 0, y: 0, width: 0, height: 0 };
      const viewport = graphRef.current.getGraphArea();
      return {
        x: viewport.x as number,
        y: viewport.y as number,
        width: viewport.width as number,
        height: viewport.height as number,
      };
    };
    const getGraphRef = (): Graph => {
      return graphRef.current;
    };
    // 将子组件的方法暴露给父组件
    useImperativeHandle(ref, () => ({
      getCurrentViewPort,
      graphAddNode,
      graphUpdateNode,
      graphUpdateByFormData,
      // graphSaveAllNodes,
      graphDeleteNode,
      graphDeleteEdge,
      graphChangeZoom,
      graphChangeZoomToFit,
      drawGraph,
      graphSelectNode,
      graphCreateNewEdge,
      getGraphRef,
      graphTriggerBlankClick,
      graphActiveNodeRunResult,
      graphResetRunResult,
    }));

    const changeNodeConfigWithRefresh = useCallback(
      async (config: ChangeNodeProps) => {
        const result = await changeCondition(config);
        if (!result) {
          onRefresh();
        }
        return result;
      },
      [changeCondition, onRefresh],
    );
    const changeEdgeConfigWithRefresh = useCallback(
      async (config: ChangeEdgeProps) => {
        const result = await changeEdge(config);
        if (!result) {
          onRefresh();
        }
        return result;
      },
      [changeEdge, onRefresh],
    );

    useEffect(() => {
      if (!containerRef.current) return;
      preWork();
      graphRef.current = InitGraph({
        containerId: GRAPH_CONTAINER_ID,
        changeDrawer: changeDrawer,
        changeCondition,
        changeNodeConfigWithRefresh,
        changeEdgeConfigWithRefresh,
        changeZoom: changeZoom,
        createNodeByPortOrEdge,
        onSaveNode: onSaveNode,
        onClickBlank: onClickBlank,
      });

      const cleanup = EventHandlers({
        graph: graphRef.current,
        changeEdgeConfigWithRefresh,
        copyNode,
        changeNodeConfigWithRefresh,
        removeNode,
        modal,
        message,
      });

      return () => {
        setTimeout(() => {
          cleanup();
          if (graphRef.current) {
            graphRef.current.dispose();
          }
        }, 100);
      };
    }, []);

    useEffect(() => {
      if (graphParams.nodeList.length === 0) {
        // 如果节点列表为空，则重置初始化状态
        hasInitialized.current = false;
      }
    }, [graphParams.nodeList]);

    useEffect(() => {
      if (graphParams.nodeList.length > 0) {
        drawGraph();
        hasInitialized.current = true;
      }
    }, [graphParams]);

    return <div ref={containerRef} id={GRAPH_CONTAINER_ID} />;
  },
);

export default GraphContainer;
