/**
 * 图谱初始化 Hook (G6 v5)
 */
import type { GraphData as G6GraphData, Graph } from '@antv/g6';
import { Graph as G6Graph } from '@antv/g6';
import { useCallback } from 'react';
import {
  getBehaviors,
  getEdgeStyle,
  getLayoutConfig,
  getNodeStyle,
} from '../../constants/graphConfig';
import { useGraphStore } from '../../store/useGraphStore';
import type { GraphData } from '../../types/graph';

const toG6Data = (
  data: GraphData,
  width: number,
  height: number,
): G6GraphData => {
  const centerX = width / 2;
  const centerY = height / 2;
  const nodeCount = data.nodes.length;
  const radius = Math.min(centerX, centerY) * 0.8;

  return {
    nodes: data.nodes.map((node, index) => {
      const angle = (index / nodeCount) * 2 * Math.PI;
      const r = radius * (0.3 + 0.7 * Math.random());
      return {
        id: node.id,
        data: {
          label: node.label,
          nodeType: node.type,
          fullText: node.fullText,
        },
        style: {
          x: node.x || centerX + r * Math.cos(angle),
          y: node.y || centerY + r * Math.sin(angle),
        },
      };
    }),
    edges: data.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      data: { label: edge.label, fullText: edge.fullText },
    })),
  };
};

const clearAllStates = (graph: Graph) => {
  graph.getNodeData().forEach((node: any) => {
    graph.setElementState(node.id, []);
  });
  graph.getEdgeData().forEach((edge: any) => {
    graph.setElementState(edge.id, []);
  });
};

const highlightConnectedNodes = (
  graph: Graph,
  startNodeId: string,
  skipSelected = true,
) => {
  const edges = graph.getEdgeData() as any[];
  const highlightNodeIds = new Set<string>();
  const highlightEdgeIds = new Set<string>();
  const visitedNodeIds = new Set<string>();

  const findAllConnected = (nodeId: string) => {
    if (visitedNodeIds.has(nodeId)) return;
    visitedNodeIds.add(nodeId);

    edges.forEach((edge) => {
      if (edge.source === nodeId) {
        highlightNodeIds.add(nodeId);
        highlightNodeIds.add(edge.target);
        highlightEdgeIds.add(edge.id);
        findAllConnected(edge.target);
      } else if (edge.target === nodeId) {
        highlightNodeIds.add(nodeId);
        highlightNodeIds.add(edge.source);
        highlightEdgeIds.add(edge.id);
        findAllConnected(edge.source);
      }
    });
  };

  findAllConnected(startNodeId);

  highlightNodeIds.forEach((nodeId) => {
    if (skipSelected && nodeId === startNodeId) return;
    graph.setElementState(nodeId, ['highlight']);
  });

  highlightEdgeIds.forEach((edgeId) => {
    graph.setElementState(edgeId, ['highlight']);
  });
};

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

      if (graphRef.current) {
        graphRef.current.destroy();
        graphRef.current = null;
      }

      const w = options?.width || 1200;
      const h = options?.height || 800;

      const graph = new G6Graph({
        container: containerRef.current,
        width: w,
        height: h,
        autoFit: 'view' as const,
        data: toG6Data(data, w, h),
        node: getNodeStyle() as any,
        edge: getEdgeStyle() as any,
        layout: getLayoutConfig() as any,
        behaviors: getBehaviors(),
      });

      graph.render();

      // 节点点击
      graph.on('node:click', (evt: any) => {
        const nodeId = evt.target.id;
        const nodeData = graph.getNodeData(nodeId) as any;
        if (!nodeData) return;

        const hasSelected = (graph.getElementState(nodeId) || []).includes(
          'selected',
        );

        clearAllStates(graph);

        if (hasSelected) {
          setSelectedNode(null);
          closeDetailPanel();
          return;
        }

        setSelectedNode(nodeId);
        graph.setElementState(nodeId, ['selected']);
        highlightConnectedNodes(graph, nodeId);

        const currentNodeData = useGraphStore
          .getState()
          .graphData.nodes.find((n) => n.id === nodeId);
        if (currentNodeData) {
          openDetailPanel(currentNodeData);
        }
      });

      // 边点击
      graph.on('edge:click', (evt: any) => {
        const edgeId = evt.target.id;
        const edgeData = graph.getEdgeData(edgeId) as any;
        if (!edgeData) return;

        setSelectedEdge(edgeId);
        const targetNodeId = edgeData.target;

        clearAllStates(graph);

        setSelectedNode(targetNodeId);
        graph.setElementState(targetNodeId, ['selected']);
        highlightConnectedNodes(graph, targetNodeId);

        const currentNodeData = useGraphStore
          .getState()
          .graphData.nodes.find((n) => n.id === targetNodeId);
        if (currentNodeData) {
          openDetailPanel(currentNodeData);
        }
      });

      // hover
      graph.on('node:mouseenter', (evt: any) => {
        const states = graph.getElementState(evt.target.id) || [];
        if (states.includes('selected') || states.includes('highlight')) return;
        graph.setElementState(evt.target.id, ['hover']);
      });
      graph.on('node:mouseleave', (evt: any) => {
        graph.setElementState(evt.target.id, []);
      });
      graph.on('edge:mouseenter', (evt: any) => {
        graph.setElementState(evt.target.id, ['hover']);
      });
      graph.on('edge:mouseleave', (evt: any) => {
        graph.setElementState(evt.target.id, []);
      });

      // 画布点击清除
      graph.on('canvas:click', () => {
        clearAllStates(graph);
        closeDetailPanel();
        setSelectedNode(null);
        setSelectedEdge(null);
      });

      // 布局完成后通知
      graph.on('afteranimate', () => {
        setTimeout(() => {
          if (graphRef.current === graph && onRenderComplete) {
            onRenderComplete();
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

  const updateGraphData = useCallback(
    (data: GraphData) => {
      const graph = graphRef.current;
      if (!graph) return;

      const width = graph.getSize()[0] || 1200;
      const height = graph.getSize()[1] || 800;
      graph.setData(toG6Data(data, width, height));
      graph.render();
    },
    [graphRef],
  );

  return { initGraph, destroyGraph, updateGraphData };
}
