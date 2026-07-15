/**
 * 知识图谱画布组件 (G6 v5)
 */
import type { Graph } from '@antv/g6';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import type { GraphData } from '../types/graph';
import { useGraph } from './hooks/useGraph';
import styles from './index.less';

interface GraphCanvasProps {
  data: GraphData;
  width?: number;
  height?: number;
  onRenderComplete?: () => void;
}

export interface GraphCanvasRef {
  graph: Graph | null;
}

const clearAllStates = (graph: Graph) => {
  graph.getNodeData().forEach((node: any) => {
    graph.setElementState(node.id, []);
  });
  graph.getEdgeData().forEach((edge: any) => {
    graph.setElementState(edge.id, []);
  });
};

export const GraphCanvas = forwardRef<GraphCanvasRef, GraphCanvasProps>(
  ({ data, width, height, onRenderComplete }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<Graph | null>(null);
    const initializedRef = useRef(false);
    const selectedNode = useGraphStore((state) => state.selectedNode);

    useImperativeHandle(ref, () => ({
      get graph() {
        return graphRef.current;
      },
    }));

    const { initGraph, destroyGraph, updateGraphData } = useGraph(
      containerRef,
      graphRef,
      onRenderComplete,
    );

    useEffect(() => {
      const graph = graphRef.current;
      if (!graph) return;

      if (selectedNode === null) {
        clearAllStates(graph);
      }
    }, [selectedNode]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: newWidth, height: newHeight } = entry.contentRect;
          if (newWidth > 0 && newHeight > 0 && graphRef.current) {
            graphRef.current.setSize(
              Math.floor(newWidth),
              Math.floor(newHeight),
            );
          }
        }
      });

      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
      if (!containerRef.current || data.nodes.length === 0) return;

      const container = containerRef.current;
      const actualWidth = container.clientWidth || width || 800;
      const actualHeight = container.clientHeight || height || 600;

      if (!initializedRef.current) {
        initGraph(data, { width: actualWidth, height: actualHeight });
        initializedRef.current = true;
      } else if (graphRef.current) {
        updateGraphData(data);
      }
    }, [data, width, height, initGraph, updateGraphData]);

    useEffect(() => {
      return () => {
        destroyGraph();
        initializedRef.current = false;
      };
    }, [destroyGraph]);

    if (data.nodes.length === 0) {
      return (
        <div
          className={styles.graphCanvasContainer}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: '#999', fontSize: 14 }}>暂无图谱数据</span>
        </div>
      );
    }

    return <div ref={containerRef} className={styles.graphCanvasContainer} />;
  },
);

GraphCanvas.displayName = 'GraphCanvas';

export default GraphCanvas;
