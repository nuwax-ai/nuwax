import type {
  ChildNode,
  Edge,
  GraphContainerProps,
  GraphContainerRef,
} from '@/types/interfaces/graph';
import { adjustParentSize, updateEdgeArrows } from '@/utils/graph';
import {
  createBaseNode,
  createChildNode,
  createEdge,
  generatePorts,
  getEdges,
  getHeight,
  getLength,
  getWidthAndHeight,
} from '@/utils/workflow';
import { Node } from '@antv/x6';
import { App } from 'antd';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import EventHandlers from './component/eventHandlers';
import InitGraph from './component/graph';
import { registerCustomNodes } from './component/registerCustomNodes';
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
      createNodeToPortOrEdge,
      onSaveNode,
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
      graphContainer.id = 'graph-container';
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

    const doAddNode = (e: { x: number; y: number }, child: ChildNode) => {
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
        changeCondition(_params);
      }
    };

    // 新增节点
    const addNode = (e: { x: number; y: number }, child: ChildNode) => {
      if (!graphRef.current) return;
      doAddNode(e, child);
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
    const updateNode = (nodeId: string, newData: ChildNode) => {
      if (!graphRef.current) return;
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
        // 处理特殊情况,如果是条件节点，需要调整子节点的大小并且重新绘制连接桩
        if (
          newData.type === 'Condition' ||
          newData.type === 'IntentRecognition'
        ) {
          const oldData = node.getData() as ChildNode;
          const _length = getLength(
            oldData,
            newData,
            newData.type === 'Condition'
              ? 'conditionBranchConfigs'
              : 'intentConfigs',
          );

          if (_length) {
            // 使用prop方法更新端口配置
            const ports = generatePorts(newData);
            node.prop('ports', ports);
            // node.updatePorts();
          }
        }
        if (newData.type === 'QA') {
          if (newData.nodeConfig.answerType !== 'SELECT') {
            node.setSize(304, 110);
            node.prop('ports', generatePorts(newData));
          } else {
            const optionsLength = newData.nodeConfig?.options
              ? newData.nodeConfig.options.length
              : 0;
            const newHeight = getHeight('QA', optionsLength);
            // 确保在获取到新高度后设置节点大小和端口
            node.setSize(304, newHeight);
            node.prop('ports', generatePorts(newData));
          }
        }
        // console.log('newData', newData);
        node.updateData(newData);
      }
    };

    // 删除节点
    const deleteNode = (nodeId: string, node?: ChildNode) => {
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
    const deleteEdge = (id: string) => {
      if (!graphRef.current) return;
      graphRef.current.removeCell(id);
    };

    // 创建边
    const createNewEdge = (
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
    const selectNode = (id: string) => {
      const node = graphRef.current.getCellById(id);
      if (!node || !graphRef.current) return;

      // 清除其他的节点选中
      graphRef.current.cleanSelection();
      const cells = graphRef.current.getSelectedCells();
      graphRef.current.unselect(cells);
      // 设置当前节点为选中状态
      graphRef.current.select(node);
    };
    const clearSelection = () => {
      if (!graphRef.current) return;
      graphRef.current.trigger('blank:click');
    };

    // 保存所有节点的位置
    const saveAllNodes = () => {
      const nodes = graphRef.current.getNodes().map((node: Node) => {
        const data = node.getData() as ChildNode;
        const position = node.getPosition();
        if (position) {
          data.nodeConfig.extension = {
            ...data.nodeConfig.extension,
            x: position.x,
            y: position.y,
          };
        }
        return data;
      });
      return nodes;
    };

    // 改变画布缩放比例
    const changeGraphZoom = (val: number) => {
      if (!graphRef.current) return;
      graphRef.current.zoomTo(Number(val));
    };

    // 缩放适配
    const changeGraphZoomToFit = () => {
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
        const mainNodes = notLoopChildrenNodes.map((node) => {
          const baseNode = createBaseNode(node);

          const { width, height } = getWidthAndHeight(node);
          return {
            ...baseNode,
            width: width, // 显式设置宽度
            height: height,
          };
        });
        graphRef.current.fromJSON({
          nodes: mainNodes, // X6 会自动实例化节点
        });
        // 找出循环节点 子节点如果有就添加
        addLoopChildNode((node) => {
          return node.type === 'Loop';
        });

        // 批量添加边
        batchAddEdges(graphParams.edgeList);

        // 添加zoomToFit调用，确保在绘制完成后自动调整视图
        setTimeout(() => {
          changeGraphZoomToFit();
        }, 0);
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
    const getGraphRef = () => {
      return graphRef.current;
    };
    // 将子组件的方法暴露给父组件
    useImperativeHandle(ref, () => ({
      getCurrentViewPort,
      addNode,
      updateNode,
      saveAllNodes,
      deleteNode,
      deleteEdge,
      changeGraphZoom,
      changeGraphZoomToFit,
      drawGraph,
      selectNode,
      createNewEdge,
      getGraphRef,
      clearSelection,
    }));

    useEffect(() => {
      if (!containerRef.current) return;
      preWork();
      graphRef.current = InitGraph({
        containerId: 'graph-container',
        changeDrawer: changeDrawer,
        changeEdge: changeEdge,
        changeCondition: changeCondition,
        changeZoom: changeZoom,
        createNodeToPortOrEdge: createNodeToPortOrEdge,
        onSaveNode: onSaveNode,
      });

      const cleanup = EventHandlers({
        graph: graphRef.current,
        changeEdge,
        copyNode,
        changeCondition,
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
      if (graphParams.nodeList.length > 0 && !hasInitialized.current) {
        drawGraph();
        hasInitialized.current = true;
      }
    }, [graphParams.nodeList]);

    return <div ref={containerRef} id="graph-container" />;
  },
);

export default GraphContainer;
