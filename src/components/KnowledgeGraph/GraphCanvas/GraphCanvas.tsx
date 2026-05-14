/**
 * 知识图谱画布组件
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

export const GraphCanvas = forwardRef<GraphCanvasRef, GraphCanvasProps>(
  ({ data, width, height, onRenderComplete }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<Graph | null>(null);
    const initializedRef = useRef(false);
    const selectedNode = useGraphStore((state) => state.selectedNode);

    // 暴露 graph 实例给父组件
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

    // 监听 selectedNode 变化，当变为 null 时清除图谱节点选中状态
    useEffect(() => {
      const graph = graphRef.current;
      if (!graph) return;

      if (selectedNode === null) {
        // 清除所有节点和边的高亮状态
        graph.getNodes().forEach((n: any) => {
          graph.setItemState(n, 'selected', false);
          graph.setItemState(n, 'highlight', false);
        });
        graph.getEdges().forEach((e: any) => {
          graph.setItemState(e, 'highlight', false);
        });
      }
    }, [selectedNode]);

    // 监听容器尺寸变化并更新图谱尺寸
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: newWidth, height: newHeight } = entry.contentRect;
          if (newWidth > 0 && newHeight > 0 && graphRef.current) {
            graphRef.current.changeSize(
              Math.floor(newWidth),
              Math.floor(newHeight),
            );
          }
        }
      });

      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }, []);

    // 初始化/更新图谱
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

    // 销毁图谱
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
