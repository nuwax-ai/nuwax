import { NodeTypeEnum, RunResultStatusEnum } from '@/types/enums/common';
import { NodeSizeGetTypeEnum } from '@/types/enums/node';
import type {
  ChildNode,
  Edge,
  GraphContainerProps,
  GraphContainerRef,
  GraphRect,
  RunResultItem,
} from '@/types/interfaces/graph';
import { ChangeEdgeProps, ChangeNodeProps } from '@/types/interfaces/graph';
import { NodeConfig } from '@/types/interfaces/node';
import { cloneDeep, mergeObject } from '@/utils/common';
import { workflowLogger } from '@/utils/logger';
import { Graph, Node } from '@antv/x6';
import { App } from 'antd';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import EventHandlers from '../../component/eventHandlers';
import InitGraph, { setGraphInitializing } from '../../component/graph';
import { registerCustomNodes } from '../../component/registerCustomNodes';
import {
  LOOP_END_NODE_X_OFFSET,
  LOOP_INNER_NODE_Y_OFFSET,
  LOOP_START_NODE_X_OFFSET,
} from '../../constants/loopNodeConstants';
import {
  adjustParentSize,
  getEdges,
  needUpdateNodes,
  updateEdgeArrows,
} from '../../utils/graphV3';
import {
  createBaseNode,
  createChildNode,
  createEdge,
  generatePorts,
  getNodeSize,
  getWidthAndHeight,
} from '../../utils/workflowV3';

