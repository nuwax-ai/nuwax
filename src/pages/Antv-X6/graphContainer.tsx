import type { ChildNode, Edge } from '@/types/interfaces/workflow';
import { Node } from '@antv/x6';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import EventHandlers from './component/eventHandlers';
import InitGraph from './component/graph';
import type { Child } from './type';
interface GraphContainerProps {
  graphParams: { nodeList: ChildNode[]; edgeList: Edge[] };
  handleNodeChange: (action: string, data?: ChildNode) => void;
  changeDrawer: (child: ChildNode) => void;
}

interface GraphContainerRef {
  addNode: (e: { x: number; y: number }, child: Child) => void;
}

const GraphContainer = forwardRef<GraphContainerRef, GraphContainerProps>(
  ({ graphParams, handleNodeChange, changeDrawer }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<any>(null);

    function preWork() {
      // 这里协助演示的代码，在实际项目中根据实际情况进行调整
      const container = containerRef.current;
      if (!container) return;

      const graphContainer = document.createElement('div');
      graphContainer.id = 'graph-container';

      // 使用可选链操作符确保容器存在
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
        x: point.x,
        y: point.y,
        width: 304,
        height: 83,
        data: {
          ...child,
          onChange: handleNodeChange,
        },
        zIndex: 2,
      });

      if (targetNode === null) {
        graphRef.current.addCell(newNode);
      } else {
        targetNode.setZIndex(1);
        targetNode.addChild(newNode);
      }
    };

    // 将子组件的方法暴露给父组件
    useImperativeHandle(ref, () => ({
      addNode,
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      // 创建图形容器
      preWork();

      // 初始化画布
      graphRef.current = InitGraph({
        containerId: 'graph-container',
        changeDrawer: changeDrawer, // 需要传递实际函数
      });

      // 绑定事件处理器并获取清理函数
      const cleanup = EventHandlers(graphRef.current);

      return () => {
        // 异步执行清理逻辑
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
        // 更新图形逻辑...

        const nodes = graphParams.nodeList.map((node: ChildNode) => ({
          id: node.id.toString(),
          shape: 'general-Node',
          x: 50 + Math.random() * 700, // 随机位置，实际应用中应该根据具体需求调整
          y: 50 + Math.random() * 400,
          width: 304,
          height: 83,
          label: node.name,
          data: {
            ...node,
            onChange: handleNodeChange,
          },
          zIndex: 2, // 可选：设置层级
        }));

        const edges = graphParams.edgeList.map((edge: Edge) => ({
          id: `${edge.source}-${edge.target}`, // 添加唯一的 id
          shape: 'edge',
          source: { id: edge.source.toString() },
          target: { id: edge.target.toString() },
          zIndex: 3, // 可选：设置层级
        }));

        // 使用 fromJSON 方法更新图形
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
