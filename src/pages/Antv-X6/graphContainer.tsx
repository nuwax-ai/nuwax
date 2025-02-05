import type { ChildNode, Edge } from '@/types/interfaces/workflow';
import { Node } from '@antv/x6';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import EventHandlers from './component/eventHandlers';
import InitGraph from './component/graph';
import { registerCustomNodes } from './component/registerCustomNodes';
import type { Child } from './type';
interface GraphContainerProps {
  graphParams: { nodeList: ChildNode[]; edgeList: Edge[] };
  handleNodeChange: (action: string, data: ChildNode) => void;
  changeDrawer: (child: ChildNode) => void;
  changeEdge: (
    sourceNode: ChildNode,
    targetId: string,
    type: string,
    id: string,
  ) => void;
}

interface GraphContainerRef {
  addNode: (e: { x: number; y: number }, child: Child) => void;
  updateNode: (nodeId: string, newData: Partial<ChildNode>) => void;
  saveAllNodes: () => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
}

// 辅助函数：生成随机坐标
function getRandomPosition(maxWidth = 800, maxHeight = 600) {
  return {
    x: Math.random() * (maxWidth - 304), // 减去节点宽度以避免超出边界
    y: Math.random() * (maxHeight - 83), // 减去节点高度以避免超出边界
  };
}

const GraphContainer = forwardRef<GraphContainerRef, GraphContainerProps>(
  ({ graphParams, handleNodeChange, changeDrawer, changeEdge }, ref) => {
    registerCustomNodes();
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<any>(null);

    function preWork() {
      const container = containerRef.current;
      if (!container) return;

      const graphContainer = document.createElement('div');
      graphContainer.id = 'graph-container';
      container?.appendChild(graphContainer);
    }

    // 新增节点
    const addNode = (e: { x: number; y: number }, child: Child) => {
      if (!graphRef.current) return;

      const point = graphRef.current.clientToGraph(e.x, e.y);

      let targetNode: any | null = null;
      graphRef.current.getNodes().some((node: Node) => {
        if (node.getData<ChildNode>()?.type === 'Loop') {
          const bbox = node.getBBox();
          if (bbox.containsPoint(point)) {
            targetNode = node;
            return true;
          }
        }
        return false;
      });

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
        zIndex: 2,
        ports: {
          groups: {
            left: {
              position: 'left',
              attrs: {
                circle: {
                  r: 5,
                  magnet: true,
                  stroke: '#8f8f8f',
                  strokeWidth: 1,
                  fill: '#fff',
                },
              },
            },
            right: {
              position: 'right',
              attrs: {
                circle: {
                  r: 5,
                  magnet: true,
                  stroke: '#8f8f8f',
                  strokeWidth: 1,
                  fill: '#fff',
                },
              },
            },
          },
          items: [
            { group: 'left', id: `${child.id}-left` },
            { group: 'right', id: `${child.id}-right` },
          ],
        },
      });

      if (targetNode === null) {
        graphRef.current.addCell(newNode);
      } else {
        targetNode.setZIndex(1);
        targetNode.addChild(newNode);
      }
    };

    // 修改节点信息
    const updateNode = (nodeId: string, newData: Partial<ChildNode>) => {
      if (!graphRef.current) return;

      const node = graphRef.current.getCellById(nodeId);
      if (node && node.isNode()) {
        const currentData = node.getData() as ChildNode;

        const position = node.getPosition();

        console.log(position);

        if (position) {
          // 确保 newData.nodeConfig 存在
          if (!newData.nodeConfig) {
            newData.nodeConfig = {};
          }

          // 确保 newData.nodeConfig.extension 存在
          if (!newData.nodeConfig.extension) {
            newData.nodeConfig.extension = {};
          }

          newData.nodeConfig.extension = {
            ...newData.nodeConfig.extension,
            x: position.x,
            y: position.y,
          };
        }
        const updatedData = { ...currentData, ...newData };

        node.setData(updatedData);
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

    // 将子组件的方法暴露给父组件
    useImperativeHandle(ref, () => ({
      addNode,
      updateNode,
      saveAllNodes,
      deleteNode,
      deleteEdge,
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      preWork();

      graphRef.current = InitGraph({
        containerId: 'graph-container',
        changeDrawer: changeDrawer,
        changeEdge: changeEdge,
      });

      const cleanup = EventHandlers(graphRef.current);

      return () => {
        setTimeout(() => {
          cleanup();
          if (graphRef.current) {
            graphRef.current.dispose();
          }
        }, 0);
      };
    }, []);

    useEffect(() => {
      if (graphRef.current && graphParams.nodeList.length > 0) {
        // 清除现有元素，防止重复渲染
        graphRef.current.clearCells();

        const nodes = graphParams.nodeList.map((node: ChildNode) => {
          const extension = node.nodeConfig?.extension || {};
          const width = extension.width || 304;
          const height = extension.height || 83;
          const position = getRandomPosition(); // 如果没有提供具体的 x 和 y，则使用随机位置

          return {
            id: node.id.toString(),
            shape: 'general-Node',
            x: extension.x !== undefined ? extension.x : position.x,
            y: extension.y !== undefined ? extension.y : position.y,
            width: width,
            height: height,
            label: node.name,
            data: {
              ...node,
              onChange: handleNodeChange,
            },

            ports: {
              groups: {
                left: {
                  position: 'left',
                  attrs: {
                    circle: {
                      r: 5,
                      magnet: true,
                      stroke: '#8f8f8f',
                      strokeWidth: 1,
                      fill: '#fff',
                    },
                  },
                },
                right: {
                  position: 'right',
                  attrs: {
                    circle: {
                      r: 5,
                      magnet: true,
                      stroke: '#8f8f8f',
                      strokeWidth: 1,
                      fill: '#fff',
                    },
                  },
                },
              },
              items: [
                { group: 'left', id: `${node.id.toString()}-left` },
                { group: 'right', id: `${node.id.toString()}-right` },
              ],
            },
          };
        });

        // 更新图形数据中的节点
        // graphRef.current.fromJSON({ nodes });
        // console.log(graphParams.edgeList);
        const edges = graphParams.edgeList.map((edge: Edge) => {
          return {
            shape: 'edge',
            source: {
              cell: edge.source.toString(),
              port: `${edge.source.toString()}-right`, // 使用右侧连接桩
            },
            target: {
              cell: edge.target.toString(),
              port: `${edge.target.toString()}-left`, // 使用左侧连接桩
            },
            router: {
              name: 'orth',
            },
            connector: {
              name: 'rounded',
              args: {
                radius: 8,
              },
            },
            attrs: {
              line: {
                stroke: '#A2B1C3',
                strokeWidth: 2,
              },
            },
            zIndex: 30,
          };
        });

        graphRef.current.fromJSON({
          nodes,
          edges,
        });
      }
    }, [graphParams]);

    return <div ref={containerRef} id="graph-container" />;
  },
);

export default GraphContainer;
