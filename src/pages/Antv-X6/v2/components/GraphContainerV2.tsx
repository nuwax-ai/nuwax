/**
 * V2 图形容器组件
 *
 * 封装 AntV X6 图形编辑器
 * 提供图形操作的统一接口
 *
 * 完全独立，不依赖 v1 任何代码
 */

import { Graph, Node } from '@antv/x6';
import { App, Dropdown, type MenuProps } from 'antd';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  ChildNodeV2,
  CreateNodeByPortOrEdgePropsV2,
  EdgeV2,
  GraphContainerRefV2,
  GraphRectV2,
  RunResultItemV2,
  ViewGraphPropsV2,
  WorkflowDataV2,
} from '../types';
import { NodeTypeEnumV2, RunResultStatusEnumV2 } from '../types';
import {
  adjustLoopNodeSize,
  calculateNodeSize,
  createBaseNodeData,
  createEdgeData,
  createLoopChildNodeData,
  extractEdgesFromNodes,
  generatePorts,
} from '../utils/graphV2';
import {
  errorNode,
  highlightNode,
  injectAnimationStyles,
  resetAllAnimations,
  runningNode,
} from '../utils/nodeAnimationV2';
import { bindEventHandlersV2 } from './EventHandlersV2';
import { initGraphV2 } from './GraphV2';
import { registerCustomNodesV2 } from './registerCustomNodesV2';

// ==================== 类型定义 ====================

export interface GraphContainerV2Props {
  workflowData: WorkflowDataV2;
  onNodeChange: (node: ChildNodeV2) => void;
  onNodeAdd: (node: ChildNodeV2) => void;
  onNodeDelete: (nodeId: number, node?: ChildNodeV2) => void;
  onNodeCopy: (node: ChildNodeV2) => void;
  onNodeSelect: (node: ChildNodeV2 | null) => void;
  onEdgeAdd: (edge: EdgeV2) => void;
  onEdgeDelete: (edge: EdgeV2) => void;
  onZoomChange: (zoom: number) => void;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
  onClickBlank: () => void;
  onInit?: () => void;
  createNodeByPortOrEdge: (config: CreateNodeByPortOrEdgePropsV2) => void;
  /** 端口点击回调 - 用于显示节点选择弹窗 */
  onPortClick?: (
    sourceNode: ChildNodeV2,
    portId: string,
    position: { x: number; y: number },
    isInLoop: boolean,
  ) => void;
  /** 边上按钮点击回调 - 用于在边中间插入节点 */
  onEdgeButtonClick?: (
    sourceNode: ChildNodeV2,
    targetNode: ChildNodeV2,
    portId: string,
    edgeId: string,
    position: { x: number; y: number },
    isInLoop: boolean,
  ) => void;
}

const GRAPH_CONTAINER_ID = 'graph-container-v2';

// ==================== 组件实现 ====================

