import type {
  ChildNode,
  Edge,
  GraphContainerProps,
  GraphContainerRef,
} from '@/types/interfaces/graph';
import { adjustParentSize } from '@/utils/graph';
import { generatePorts } from '@/utils/workflow';
import { Node } from '@antv/x6';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import EventHandlers from './component/eventHandlers';
import InitGraph from './component/graph';
import { registerCustomNodes } from './component/registerCustomNodes';
// 辅助函数：生成随机坐标
function getRandomPosition(maxWidth = 800, maxHeight = 600) {
  return {
    x: Math.random() * (maxWidth - 304), // 减去节点宽度以避免超出边界
    y: Math.random() * (maxHeight - 83), // 减去节点高度以避免超出边界
  };
}

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

      // 根据情况，动态给予右侧的out连接桩
      const newNode = graphRef.current.addNode({
        shape: child.key,
        id: child.id,
        x: point.x,
        y: point.y,
        width: 304,
        height: 83,
        data: {
          ...child,
          onChange: handleNodeChange,
        },
        resizable: true,
        zIndex: 3,
        ports: ports,
      });
      // 添加节点
      graphRef.current.addNode(newNode);
      if (child.loopNodeId) {
        console.log('123242141');
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
        // 如果是意图识别，条件分支，或者问答(选中了选项回答)
        if (
          newData.type === 'Condition' ||
          newData.type === 'IntentRecognition' ||
          (newData.type === 'QA' && newData.nodeConfig?.answerType === 'Select')
        ) {
          const height = node.getSize().height;
          console.log(height);
          const newPort = generatePorts(newData, height);
          console.log(newPort);
          node.prop('ports', {
            ...newPort, // 使用新生成的端口配置
          });
          //   node.removePorts(); // 清除现有的所有端口
          // newPort.forEach(port => node.addPort(port)); // 添加新端口
        }

        node.setData(newData, { overwrite: true });
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
      // console.log(node)
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
        const otherNodes = graphParams.nodeList.filter(
          (item) => !item.loopNodeId,
        );
        // 创建非Loop的子节点
        const nodes = otherNodes.map((node: ChildNode) => {
          const extension = node.nodeConfig?.extension || {};
          const width = extension.width || 304;
          const height = extension.height || 83;
          const position = getRandomPosition(); // 如果没有提供具体的 x 和 y，则使用随机位置
          const ports = generatePorts(node); // 应用自定义端口配置

          return {
            id: node.id.toString(),
            shape: node.type === 'Loop' ? 'loop-node' : 'general-Node',
            x: extension.x ?? position.x,
            y: extension.y ?? position.y,
            width: width,
            height: height,
            label: node.name,
            data: {
              ...node,
              onChange: handleNodeChange,
            },
            ports: ports,
            zIndex: 3,
          };
        });

        const edges = graphParams.edgeList.map((edge: Edge) => {
          const _obj = {
            shape: 'edge',
            router: {
              name: 'orth',
            },
            // 边的颜色
            attrs: {
              line: {
                stroke: '#A2B1C3',
                strokeWidth: 1,
              },
            },
            zIndex: 1,
          };
          // 挑出循环的
          if (
            edge.source.toString().includes('loop') ||
            edge.target.toString().includes('loop')
          ) {
            if (edge.source.toString().includes('loop')) {
              return {
                ..._obj,
                source: {
                  cell: edge.source.toString().split('-')[0],
                  port: `${edge.source.toString().split('-')[0]}-in`,
                },
                target: {
                  cell: edge.target.toString(),
                  port: `${edge.target.toString()}-in`, // 使用左侧连接桩
                },
              };
            } else {
              return {
                ..._obj,
                source: {
                  cell: edge.source.toString,
                  port: `${edge.source.toString()}-out`,
                },
                target: {
                  cell: edge.source.toString().split('-')[0],
                  port: `${edge.source.toString().split('-')[0]}-out`, // 使用左侧连接桩
                },
              };
            }
          } else {
            return {
              ..._obj,
              source: {
                cell: isNaN(Number(edge.source))
                  ? edge.source.toString().split('-')[0]
                  : edge.source.toString(),
                port: `${edge.source.toString()}-out`, // 使用右侧连接桩
              },
              target: {
                cell: edge.target.toString(),
                port: `${edge.target.toString()}-in`, // 使用左侧连接桩
              },
            };
          }
        });
        graphRef.current.fromJSON({
          nodes,
          edges,
        });

        setTimeout(() => {
          // 找到所有的loop节点
          const arr = graphRef.current.getNodes().filter((item: Node) => {
            const data = item.getData();
            return data.type === 'Loop';
          });
          // 处理Loop节点及其子节点
          arr.forEach((loopNode: Node) => {
            const data = loopNode.getData();
            if (!data.innerNodes || !data.innerNodes.length) return;
            // 将子节点添加到Loop节点内
            data.innerNodes.forEach((childNode: ChildNode) => {
              const childExtension = childNode.nodeConfig?.extension || {};
              const childPorts = generatePorts(childNode);

              const childGraphNode = {
                id: childNode.id.toString(),
                shape: 'general-Node',
                x: childExtension.x, // 子节点相对于父节点随机偏移
                y: childExtension.y,
                width: childExtension.width || 304,
                height: childExtension.height || 83,
                label: childNode.name,
                data: {
                  ...childNode,
                  parentId: loopNode.id, // 记录父节点ID
                  onChange: handleNodeChange,
                },
                ports: childPorts,
                zIndex: 10,
              };

              // 直接在graph实例中添加子节点并设置父子关系
              graphRef.current.addNode(childGraphNode);
              // 获取刚刚添加的子节点的实例，并设置父子关系
              const childNodeInstance = graphRef.current.getCellById(
                childGraphNode.id,
              );
              if (childNodeInstance) {
                loopNode.addChild(childNodeInstance);
                // 确保子节点被添加后再调整父节点尺寸
                setTimeout(() => {
                  adjustParentSize(loopNode);
                }, 0);
              }
            }, 100);
          });
        });
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