const GRAPH_CONTAINER_ID = 'graph-container';
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
      createNodeByPortOrEdge,
      onSaveNode,
      onClickBlank,
      onInit,
      onRefresh,
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
      graphContainer.id = GRAPH_CONTAINER_ID;
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
          // 获取循环节点的位置
          const loopPosition = element.getPosition();
          data.innerNodes.forEach((childDef: ChildNode) => {
            // 调整内部节点位置：往右偏移 200px，确保在循环容器内
            const adjustedChildDef = {
              ...childDef,
              nodeConfig: {
                ...childDef.nodeConfig,
                extension: {
                  ...childDef.nodeConfig?.extension,
                  // 内部节点 X 位置：优先使用保存的位置，否则根据节点类型计算默认偏移
                  // 增加逻辑：如果保存的位置小于循环节点位置，说明是相对坐标，需要转换为绝对坐标
                  x: (() => {
                    const savedX = childDef.nodeConfig?.extension?.x;
                    const loopX = loopPosition?.x || 0;
                    if (savedX !== undefined) {
                      return savedX < loopX ? loopX + savedX : savedX;
                    }
                    return (
                      loopX +
                      (childDef.type === NodeTypeEnum.LoopStart
                        ? LOOP_START_NODE_X_OFFSET
                        : childDef.type === NodeTypeEnum.LoopEnd
                        ? LOOP_END_NODE_X_OFFSET
                        : 0)
                    );
                  })(),
                  // Y 位置：优先使用保存的位置，否则保持在循环节点内部
                  y: (() => {
                    const savedY = childDef.nodeConfig?.extension?.y;
                    const loopY = loopPosition?.y || 0;
                    if (savedY !== undefined) {
                      return savedY < loopY ? loopY + savedY : savedY;
                    }
                    return loopY + LOOP_INNER_NODE_Y_OFFSET;
                  })(),
                },
              },
            };
            const child = createChildNode(data.id, adjustedChildDef); // 创建子节点配置
            const childNode = graphRef.current.addNode(child); // 添加子节点到图中
            // 更新父节点的子节点列表（如果必要）
            element.addChild(childNode);
          });
        });
      }
      return loopNodeList;
    };

    const batchAddEdges = (edgeList: Edge[]) => {
      // 4. 创建边（验证节点存在性以防止 X6 报错）
      const edges = edgeList
        .map((edge: Edge) => {
          const sourceId = edge.source.split('-')[0];
          const targetId = edge.target.split('-')[0];

          const sourceCell = graphRef.current.getCellById(sourceId);
          const targetCell = graphRef.current.getCellById(targetId);

          if (!sourceCell || !targetCell) {
            workflowLogger.warn(
              `[GraphContainer] 边的源节点(${sourceId})或目标节点(${targetId})不存在，跳过创建边`,
            );
            return null;
          }

          return createEdge(edge);
        })
        .filter(Boolean);

      // 5. 批量添加边
      graphRef.current.addEdges(edges);

      updateEdgeArrows(graphRef.current);
    };

    const _doAddNode = (e: GraphRect, child: ChildNode) => {
      // 判断坐标是否需要转换：
      // - 如果坐标是通过拖拽事件（clientX/clientY）获取的，需要 clientToGraph 转换
      // - 如果坐标是通过 getGraphArea 计算的视口中心，则已经是图坐标，不需要转换
      // 更可靠的方式是检查坐标是否在画布容器的客户端范围内
      const container = graphRef.current.container;
      const containerRect = container?.getBoundingClientRect();
      const isClientCoordinate =
        containerRect &&
        e.x >= containerRect.left &&
        e.x <= containerRect.right &&
        e.y >= containerRect.top &&
        e.y <= containerRect.bottom;

      const point = isClientCoordinate
        ? graphRef.current.clientToGraph(e.x, e.y)
        : { x: e.x, y: e.y }; // 已经是图坐标，直接使用

      const { width, height } = getWidthAndHeight(child);

      // 如果坐标是视口中心（非客户端坐标），需要将节点中心对齐到该点
      // 即节点位置 = 中心点 - 节点宽高的一半
      const nodeX = isClientCoordinate ? point.x : point.x - width / 2;
      const nodeY = isClientCoordinate ? point.y : point.y - height / 2;

      // 根据情况，动态给予右侧的out连接桩
      const newNode = graphRef.current.addNode({
        shape: child.shape,
        id: child.id,
        x: nodeX,
        y: nodeY,
        width: width,
        height: height,
        data: {
          ...child,
        },
        resizable: true,
        zIndex: 99,
        ports: generatePorts(child),
      });
      // 添加节点 (注释掉，因为上面的 addNode 已经添加了)
      // graphRef.current.addNode(newNode);
      if (child.loopNodeId) {
        // 获取刚刚添加的子节点的实例，并设置父子关系
        const childNodeInstance = graphRef.current.getCellById(newNode.id);
        // 直接在graph实例中添加子节点并设置父子关系
        // 注意：loopNodeId 可能是数字，而 X6 的 getCellById 需要字符串
        const parentNode = graphRef.current.getCellById(
          String(child.loopNodeId),
        );
        if (parentNode) {
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
          changeCondition({ nodeData: _params });
        } else {
          workflowLogger.warn(
            '[GraphContainer] 找不到父循环节点，无法建立父子关系',
          );
        }
      }
    };

    // 新增节点
    const graphAddNode: GraphContainerRef['graphAddNode'] = (
      e: GraphRect,
      child: ChildNode,
    ) => {
      if (!graphRef.current) return;
      _doAddNode(e, child);
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
    const graphUpdateNode = (nodeId: string, newData: ChildNode | null) => {
      if (!graphRef.current || !newData) return;
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
        if (needUpdateNodes(newData)) {
          // 需要更新端口配置的节点
          const newPorts = generatePorts(newData);
          if (
            newData.type === NodeTypeEnum.QA ||
            newData.type === NodeTypeEnum.Condition
          ) {
            // 问答节点
            const { width, height } = getNodeSize({
              data: newData,
              ports: newPorts.items,
              type: NodeSizeGetTypeEnum.update,
            });
            node.setSize(width, height);
          }
          node.prop('ports', newPorts);
        }

        node.updateData(newData);
      }
    };
    // 修改节点通过表单数据
    const graphUpdateByFormData = (
      changedValues: any,
      fullFormValues: any,
      nodeId: string,
    ) => {
      if (!graphRef.current) return;
      const cell = graphRef.current.getCellById(nodeId);
      if (!cell || !cell.isNode()) return;
      const oldNodeData = cell.getData() as ChildNode;
      if (!oldNodeData) {
        return;
      }

      const { nodeConfig, ...rest } = oldNodeData;
      const fullChangedValues = Object.keys(changedValues).reduce(
        (acc: Record<string, any>, key) => {
          if (typeof key === 'string' && key) {
            acc[key] = fullFormValues[key];
          }
          return acc;
        },
        {} as Record<string, any>,
      );

      // 分离 top-level 属性和 nodeConfig 属性
      const topLevelChanges: Record<string, any> = {};
      const configChanges: Record<string, any> = {};

      Object.keys(fullChangedValues).forEach((key) => {
        if (key in rest) {
          topLevelChanges[key] = fullChangedValues[key];
        } else {
          configChanges[key] = fullChangedValues[key];
        }
      });

      // Special case: Loop node properties are top-level but might not be in 'rest' if they were optional/missing initially
      // We should explicitly check for known top-level properties for Loop nodes
      if (oldNodeData.type === 'Loop') {
        const loopTopLevelProps = [
          'loopType',
          'loopTimes',
          'inputArgs',
          'outputArgs',
          'variableArgs',
          'exceptionHandleConfig',
        ];
        loopTopLevelProps.forEach((prop) => {
          if (prop in fullChangedValues) {
            topLevelChanges[prop] = fullChangedValues[prop];
            delete configChanges[prop];
          }
        });
      }

      graphUpdateNode(nodeId, {
        ...rest,
        ...topLevelChanges,
        nodeConfig: mergeObject(
          cloneDeep(nodeConfig),
          configChanges,
        ) as NodeConfig,
      });

      //如果节点是循环节点，则需要调整父节点大小
      const loopNodeId = rest.loopNodeId;
      if (loopNodeId) {
        const parentNode = graphRef.current.getCellById(loopNodeId.toString());
        if (parentNode) {
          adjustParentSize(parentNode); // 初始调整父节点大小
        }
      }
    };

    // 删除节点
    const graphDeleteNode = (nodeId: string, node?: ChildNode) => {
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
    const graphDeleteEdge = (id: string) => {
      if (!graphRef.current) return;
      // 先更新sourceNode的nextNodeIds
      const edge = graphRef.current.getCellById(id);
      if (edge && edge.isEdge()) {
        const sourceNode = edge.getSourceNode();
        if (sourceNode) {
          const nextNodeIds = sourceNode.getData().nextNodeIds;
          if (nextNodeIds) {
            sourceNode.updateData({
              nextNodeIds: nextNodeIds.filter(
                (item: number) => item !== Number(edge.getTargetNode().id),
              ),
            });
          }
        }
      }
      graphRef.current.removeCell(id);
    };

    // 创建边
    const graphCreateNewEdge = (
      source: string,
      target: string,
      isLoop?: boolean,
    ) => {
      // 验证源节点和目标节点是否存在
      const sourceId = source.split('-')[0];
      const targetId = target.split('-')[0];

      if (
        !graphRef.current.getCellById(sourceId) ||
        !graphRef.current.getCellById(targetId)
      ) {
        workflowLogger.warn(
          `[GraphContainer] 无法创建边：源节点(${sourceId})或目标节点(${targetId})在画布中未找到`,
        );
        return;
      }

      // graphRef.current.addEdge({source,target})
      const edge = createEdge({ source, target, zIndex: isLoop ? 25 : 1 });

      if (!graphRef.current) return;
      graphRef.current.addEdge(edge);
    };

    // 选中节点 切换节点
    const graphSelectNode = (id: string) => {
      const node = graphRef.current.getCellById(id);
      if (!node || !graphRef.current) return;
      node.updateData({
        isFocus: false,
      });
      // 清除其他的节点选中
      graphRef.current.cleanSelection();
      const cells = graphRef.current.getSelectedCells();
      graphRef.current.unselect(cells);
      // 设置当前节点为选中状态
      graphRef.current.select(node);
    };

    // 激活节点
    const graphActiveNodeRunResult = (id: string, runResult: RunResultItem) => {
      const node = graphRef.current.getCellById(id);
      if (!node || !graphRef.current) return;
      const beforeData = node.getData();
      // 如果是循环执行目前只会有串行 后续如果有并行需要考虑
      node.updateData({
        isFocus: true,
        runResults: [
          ...(beforeData.runResults || []).filter(
            (item: RunResultItem) =>
              item.status !== RunResultStatusEnum.EXECUTING,
          ),
          runResult,
        ],
      });
      graphRef.current.select(node);
    };

    const graphResetRunResult = () => {
      if (!graphRef.current) return;
      const nodes = graphRef.current.getNodes();
      nodes.forEach((node: Node) => {
        node.updateData({
          runResults: [],
        });
      });
    };

    const graphTriggerBlankClick = () => {
      if (!graphRef.current) return;
      graphRef.current.trigger('blank:click');
    };

    // 保存所有节点的位置
    // const graphSaveAllNodes = () => {
    //   const nodes = graphRef.current.getNodes().map((node: Node) => {
    //     const data = node.getData() as ChildNode;
    //     const position = node.getPosition();
    //     if (position) {
    //       data.nodeConfig.extension = {
    //         ...data.nodeConfig.extension,
    //         x: position.x,
    //         y: position.y,
    //       };
    //     }
    //     return data;
    //   });
    //   return nodes;
    // };

    // 改变画布缩放比例
    const graphChangeZoom = (val: number) => {
      if (!graphRef.current) return;
      graphRef.current.zoomTo(Number(val));
    };

    // 缩放适配
    const graphChangeZoomToFit = () => {
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
        // 设置初始化标志为 true，阻止所有历史记录
        setGraphInitializing(true);

        // 清空历史记录
        graphRef.current.cleanHistory?.();

        // 清除现有元素，防止重复渲染
        graphRef.current.clearCells();

        const notLoopChildrenNodes = graphParams.nodeList.filter(
          (item) => !item.loopNodeId,
        );

        // 创建主节点
        const mainNodes = notLoopChildrenNodes.map((node) =>
          createBaseNode(node),
        );
        graphRef.current.fromJSON({
          nodes: mainNodes, // X6 会自动实例化节点
        });
        // 找出循环节点 子节点如果有就添加
        addLoopChildNode((node) => {
          return node.type === NodeTypeEnum.Loop;
        });

        // 批量添加边
        batchAddEdges(graphParams.edgeList);

        // 用于跟踪是否已完成初始化
        let initCompleted = false;
        const completeInit = () => {
          if (initCompleted) return;
          initCompleted = true;
          graphChangeZoomToFit();

          // 延迟关闭初始化标志，确保所有异步操作完成
          // 这里用 setTimeout 确保 React 渲染和 X6 内部异步操作都完成
          setTimeout(() => {
            // 清空可能在异步操作中积累的历史记录
            graphRef.current?.cleanHistory?.();
            // 关闭初始化标志，开始记录用户操作
            setGraphInitializing(false);
            onInit();
          }, 100);
        };

        // 添加zoomToFit调用，确保在绘制完成后自动调整视图
        graphRef.current.once('render:done', () => {
          setTimeout(completeInit, 50);
        });

        // 备用方案：如果 render:done 没有在 800ms 内触发，强制完成初始化
        setTimeout(() => {
          if (!initCompleted) {
            workflowLogger.warn(
              '[GraphContainer] render:done not fired, forcing init complete',
            );
            completeInit();
          }
        }, 800);
      }
    };

    // 获取当前可视区域的x，y，width，height（返回图坐标系，与 V1 保持一致）
    const getCurrentViewPort = () => {
      if (!graphRef.current) return { x: 0, y: 0, width: 0, height: 0 };
      // 使用 getGraphArea 获取图坐标系的可视区域，与 V1 保持一致
      const viewport = graphRef.current.getGraphArea();
      return {
        x: viewport.x as number,
        y: viewport.y as number,
        width: viewport.width as number,
        height: viewport.height as number,
      };
    };
    const getGraphRef = (): Graph => {
      return graphRef.current;
    };
    // 将子组件的方法暴露给父组件
    useImperativeHandle(ref, () => ({
      getCurrentViewPort,
      graphAddNode,
      graphUpdateNode,
      graphUpdateByFormData,
      // graphSaveAllNodes,
      graphDeleteNode,
      graphDeleteEdge,
      graphChangeZoom,
      graphChangeZoomToFit,
      drawGraph,
      graphSelectNode,
      graphCreateNewEdge,
      getGraphRef,
      graphTriggerBlankClick,
      graphActiveNodeRunResult,
      graphResetRunResult,
    }));

    const changeNodeConfigWithRefresh = useCallback(
      async (config: ChangeNodeProps) => {
        const result = await changeCondition(config);
        if (!result) {
          onRefresh();
        }
        return result;
      },
      [changeCondition, onRefresh],
    );
    const changeEdgeConfigWithRefresh = useCallback(
      async (config: ChangeEdgeProps) => {
        const result = await changeEdge(config);
        if (!result) {
          onRefresh();
        }
        return result;
      },
      [changeEdge, onRefresh],
    );

    useEffect(() => {
      if (!containerRef.current) return;
      preWork();
      graphRef.current = InitGraph({
        containerId: GRAPH_CONTAINER_ID,
        changeDrawer: changeDrawer,
        changeCondition,
        changeNodeConfigWithRefresh,
        changeEdgeConfigWithRefresh,
        changeZoom: changeZoom,
        createNodeByPortOrEdge,
        onSaveNode: onSaveNode,
        onClickBlank: onClickBlank,
      });

      const cleanup = EventHandlers({
        graph: graphRef.current,
        changeEdgeConfigWithRefresh,
        copyNode,
        changeNodeConfigWithRefresh,
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
      if (graphParams.nodeList.length === 0) {
        // 如果节点列表为空，则重置初始化状态
        hasInitialized.current = false;
      }
    }, [graphParams.nodeList]);

    useEffect(() => {
      if (graphParams.nodeList.length > 0) {
        drawGraph();
        hasInitialized.current = true;
      }
    }, [graphParams]);

    useEffect(() => {
      workflowLogger.log('[GraphContainer] MOUNTED');
      return () => {
        workflowLogger.log('[GraphContainer] UNMOUNTED');
      };
    }, []);

    return <div ref={containerRef} id={GRAPH_CONTAINER_ID} />;
  },
);

export default GraphContainer;