const GraphContainerV2 = forwardRef<GraphContainerRefV2, GraphContainerV2Props>(
  (props, ref) => {
    const {
      workflowData,
      onNodeChange,
      onNodeAdd: _onNodeAdd,
      onNodeDelete,
      onNodeCopy,
      onNodeSelect,
      onEdgeAdd,
      onEdgeDelete,
      onZoomChange,
      onHistoryChange,
      onClickBlank,
      onInit,
      createNodeByPortOrEdge,
      onPortClick,
      onEdgeButtonClick,
    } = props;

    const { modal, message } = App.useApp();
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<Graph | null>(null);
    const hasInitialized = useRef(false);
    const animationCleanupRef = useRef<Map<string, () => void>>(new Map());
    const copiedNodeRef = useRef<ChildNodeV2 | null>(null);
    const [contextMenu, setContextMenu] = useState<{
      visible: boolean;
      x: number;
      y: number;
      type: 'node' | 'blank';
      node?: ChildNodeV2 | null;
    }>({ visible: false, x: 0, y: 0, type: 'blank', node: null });

    // 初始化动画样式
    useEffect(() => {
      injectAnimationStyles();
    }, []);

    // ==================== 图形操作方法 ====================

    /**
     * 获取当前视口
     */
    const getCurrentViewPort = useCallback((): ViewGraphPropsV2 => {
      if (!graphRef.current) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }
      const area = graphRef.current.getGraphArea();
      return {
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
      };
    }, []);

    /**
     * 添加节点
     */
    const graphAddNode = useCallback(
      (position: GraphRectV2, node: ChildNodeV2) => {
        if (!graphRef.current) return;

        // 直接使用传入的画布坐标
        const nodeData = createBaseNodeData({
          ...node,
          nodeConfig: {
            ...node.nodeConfig,
            extension: { x: position.x, y: position.y },
          },
        });

        graphRef.current.addNode(nodeData);

        // 如果是循环内部节点，设置父子关系
        if (node.loopNodeId) {
          const childNode = graphRef.current.getCellById(node.id.toString());
          const parentNode = graphRef.current.getCellById(
            node.loopNodeId.toString(),
          );
          if (childNode && parentNode && parentNode.isNode()) {
            (parentNode as Node).addChild(childNode);
            // 调整父节点大小
            const newSize = adjustLoopNodeSize(
              parentNode.getData() as ChildNodeV2,
              (parentNode as Node)
                .getChildren()
                ?.map((c) => c.getData() as ChildNodeV2) || [],
            );
            (parentNode as Node).resize(newSize.width, newSize.height);
          }
        }
      },
      [],
    );

    /**
     * 更新节点
     * 参考 V1：需要处理端口变化时的边删除逻辑
     */
    const graphUpdateNode = useCallback(
      (nodeId: string, newData: ChildNodeV2 | null) => {
        if (!graphRef.current || !newData) return;

        const node = graphRef.current.getCellById(nodeId);
        if (node && node.isNode()) {
          // 获取旧的端口列表
          const oldPorts = (node as Node).getPorts();
          const oldPortIds = new Set(oldPorts.map((p) => p.id));

          // 更新位置
          const position = (node as Node).getPosition();
          newData.nodeConfig = {
            ...newData.nodeConfig,
            extension: {
              ...newData.nodeConfig?.extension,
              x: position.x,
              y: position.y,
            },
          };

          // 生成新的端口配置
          const newPorts = generatePorts(newData);
          const newPortIds = new Set(
            newPorts.items.map((p) => p.id).filter(Boolean),
          );

          // 找出被删除的端口（旧端口中存在但新端口中不存在）
          const deletedPortIds = [...oldPortIds].filter(
            (id): id is string => !!id && !newPortIds.has(id),
          );

          // 删除与被删除端口相关的边（与 V1 保持一致）
          if (deletedPortIds.length > 0) {
            const edges = graphRef.current.getEdges();
            edges.forEach((edge) => {
              const sourcePortId = edge.getSourcePortId();
              const targetPortId = edge.getTargetPortId();
              if (
                (sourcePortId && deletedPortIds.includes(sourcePortId)) ||
                (targetPortId && deletedPortIds.includes(targetPortId))
              ) {
                edge.remove();
              }
            });
          }

          // 更新端口配置
          const size = calculateNodeSize(newData, newPorts.items);
          (node as Node).setSize(size.width, size.height);
          node.prop('ports', newPorts);
          node.updateData(newData);
        }
      },
      [],
    );

    /**
     * 通过表单数据更新节点
     * 参考 V1：需要处理循环节点父子大小调整
     */
    const graphUpdateByFormData = useCallback(
      (changedValues: any, fullFormValues: any, nodeId: string) => {
        if (!graphRef.current) return;

        const cell = graphRef.current.getCellById(nodeId);
        if (!cell || !cell.isNode()) return;

        const oldData = cell.getData() as ChildNodeV2;
        const newData: ChildNodeV2 = {
          ...oldData,
          nodeConfig: {
            ...oldData.nodeConfig,
            ...fullFormValues,
          },
        };

        graphUpdateNode(nodeId, newData);

        // 如果节点在循环内，调整父循环节点大小（与 V1 保持一致）
        if (oldData.loopNodeId) {
          const parentNode = graphRef.current.getCellById(
            oldData.loopNodeId.toString(),
          );
          if (parentNode && parentNode.isNode()) {
            const parentData = parentNode.getData() as ChildNodeV2;
            const childNodes =
              (parentNode as Node)
                .getChildren()
                ?.filter((c) => c.isNode())
                .map((c) => c.getData() as ChildNodeV2) || [];
            const newSize = adjustLoopNodeSize(parentData, childNodes);
            (parentNode as Node).resize(newSize.width, newSize.height);
          }
        }
      },
      [graphUpdateNode],
    );

    /**
     * 删除节点
     */
    const graphDeleteNode = useCallback((nodeId: string) => {
      if (!graphRef.current) return;
      graphRef.current.removeCell(nodeId);
    }, []);

    /**
     * 选中节点
     */
    const graphSelectNode = useCallback((nodeId: string) => {
      if (!graphRef.current) return;

      const node = graphRef.current.getCellById(nodeId);
      if (node) {
        graphRef.current.cleanSelection();
        graphRef.current.select(node);
      }
    }, []);

    /**
     * 删除边
     */
    const graphDeleteEdge = useCallback((edgeId: string) => {
      if (!graphRef.current) return;
      graphRef.current.removeCell(edgeId);
    }, []);

    /**
     * 创建新边
     */
    const graphCreateNewEdge = useCallback(
      (
        source: string,
        target: string,
        isLoop?: boolean,
        sourcePort?: string,
        targetPort?: string,
      ) => {
        if (!graphRef.current) return;

        const edgeData = createEdgeData({
          source,
          target,
          sourcePort: sourcePort || `${source}-out`,
          targetPort: targetPort || `${target}-in`,
          zIndex: isLoop ? 25 : 1,
        });
        graphRef.current.addEdge(edgeData);
      },
      [],
    );

    /**
     * 设置缩放
     */
    const graphChangeZoom = useCallback((zoom: number) => {
      if (!graphRef.current) return;
      graphRef.current.zoomTo(zoom);
    }, []);

    /**
     * 缩放到适合
     */
    const graphChangeZoomToFit = useCallback(() => {
      if (!graphRef.current) return;
      graphRef.current.zoomToFit({
        padding: { top: 128, left: 18, right: 18, bottom: 18 },
        maxScale: 1,
        minScale: 0.2,
      });
    }, []);

    /**
     * 绘制图形
     */
    const drawGraph = useCallback(() => {
      if (!graphRef.current || workflowData.nodeList.length === 0) return;

      // 清除现有元素
      graphRef.current.clearCells();

      // 过滤出非循环子节点
      const mainNodes = workflowData.nodeList.filter((n) => !n.loopNodeId);

      // 创建主节点
      const nodeDataList = mainNodes.map((node) => createBaseNodeData(node));
      graphRef.current.fromJSON({ nodes: nodeDataList });

      // 添加循环节点的子节点
      const loopNodes = graphRef.current.getNodes().filter((n) => {
        const data = n.getData() as ChildNodeV2;
        return data?.type === NodeTypeEnumV2.Loop;
      });

      loopNodes.forEach((loopNode) => {
        const data = loopNode.getData() as ChildNodeV2;
        if (data.innerNodes) {
          data.innerNodes.forEach((childDef) => {
            const childData = createLoopChildNodeData(data.id, childDef);
            const childNode = graphRef.current!.addNode(childData);
            loopNode.addChild(childNode);
          });
        }
      });

      // 等待节点渲染完成后再添加边，防止初始化时 out port 连线回折
      // 参考 V1：使用 render:done 事件确保节点完全渲染后再创建边
      graphRef.current.once('render:done', () => {
        // 添加边
        const edges = extractEdgesFromNodes(workflowData.nodeList);
        edges.forEach((edge) => {
          const edgeData = createEdgeData(edge);
          graphRef.current!.addEdge(edgeData);
        });

        // 自适应视图
        setTimeout(() => {
          graphChangeZoomToFit();
          onInit?.();
        }, 20);
      });
    }, [workflowData.nodeList, graphChangeZoomToFit, onInit]);

    /**
     * 获取图形引用
     */
    const getGraphRef = useCallback((): Graph => {
      return graphRef.current!;
    }, []);

    /**
     * 触发空白区域点击
     */
    const graphTriggerBlankClick = useCallback(() => {
      if (!graphRef.current) return;
      graphRef.current.trigger('blank:click');
    }, []);

    /**
     * 重置运行结果
     */
    const graphResetRunResult = useCallback(() => {
      if (!graphRef.current) return;

      // 清理所有动画
      animationCleanupRef.current.forEach((cleanup) => cleanup());
      animationCleanupRef.current.clear();

      resetAllAnimations(graphRef.current);

      // 重置节点数据
      graphRef.current.getNodes().forEach((node) => {
        node.updateData({ runResults: [], isFocus: false });
      });
    }, []);

    /**
     * 激活节点运行结果
     */
    const graphActiveNodeRunResult = useCallback(
      (nodeId: string, runResult: RunResultItemV2) => {
        if (!graphRef.current) return;

        const node = graphRef.current.getCellById(nodeId);
        if (!node || !node.isNode()) return;

        const data = node.getData() as ChildNodeV2;
        const runResults = data.runResults || [];

        // 更新运行结果
        node.updateData({
          isFocus: true,
          runResults: [
            ...runResults.filter(
              (r) => r.status !== RunResultStatusEnumV2.EXECUTING,
            ),
            runResult,
          ],
        });

        // 选中节点
        graphRef.current.select(node);

        // 清理之前的动画
        const prevCleanup = animationCleanupRef.current.get(nodeId);
        if (prevCleanup) {
          prevCleanup();
        }

        // 根据状态应用动画
        let cleanup: () => void;
        switch (runResult.status) {
          case RunResultStatusEnumV2.EXECUTING:
            cleanup = runningNode(node as Node);
            break;
          case RunResultStatusEnumV2.FAILED:
            cleanup = errorNode(node as Node);
            break;
          case RunResultStatusEnumV2.FINISHED:
            cleanup = highlightNode(node as Node, {
              color: '#52c41a',
              duration: 1000,
            });
            break;
          default:
            cleanup = () => {};
        }

        animationCleanupRef.current.set(nodeId, cleanup);
      },
      [],
    );

    /**
     * 是否可以撤销
     */
    const canUndo = useCallback((): boolean => {
      return graphRef.current?.canUndo() || false;
    }, []);

    /**
     * 是否可以重做
     */
    const canRedo = useCallback((): boolean => {
      return graphRef.current?.canRedo() || false;
    }, []);

    /**
     * 撤销
     */
    const undo = useCallback(() => {
      graphRef.current?.undo();
    }, []);

    /**
     * 重做
     */
    const redo = useCallback(() => {
      graphRef.current?.redo();
    }, []);

    // ==================== 暴露方法给父组件 ====================

    useImperativeHandle(ref, () => ({
      getCurrentViewPort,
      graphAddNode,
      graphUpdateNode,
      graphUpdateByFormData,
      graphDeleteNode,
      graphSelectNode,
      graphDeleteEdge,
      graphCreateNewEdge,
      graphChangeZoom,
      graphChangeZoomToFit,
      drawGraph,
      getGraphRef,
      graphTriggerBlankClick,
      graphResetRunResult,
      graphActiveNodeRunResult,
      canUndo,
      canRedo,
      undo,
      redo,
    }));

    // ==================== 初始化 ====================

    useEffect(() => {
      if (!containerRef.current) return;

      // 注册自定义节点
      registerCustomNodesV2();

      // 创建图形容器
      const graphContainer = document.createElement('div');
      graphContainer.id = GRAPH_CONTAINER_ID;
      graphContainer.style.width = '100%';
      graphContainer.style.height = '100%';
      containerRef.current.appendChild(graphContainer);

      // 初始化图形
      graphRef.current = initGraphV2({
        containerId: GRAPH_CONTAINER_ID,
        onNodeSelect,
        onNodeChange,
        onEdgeAdd,
        onEdgeDelete,
        onZoomChange,
        createNodeByPortOrEdge,
        onClickBlank,
        onHistoryChange,
        onPortClick,
        onEdgeButtonClick,
      });

      // 绑定事件处理器
      const cleanupEventHandlers = bindEventHandlersV2({
        graph: graphRef.current,
        onNodeCopy,
        onNodeDelete,
        onEdgeDelete,
        onUndo: () => {
          onHistoryChange?.(canUndo(), canRedo());
        },
        onRedo: () => {
          onHistoryChange?.(canUndo(), canRedo());
        },
        modal,
        message,
      });

      return () => {
        // 清理
        cleanupEventHandlers();
        animationCleanupRef.current.forEach((cleanup) => cleanup());
        animationCleanupRef.current.clear();

        setTimeout(() => {
          if (graphRef.current) {
            graphRef.current.dispose();
            graphRef.current = null;
          }
        }, 100);
      };
    }, []);

    // 右键菜单
    useEffect(() => {
      const graph = graphRef.current;
      if (!graph) return;

      const handleNodeContextMenu = ({
        e,
        node,
      }: {
        e: MouseEvent;
        node: Node;
      }) => {
        e.preventDefault();
        const data = node.getData() as ChildNodeV2;
        setContextMenu({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          type: 'node',
          node: data,
        });
      };

      const handleBlankContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        setContextMenu({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          type: 'blank',
          node: null,
        });
      };

      graph.on('node:contextmenu', handleNodeContextMenu);
      graph.on('blank:contextmenu', handleBlankContextMenu);

      const handleHide = () =>
        setContextMenu((prev) => ({ ...prev, visible: false }));
      window.addEventListener('click', handleHide, true);

      return () => {
        graph.off('node:contextmenu', handleNodeContextMenu);
        graph.off('blank:contextmenu', handleBlankContextMenu);
        window.removeEventListener('click', handleHide, true);
      };
    }, []);

    const contextMenuItems: MenuProps['items'] = useMemo(() => {
      if (contextMenu.type === 'blank') {
        return [
          {
            key: 'paste',
            label: '粘贴节点',
            disabled: !copiedNodeRef.current,
          },
        ];
      }

      if (!contextMenu.node) return [];
      const disableDelete =
        contextMenu.node.type === NodeTypeEnumV2.Start ||
        contextMenu.node.type === NodeTypeEnumV2.End;
      return [
        { key: 'copy', label: '复制节点' },
        {
          key: 'paste',
          label: '粘贴副本',
          disabled: !contextMenu.node,
        },
        { key: 'delete', label: '删除节点', disabled: disableDelete },
      ];
    }, [contextMenu.node, contextMenu.type]);

    const handleContextMenuClick: MenuProps['onClick'] = useCallback(
      ({ key }: { key: string | number }) => {
        const nodeData =
          contextMenu.type === 'node'
            ? contextMenu.node
            : copiedNodeRef.current;

        if (key === 'copy' && contextMenu.node) {
          copiedNodeRef.current = JSON.parse(
            JSON.stringify(contextMenu.node),
          ) as ChildNodeV2;
          onNodeCopy?.(contextMenu.node);
        }

        if (key === 'paste' && nodeData) {
          onNodeCopy?.(nodeData);
        }

        if (key === 'delete' && contextMenu.node) {
          onNodeDelete?.(contextMenu.node.id, contextMenu.node);
          graphDeleteNode(contextMenu.node.id.toString());
        }

        setContextMenu((prev) => ({ ...prev, visible: false }));
      },
      [
        contextMenu.node,
        contextMenu.type,
        onNodeCopy,
        onNodeDelete,
        graphDeleteNode,
      ],
    );

    // 数据变化时重绘
    useEffect(() => {
      if (workflowData.nodeList.length > 0 && !hasInitialized.current) {
        drawGraph();
        hasInitialized.current = true;
      }
    }, [workflowData.nodeList, drawGraph]);

    // 数据清空时重置
    useEffect(() => {
      if (workflowData.nodeList.length === 0) {
        hasInitialized.current = false;
      }
    }, [workflowData.nodeList]);

    return (
      <>
        <div
          ref={containerRef}
          id={GRAPH_CONTAINER_ID}
          style={{ width: '100%', height: '100%' }}
        />
        <Dropdown
          open={contextMenu.visible && contextMenuItems.length > 0}
          trigger={[]}
          menu={{ items: contextMenuItems, onClick: handleContextMenuClick }}
        >
          <div
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              width: 1,
              height: 1,
              zIndex: 2000,
            }}
          />
        </Dropdown>
      </>
    );
  },
);

GraphContainerV2.displayName = 'GraphContainerV2';

export default GraphContainerV2;
