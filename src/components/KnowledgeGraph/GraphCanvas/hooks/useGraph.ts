/**
 * 图谱初始化 Hook
 */
import type { Graph } from '@antv/g6';
import G6 from '@antv/g6';
import { useCallback } from 'react';
import {
  CONTENT_NODE_SIZE,
  OBJECT_NODE_SIZE,
  ROOT_NODE_SIZE,
} from '../../constants/colors';
import { defaultGraphConfig } from '../../constants/graphConfig';
import { useGraphStore } from '../../store/useGraphStore';
import type { GraphData } from '../../types/graph';

export function useGraph(
  containerRef: React.RefObject<HTMLDivElement | null>,
  graphRef: React.MutableRefObject<Graph | null>,
  onRenderComplete?: () => void,
) {
  const {
    openDetailPanel,
    closeDetailPanel,
    setSelectedNode,
    setSelectedEdge,
  } = useGraphStore();

  const initGraph = useCallback(
    (data: GraphData, options?: { width?: number; height?: number }) => {
      if (!containerRef.current) return;

      // 销毁旧图谱
      if (graphRef.current) {
        graphRef.current.destroy();
        graphRef.current = null;
      }

      // 创建新图谱
      const graph = new G6.Graph({
        ...defaultGraphConfig,
        container: containerRef.current,
        width: options?.width || (defaultGraphConfig.width as number),
        height: options?.height || (defaultGraphConfig.height as number),
      });

      // 根据节点类型设置大小
      const getNodeSize = (type: string) => {
        switch (type) {
          case 'root':
            return ROOT_NODE_SIZE;
          case 'object':
            return OBJECT_NODE_SIZE;
          default:
            return CONTENT_NODE_SIZE;
        }
      };

      // 计算画布中心
      const centerX = (options?.width || 1200) / 2;
      const centerY = (options?.height || 800) / 2;

      // 计算节点分布半径，确保节点间有足够间距
      const nodeCount = data.nodes.length;
      const radius = Math.min(centerX, centerY) * 0.8;

      // 设置数据并渲染
      graph.data({
        nodes: data.nodes.map((node, index) => {
          // 使用圆形均匀分布初始位置
          const angle = (index / nodeCount) * 2 * Math.PI;
          const r = radius * (0.3 + 0.7 * Math.random()); // 内外随机分布
          return {
            id: node.id,
            label: node.label,
            type: 'custom-node',
            nodeType: node.type,
            size: getNodeSize(node.type),
            fullText: node.fullText,
            x: node.x || centerX + r * Math.cos(angle),
            y: node.y || centerY + r * Math.sin(angle),
          };
        }),
        edges: data.edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          fullText: edge.fullText,
          type: 'line',
          style: {
            stroke: '#CBD5E1',
            lineWidth: 1.5,
            lineDash: [5, 5],
            endArrow: {
              path: G6.Arrow.triangle(6, 8, 4),
              fill: '#94A3B8',
            },
            cursor: 'pointer',
          },
          labelCfg: {
            autoRotate: true,
            refY: 5,
            style: {
              fill: '#64748B',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              background: {
                fill: '#fff',
                padding: [4, 8, 4, 8],
                radius: 6,
                stroke: '#E2E8F0',
                lineWidth: 1,
                cursor: 'pointer',
              },
            },
          },
          states: {
            hover: {
              stroke: '#1890ff',
              lineWidth: 2,
              lineDash: [5, 5],
              endArrow: {
                path: G6.Arrow.triangle(6, 8, 4),
                fill: '#1890ff',
              },
              labelCfg: {
                style: {
                  fill: '#1890ff',
                  cursor: 'pointer',
                  background: {
                    fill: '#e6f7ff',
                    padding: [4, 8, 4, 8],
                    radius: 6,
                    stroke: '#91d5ff',
                    lineWidth: 1,
                    cursor: 'pointer',
                  },
                },
              },
            },
            highlight: {
              stroke: '#1890ff',
              lineWidth: 2,
              lineDash: [5, 5],
              endArrow: {
                path: G6.Arrow.triangle(6, 8, 4),
                fill: '#1890ff',
              },
            },
          },
        })),
      });

      graph.render();

      // 绑定事件
      const onNodeClick = (evt: any) => {
        const node = evt.item;
        const model = node.getModel();

        // 检查当前节点是否已经是选中状态
        const isSelected = node.hasState('selected');

        // 先清除所有节点和边的高亮状态
        graph.getNodes().forEach((n: any) => {
          graph.setItemState(n, 'selected', false);
          graph.setItemState(n, 'highlight', false);
        });
        graph.getEdges().forEach((e: any) => {
          graph.setItemState(e, 'highlight', false);
        });

        // 如果之前已经选中，则取消选中
        if (isSelected) {
          setSelectedNode(null);
          closeDetailPanel();
          return;
        }

        // 设置当前节点为选中状态
        setSelectedNode(model.id);
        graph.setItemState(node, 'selected', true);

        const edges = graph.getEdges();

        // 收集需要高亮的节点ID和边ID（使用Set避免重复）
        const highlightNodeIds = new Set<string>();
        const highlightEdgeIds = new Set<string>();

        // 递归查找所有相关联的节点
        const visitedNodeIds = new Set<string>();

        const findAllConnectedNodes = (startNodeId: string) => {
          if (visitedNodeIds.has(startNodeId)) return;
          visitedNodeIds.add(startNodeId);

          edges.forEach((edge: any) => {
            const edgeModel = edge.getModel();
            if (edgeModel.source === startNodeId) {
              // 找到子节点或相连节点
              highlightNodeIds.add(startNodeId);
              highlightNodeIds.add(edgeModel.target);
              highlightEdgeIds.add(edgeModel.id);
              // 递归查找
              findAllConnectedNodes(edgeModel.target);
            } else if (edgeModel.target === startNodeId) {
              // 找到父节点或相连节点
              highlightNodeIds.add(startNodeId);
              highlightNodeIds.add(edgeModel.source);
              highlightEdgeIds.add(edgeModel.id);
              // 递归查找
              findAllConnectedNodes(edgeModel.source);
            }
          });
        };

        // 从当前节点开始递归查找
        findAllConnectedNodes(model.id);

        // 高亮所有相关节点和边（排除当前选中的节点，用 selected 状态）
        highlightNodeIds.forEach((nodeId) => {
          if (nodeId !== model.id) {
            const relatedNode = graph.findById(nodeId);
            if (relatedNode) {
              graph.setItemState(relatedNode, 'highlight', true);
            }
          }
        });

        highlightEdgeIds.forEach((edgeId) => {
          const relatedEdge = graph.findById(edgeId);
          if (relatedEdge) {
            graph.setItemState(relatedEdge, 'highlight', true);
          }
        });

        // 打开详情面板
        const currentNodeData = useGraphStore
          .getState()
          .graphData.nodes.find((n) => n.id === model.id);
        if (currentNodeData) {
          openDetailPanel(currentNodeData);
        }
      };

      const onEdgeClick = (evt: any) => {
        const edge = evt.item;
        const model = edge.getModel();
        setSelectedEdge(model.id);

        // 点击边时，选中目标节点并打开详情面板
        const targetNodeId = model.target;

        // 先清除所有节点和边的高亮状态
        graph.getNodes().forEach((n: any) => {
          graph.setItemState(n, 'selected', false);
          graph.setItemState(n, 'highlight', false);
        });
        graph.getEdges().forEach((e: any) => {
          graph.setItemState(e, 'highlight', false);
        });

        // 找到目标节点
        const targetNode = graph.findById(targetNodeId);
        if (targetNode) {
          // 设置目标节点为选中状态
          setSelectedNode(targetNodeId);
          graph.setItemState(targetNode, 'selected', true);

          const edges = graph.getEdges();

          // 收集需要高亮的节点ID和边ID（使用Set避免重复）
          const highlightNodeIds = new Set<string>();
          const highlightEdgeIds = new Set<string>();

          // 递归查找所有相关联的节点
          const visitedNodeIds = new Set<string>();

          const findAllConnectedNodes = (startNodeId: string) => {
            if (visitedNodeIds.has(startNodeId)) return;
            visitedNodeIds.add(startNodeId);

            edges.forEach((edge: any) => {
              const edgeModel = edge.getModel();
              if (edgeModel.source === startNodeId) {
                // 找到子节点或相连节点
                highlightNodeIds.add(startNodeId);
                highlightNodeIds.add(edgeModel.target);
                highlightEdgeIds.add(edgeModel.id);
                // 递归查找
                findAllConnectedNodes(edgeModel.target);
              } else if (edgeModel.target === startNodeId) {
                // 找到父节点或相连节点
                highlightNodeIds.add(startNodeId);
                highlightNodeIds.add(edgeModel.source);
                highlightEdgeIds.add(edgeModel.id);
                // 递归查找
                findAllConnectedNodes(edgeModel.source);
              }
            });
          };

          // 从目标节点开始递归查找
          findAllConnectedNodes(targetNodeId);

          // 高亮所有相关节点和边（排除当前选中的节点，用 selected 状态）
          highlightNodeIds.forEach((nodeId) => {
            if (nodeId !== targetNodeId) {
              const relatedNode = graph.findById(nodeId);
              if (relatedNode) {
                graph.setItemState(relatedNode, 'highlight', true);
              }
            }
          });

          highlightEdgeIds.forEach((edgeId) => {
            const relatedEdge = graph.findById(edgeId);
            if (relatedEdge) {
              graph.setItemState(relatedEdge, 'highlight', true);
            }
          });

          // 打开详情面板
          const currentNodeData = useGraphStore
            .getState()
            .graphData.nodes.find((n) => n.id === targetNodeId);
          if (currentNodeData) {
            openDetailPanel(currentNodeData);
          }
        }
      };

      const onNodeHover = (evt: any) => {
        const node = evt.item;
        graph.setItemState(node, 'hover', true);
      };

      const onNodeOut = (evt: any) => {
        const node = evt.item;
        graph.setItemState(node, 'hover', false);
      };

      const onEdgeHover = (evt: any) => {
        const edge = evt.item;
        graph.setItemState(edge, 'hover', true);
      };

      const onEdgeOut = (evt: any) => {
        const edge = evt.item;
        graph.setItemState(edge, 'hover', false);
      };

      graph.on('node:click', onNodeClick);
      graph.on('edge:click', onEdgeClick);
      graph.on('node:mouseenter', onNodeHover);
      graph.on('node:mouseleave', onNodeOut);
      graph.on('edge:mouseenter', onEdgeHover);
      graph.on('edge:mouseleave', onEdgeOut);

      // 点击画布空白区域关闭详情面板
      graph.on('canvas:click', () => {
        // 清除所有节点和边的高亮状态
        graph.getNodes().forEach((n: any) => {
          graph.setItemState(n, 'selected', false);
          graph.setItemState(n, 'highlight', false);
        });
        graph.getEdges().forEach((e: any) => {
          graph.setItemState(e, 'highlight', false);
        });
        closeDetailPanel();
        setSelectedNode(null);
        setSelectedEdge(null);
      });

      // 布局完成后关闭 loading
      graph.once('afterlayout', () => {
        setTimeout(() => {
          if (graphRef.current === graph) {
            // 通知渲染完成，关闭 loading
            if (onRenderComplete) {
              onRenderComplete();
            }
          }
        }, 100);
      });

      graphRef.current = graph;
    },
    [
      containerRef,
      graphRef,
      onRenderComplete,
      openDetailPanel,
      closeDetailPanel,
      setSelectedNode,
      setSelectedEdge,
    ],
  );

  const destroyGraph = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.destroy();
      graphRef.current = null;
    }
  }, [graphRef]);

  // 更新图谱数据（不重新创建图谱）
  const updateGraphData = useCallback(
    (data: GraphData) => {
      const graph = graphRef.current;
      if (!graph) return;

      const getNodeSize = (type: string) => {
        switch (type) {
          case 'root':
            return ROOT_NODE_SIZE;
          case 'object':
            return OBJECT_NODE_SIZE;
          default:
            return CONTENT_NODE_SIZE;
        }
      };

      graph.changeData({
        nodes: data.nodes.map((node) => ({
          id: node.id,
          label: node.label,
          type: 'custom-node',
          nodeType: node.type,
          size: getNodeSize(node.type),
          fullText: node.fullText,
          x: node.x,
          y: node.y,
        })),
        edges: data.edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          fullText: edge.fullText,
          type: 'line',
          style: {
            stroke: '#CBD5E1',
            lineWidth: 1.5,
            lineDash: [5, 5],
            endArrow: {
              path: G6.Arrow.triangle(6, 8, 4),
              fill: '#94A3B8',
            },
            cursor: 'pointer',
          },
          labelCfg: {
            autoRotate: true,
            refY: 5,
            style: {
              fill: '#64748B',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              background: {
                fill: '#fff',
                padding: [4, 8, 4, 8],
                radius: 6,
                stroke: '#E2E8F0',
                lineWidth: 1,
                cursor: 'pointer',
              },
            },
          },
          states: {
            hover: {
              stroke: '#1890ff',
              lineWidth: 2,
              lineDash: [5, 5],
              endArrow: {
                path: G6.Arrow.triangle(6, 8, 4),
                fill: '#1890ff',
              },
              labelCfg: {
                style: {
                  fill: '#1890ff',
                  cursor: 'pointer',
                  background: {
                    fill: '#e6f7ff',
                    padding: [4, 8, 4, 8],
                    radius: 6,
                    stroke: '#91d5ff',
                    lineWidth: 1,
                    cursor: 'pointer',
                  },
                },
              },
            },
            highlight: {
              stroke: '#1890ff',
              lineWidth: 2,
              lineDash: [5, 5],
              endArrow: {
                path: G6.Arrow.triangle(6, 8, 4),
                fill: '#1890ff',
              },
            },
          },
        })),
      });
    },
    [graphRef],
  );

  return { initGraph, destroyGraph, updateGraphData };
}
