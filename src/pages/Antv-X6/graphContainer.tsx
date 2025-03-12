import type {
  ChildNode,
  GraphContainerProps,
  GraphContainerRef,
} from '@/types/interfaces/graph';
import {
  createBaseNode,
  createChildNode,
  createEdge,
  generatePorts,
  getHeight,
  getLength,
} from '@/utils/workflow';
import { Node } from '@antv/x6';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import EventHandlers from './component/eventHandlers';
import InitGraph from './component/graph';
import { registerCustomNodes } from './component/registerCustomNodes';

const GraphContainer = forwardRef<GraphContainerRef, GraphContainerProps>(
  (
    {
      graphParams,
      handleNodeChange,
      changeDrawer,
      changeEdge,
      changeCondition,
      copyNode,
      removeNode,
      changeZoom,
    },
    ref,
  ) => {
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

    // 新增节点
    const addNode = (e: { x: number; y: number }, child: ChildNode) => {
      if (!graphRef.current) return;

      const point = graphRef.current.clientToGraph(e.x, e.y);
      const ports = generatePorts(child);

      const extension = child.nodeConfig.extension || {};

      // 根据情况，动态给予右侧的out连接桩
      const newNode = graphRef.current.addNode({
        shape: child.key,
        id: child.id,
        x: point.x,
        y: point.y,
        width: extension.width ?? 304,
        height: extension.height ?? 75,
        data: {
          ...child,
          onChange: handleNodeChange,
        },
        resizable: true,
        zIndex: 99,
        ports: ports,
      });
      // 添加节点
      graphRef.current.addNode(newNode);
      if (child.loopNodeId) {
        // 获取刚刚添加的子节点的实例，并设置父子关系
        const childNodeInstance = graphRef.current.getCellById(newNode.id);
        // 直接在graph实例中添加子节点并设置父子关系
        const parentNode = graphRef.current.getCellById(child.loopNodeId);
        parentNode.addChild(childNodeInstance);
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
            const newHeight = getHeight(newData.type, _length);
            node.setSize(304, newHeight);
            // 使用prop方法更新端口配置
            node.prop('ports', generatePorts(newData));
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
        node.updateData(newData);
      }
    };

    // 删除节点
    const deleteNode = (nodeId: string) => {
      if (!graphRef.current) return;

      graphRef.current.removeCell(nodeId);
    };

    // 删除边
    const deleteEdge = (id: string) => {
      if (!graphRef.current) return;
      graphRef.current.removeCell(id);
    };

    // 选中节点
    const selectNode = (id: string) => {
      if (!graphRef.current) return;
      graphRef.current
        .getNodes()
        .forEach((n: Node) => n.setData({ selected: false }));
      // 获取到当前id对应的节点
      const node = graphRef.current.getCellById(id);
      if (!node) return;
      // 设置当前节点为选中状态
      node.setData({ selected: true });
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

    // 绘制画布
    const drawGraph = () => {
      if (graphRef.current && graphParams.nodeList.length > 0) {
        // 清除现有元素，防止重复渲染
        graphRef.current.clearCells();

        // 创建主节点
        const mainNodes = graphParams.nodeList.map((node) => ({
          ...createBaseNode(node),
          data: {
            ...node,
            onChange: handleNodeChange, // 注入事件处理器
          },
        }));
        graphRef.current.fromJSON({
          nodes: mainNodes, // X6 会自动实例化节点
        });
        // 找出循环节点
        const loopNodeList = graphRef.current
          .getNodes()
          .filter((item: Node) => {
            const data = item.getData();
            return data.type === 'Loop';
          });
        // 创建循环的子节点
        // 创建循环的子节点
        if (loopNodeList.length) {
          loopNodeList.forEach((element: Node) => {
            const data = element.getData();
            if (!data.innerNodes?.length) return;
            data.innerNodes.forEach((childDef: ChildNode) => {
              const child = createChildNode(data.id, childDef); // 创建子节点配置
              const childNode = graphRef.current.addNode(child); // 添加子节点到图中
              // 更新父节点的子节点列表（如果必要）
              element.addChild(childNode);
            });
          });
        }
        // 4. 创建边（需要验证节点存在性）
        const edges = graphParams.edgeList
          .map((edge) => {
            return createEdge(edge);
          })
          .filter(Boolean);
        console.log(edges);
        // 5. 批量添加边
        graphRef.current.addEdges(edges);
      }
    };

    // 新增函数：检测坐标是否在 Loop 节点内
    const findLoopParentAtPosition = (position: { x: number; y: number }) => {
      if (!graphRef.current || !graphRef.current.container) return null;

      // 1. 获取容器滚动偏移
      const container = graphRef.current.container;
      const scrollLeft = container.scrollLeft;
      const scrollTop = container.scrollTop;

      // 2. 计算修正坐标
      const adjustedX = position.x + scrollLeft;
      const adjustedY = position.y + scrollTop;

      // 3. 转换到画布坐标系
      const graphPoint = graphRef.current.clientToGraph(
        adjustedX,
        adjustedY,
        true,
      );

      // 4. 检测逻辑
      const loops = graphRef.current.getNodes().filter((node: Node) => {
        return node.getData()?.type === 'Loop';
      });

      for (const loopNode of loops) {
        const bbox = loopNode.getBBox();
        if (bbox.containsPoint(graphPoint)) {
          return loopNode.id;
        }
      }

      return null;
    };

    // 将子组件的方法暴露给父组件
    useImperativeHandle(ref, () => ({
      addNode,
      updateNode,
      saveAllNodes,
      deleteNode,
      deleteEdge,
      changeGraphZoom,
      drawGraph,
      selectNode,
      findLoopParentAtPosition,
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
      });

      const cleanup = EventHandlers({
        graph: graphRef.current,
        changeEdge,
        copyNode,
        changeCondition,
        removeNode,
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
