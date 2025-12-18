/**
 * useNodeOperations - 节点操作相关逻辑
 *
 * 从 indexV3.tsx 提取，负责管理节点的增删改操作
 */

import { message } from 'antd';
import { useCallback } from 'react';

import Constant from '@/constants/codes.constants';
import * as service from '@/services/workflow';
import { AddNodeResponse } from '@/services/workflow';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { NodeShapeEnum, NodeTypeEnum } from '@/types/enums/common';
import {
  NodeSizeGetTypeEnum,
  PortGroupEnum,
  UpdateEdgeType,
} from '@/types/enums/node';
import { CreatedNodeItem } from '@/types/interfaces/common';
import {
  ChildNode,
  CurrentNodeRefProps,
  GraphContainerRef,
  GraphRect,
  StencilChildNode,
} from '@/types/interfaces/graph';

import {
  LOOP_NODE_DEFAULT_HEIGHT,
  LOOP_NODE_DEFAULT_WIDTH,
} from '../constants/loopNodeConstants';
import { workflowProxy } from '../services/workflowProxyV3';
import { generateFallbackNodeId } from '../utils/nodeUtils';
import {
  createOfflineNode,
  ensureNodeShape,
} from '../utils/offlineNodeFactory';
import {
  getNodeSize,
  getShape,
  handleExceptionNodesNextIndex,
  handleSpecialNodesNextIndex,
  QuicklyCreateEdgeConditionConfig,
} from '../utils/workflowV3';

// 辅助函数：获取坐标
const getCoordinates = (
  position: React.DragEvent<HTMLDivElement> | GraphRect | undefined,
  viewGraph: any,
  continueDragCount?: number,
): GraphRect => {
  if (!position) {
    return {
      x: (viewGraph?.x || 0) + (continueDragCount || 0) * 20,
      y: (viewGraph?.y || 0) + (continueDragCount || 0) * 20,
    };
  }
  if ('clientX' in position) {
    return { x: position.clientX, y: position.clientY };
  }
  return position;
};

// noop 函数
const noop = () => {};

interface UseNodeOperationsParams {
  workflowId: number;
  graphRef: React.RefObject<GraphContainerRef | null>;
  currentNodeRef: React.MutableRefObject<CurrentNodeRefProps | null>;
  foldWrapItem: ChildNode;
  setFoldWrapItem: (val: ChildNode) => void;
  setVisible: (val: boolean) => void;
  setOpen: (val: boolean) => void;
  setCreatedItem: (val: AgentComponentTypeEnum) => void;
  setDragEvent: (val: { x: number; y: number }) => void;
  dragEvent: { x: number; y: number };
  preventGetReference: React.MutableRefObject<number>;
  timerRef: React.MutableRefObject<NodeJS.Timeout | undefined>;
  changeUpdateTime: () => void;
  debouncedSaveFullWorkflow: () => void;
  changeDrawer: (val: any) => void;
  getNodeConfig: (id: number) => void;
  getReference: (id: number) => Promise<boolean>;
  getWorkflow: (key: string) => any;
  changeNode: (
    params: { nodeData: any },
    callback?: () => void,
  ) => Promise<boolean>;
  nodeChangeEdge: (
    params: any,
    callback?: () => void,
  ) => Promise<number[] | null>;
}

interface UseNodeOperationsReturn {
  // 辅助函数
  isConditionalNode: (nodeType: string) => boolean;
  handleSpecialPortConnection: (params: any) => Promise<void>;
  handleExceptionPortConnection: (params: any) => Promise<void>;
  handleOutputPortConnection: (params: any) => Promise<void>;
  handleConditionalNodeConnection: (params: any) => Promise<void>;
  handleNormalNodeConnection: (params: any) => Promise<void>;
  handleInputPortConnection: (params: any) => Promise<void>;
  handleTargetNodeConnection: (params: {
    newNode: ChildNode;
    targetNode: ChildNode;
    sourceNode: ChildNode;
    edgeId: string;
    isLoop: boolean;
  }) => Promise<void>;
  handleNodeCreationSuccess: (nodeData: AddNodeResponse) => Promise<void>;
  // 核心操作
  addNode: (child: Partial<ChildNode>, dragEvent: GraphRect) => Promise<void>;
  copyNode: (
    child: ChildNode,
    offset?: { x: number; y: number },
  ) => Promise<void>;
  deleteNode: (id: number | string, node?: ChildNode) => Promise<void>;
  onAdded: (val: CreatedNodeItem, parentFC?: string) => void;
  dragChild: (
    child: StencilChildNode,
    position?: React.DragEvent<HTMLDivElement> | GraphRect,
    continueDragCount?: number,
  ) => Promise<void>;
}

export const useNodeOperations = ({
  workflowId,
  graphRef,
  currentNodeRef,
  foldWrapItem,
  setFoldWrapItem,
  setVisible,
  setOpen,
  setCreatedItem,
  setDragEvent,
  dragEvent,
  preventGetReference,
  timerRef,
  changeUpdateTime,
  debouncedSaveFullWorkflow,
  changeDrawer,
  getNodeConfig,
  getReference,
  getWorkflow,
  changeNode,
  nodeChangeEdge,
}: UseNodeOperationsParams): UseNodeOperationsReturn => {
  /**
   * 检查节点类型是否为条件分支或意图识别节点
   */
  const isConditionalNode = useCallback((nodeType: string): boolean => {
    return [
      NodeTypeEnum.Condition,
      NodeTypeEnum.IntentRecognition,
      NodeTypeEnum.QA,
    ].includes(nodeType as NodeTypeEnum);
  }, []);

  /**
   * 处理特殊端口连接（长端口ID）
   */
  const handleSpecialPortConnection = useCallback(
    async ({
      sourceNode,
      portId,
      newNodeId,
      targetNode,
      isLoop,
    }: {
      sourceNode: ChildNode;
      portId: string;
      newNodeId: number;
      targetNode: ChildNode | undefined;
      isLoop: boolean;
    }) => {
      const params = handleSpecialNodesNextIndex(
        sourceNode,
        portId,
        newNodeId,
        targetNode,
      );
      const isSuccess = await changeNode({ nodeData: params }, noop);
      if (isSuccess) {
        const sourcePortId = portId.split('-').slice(0, -1).join('-');
        graphRef.current?.graphCreateNewEdge(
          sourcePortId,
          String(newNodeId),
          isLoop,
        );
      }
    },
    [changeNode, graphRef],
  );

  /**
   * 处理异常端口连接
   */
  const handleExceptionPortConnection = useCallback(
    async ({
      sourceNode,
      portId,
      newNodeId,
      targetNode,
      isLoop,
    }: {
      sourceNode: ChildNode;
      portId: string;
      newNodeId: number;
      targetNode: ChildNode | undefined;
      isLoop: boolean;
    }) => {
      const params = handleExceptionNodesNextIndex({
        sourceNode,
        id: newNodeId,
        targetNodeId: targetNode?.id,
      });
      const isSuccess = await changeNode({ nodeData: params }, noop);
      if (isSuccess) {
        const sourcePortId = portId.split('-').slice(0, -1).join('-');
        graphRef.current?.graphCreateNewEdge(
          sourcePortId,
          String(newNodeId),
          isLoop,
        );
      }
    },
    [changeNode, graphRef],
  );

  /**
   * 处理输出端口连接
   */
  const handleOutputPortConnection = useCallback(
    async ({
      newNodeId,
      sourceNode,
      isLoop,
    }: {
      newNodeId: number;
      sourceNode: ChildNode;
      isLoop: boolean;
    }) => {
      const newNodeIds = await nodeChangeEdge(
        {
          type: UpdateEdgeType.created,
          targetId: newNodeId.toString(),
          sourceNode,
        },
        noop,
      );
      if (newNodeIds) {
        graphRef.current?.graphCreateNewEdge(
          String(sourceNode.id),
          String(newNodeId),
          isLoop,
        );
      }
    },
    [nodeChangeEdge, graphRef],
  );

  /**
   * 处理条件分支节点连接
   */
  const handleConditionalNodeConnection = useCallback(
    async ({
      newNode,
      targetNode,
      isLoop,
    }: {
      newNode: ChildNode;
      targetNode: ChildNode;
      isLoop: boolean;
    }) => {
      const { nodeData, sourcePortId } = QuicklyCreateEdgeConditionConfig(
        newNode,
        targetNode,
      );
      const isSuccess = await changeNode({ nodeData: nodeData }, noop);
      if (isSuccess) {
        graphRef.current?.graphCreateNewEdge(
          sourcePortId,
          String(targetNode.id),
          isLoop,
        );
      }
    },
    [changeNode, graphRef],
  );

  /**
   * 处理普通节点连接
   */
  const handleNormalNodeConnection = useCallback(
    async ({
      newNodeId,
      targetNodeId,
      newNode,
      isLoop,
    }: {
      newNodeId: number;
      targetNodeId: string;
      newNode: ChildNode;
      isLoop: boolean;
    }) => {
      const newNodeIds = await nodeChangeEdge(
        {
          type: UpdateEdgeType.created,
          targetId: targetNodeId,
          sourceNode: newNode,
        },
        noop,
      );
      if (newNodeIds) {
        graphRef.current?.graphCreateNewEdge(
          String(newNodeId),
          targetNodeId,
          isLoop,
        );
      }
    },
    [nodeChangeEdge, graphRef],
  );

  /**
   * 处理输入端口连接
   */
  const handleInputPortConnection = useCallback(
    async ({
      newNode,
      sourceNode,
      portId,
      isLoop,
    }: {
      newNode: ChildNode;
      sourceNode: ChildNode;
      portId: string;
      isLoop: boolean;
    }) => {
      const id = portId.split('-')[0];

      if (isConditionalNode(newNode.type)) {
        const { nodeData, sourcePortId } = QuicklyCreateEdgeConditionConfig(
          newNode,
          sourceNode,
        );
        const isSuccess = await changeNode({ nodeData: nodeData }, noop);
        if (isSuccess) {
          graphRef.current?.graphCreateNewEdge(
            sourcePortId,
            sourceNode.id.toString(),
            isLoop,
          );
        }
      } else {
        const newNodeIds = await nodeChangeEdge(
          {
            type: UpdateEdgeType.created,
            targetId: id,
            sourceNode: newNode,
          },
          noop,
        );
        if (newNodeIds) {
          graphRef.current?.graphCreateNewEdge(
            newNode.id.toString(),
            id.toString(),
            isLoop,
          );
        }
      }
    },
    [isConditionalNode, changeNode, nodeChangeEdge, graphRef],
  );

  /**
   * 处理目标节点连接
   */
  const handleTargetNodeConnection = useCallback(
    async ({
      newNode,
      targetNode,
      sourceNode,
      edgeId,
      isLoop,
    }: {
      newNode: ChildNode;
      targetNode: ChildNode;
      sourceNode: ChildNode;
      edgeId: string;
      isLoop: boolean;
    }) => {
      // 建立新边：newNode -> targetNode
      if (isConditionalNode(newNode.type)) {
        await handleConditionalNodeConnection({
          newNode,
          targetNode,
          isLoop,
        });
      } else {
        await handleNormalNodeConnection({
          newNodeId: newNode.id as number,
          targetNodeId: String(targetNode.id),
          newNode,
          isLoop,
        });
      }

      // V3: 删除原有连接关系 (同步数据模型)
      // 参考 V1 连线规则：在快捷插入节点时，需要删除原 sourceNode -> targetNode 的关系
      const newNodeIds = await nodeChangeEdge(
        {
          type: UpdateEdgeType.deleted,
          targetId: targetNode.id.toString(),
          sourceNode,
        },
        noop,
      );

      // 如果数据删除成功，则同步删除画布上的边
      if (newNodeIds) {
        graphRef.current?.graphDeleteEdge(edgeId);
      }
    },
    [
      graphRef,
      isConditionalNode,
      handleConditionalNodeConnection,
      handleNormalNodeConnection,
      nodeChangeEdge,
    ],
  );

  /**
   * 处理节点创建成功后的所有操作
   */
  const handleNodeCreationSuccess = useCallback(
    async (nodeData: AddNodeResponse) => {
      // 添加节点到画布
      graphRef.current?.graphAddNode(
        nodeData.nodeConfig.extension as GraphRect,
        nodeData as unknown as ChildNode,
      );

      // 选中新增的节点
      graphRef.current?.graphSelectNode(String(nodeData.id));

      // 处理连接桩或边创建的节点
      if (currentNodeRef.current) {
        const { portId, edgeId, sourceNode, targetNode } =
          currentNodeRef.current as any;
        // V3: isLoop 应该基于新创建节点的 loopNodeId（和 V1 保持一致）
        const isLoop = Boolean(nodeData.loopNodeId);
        const newNodeData = nodeData as unknown as ChildNode;

        // V3: 通过 portId 动态计算端口类型（和 V1 保持一致）
        const isOut = portId.endsWith('out');
        const isException = portId.includes(PortGroupEnum.exception);
        const isSpecial = !isException && portId.length > 15;

        try {
          if (isException) {
            // 处理异常端口连接
            await handleExceptionPortConnection({
              sourceNode,
              portId,
              newNodeId: nodeData.id,
              targetNode,
              isLoop,
            });
          } else if (isSpecial) {
            // 处理特殊端口连接（条件分支、意图识别等）
            await handleSpecialPortConnection({
              sourceNode,
              portId,
              newNodeId: nodeData.id,
              targetNode,
              isLoop,
            });
          } else if (isOut) {
            // 处理输出端口连接
            await handleOutputPortConnection({
              newNodeId: nodeData.id,
              sourceNode,
              isLoop,
            });
          } else {
            // 处理输入端口连接
            await handleInputPortConnection({
              newNode: newNodeData,
              sourceNode,
              portId,
              isLoop,
            });
          }

          // 处理目标节点连接（在边上快捷添加节点时）
          if (targetNode) {
            await handleTargetNodeConnection({
              newNode: newNodeData,
              targetNode,
              sourceNode,
              edgeId: edgeId!,
              isLoop,
            });
          }

          await getReference(getWorkflow('drawerForm').id);
        } catch (error) {
          console.error('处理节点连接时发生错误:', error);
          throw error;
        } finally {
          currentNodeRef.current = null;
        }
      }
    },
    [
      graphRef,
      currentNodeRef,
      handleSpecialPortConnection,
      handleExceptionPortConnection,
      handleOutputPortConnection,
      handleInputPortConnection,
      handleTargetNodeConnection,
      getReference,
      getWorkflow,
    ],
  );

  /**
   * 新增节点
   */
  const addNode = useCallback(
    async (child: Partial<ChildNode>, dragEventPos: GraphRect) => {
      let _params = JSON.parse(JSON.stringify(child));
      _params.workflowId = workflowId;
      _params.extension = dragEventPos;

      const { width, height } = getNodeSize({
        data: _params,
        ports: [],
        type: NodeSizeGetTypeEnum.create,
      });

      const fixedSizeNodeTypes = [
        NodeTypeEnum.Condition,
        NodeTypeEnum.QA,
        NodeTypeEnum.IntentRecognition,
        NodeTypeEnum.Loop,
      ];

      if (child.type && fixedSizeNodeTypes.includes(child.type)) {
        const nodeWidth =
          child.type === NodeTypeEnum.Loop ? LOOP_NODE_DEFAULT_WIDTH : width;
        const nodeHeight =
          child.type === NodeTypeEnum.Loop ? LOOP_NODE_DEFAULT_HEIGHT : height;
        _params.extension = {
          ...dragEventPos,
          height: nodeHeight,
          width: nodeWidth,
        };
      }

      if (foldWrapItem.type === NodeTypeEnum.Loop || foldWrapItem.loopNodeId) {
        if (_params.type === NodeTypeEnum.Loop) {
          message.warning('循环体里请不要再添加循环体');
          return;
        }
        _params.loopNodeId =
          Number(foldWrapItem.loopNodeId) || Number(foldWrapItem.id);

        const loopNode = workflowProxy.getNodeById(_params.loopNodeId);
        if (loopNode) {
          const extension = loopNode.nodeConfig.extension;
          _params.extension = {
            ..._params.extension,
            x: (extension?.x || 0) + 40,
            y: (extension?.y || 0) + 110,
          };
        }
      }

      if (currentNodeRef.current) {
        const { sourceNode, portId } = currentNodeRef.current;
        if (sourceNode.loopNodeId) {
          // 源节点是循环内的子节点，新节点继承其 loopNodeId
          _params.loopNodeId = sourceNode.loopNodeId;
        } else if (
          sourceNode.type === NodeTypeEnum.Loop &&
          portId &&
          portId.includes('in')
        ) {
          // 从循环节点的 in 端口创建节点，新节点应该在循环内部
          _params.loopNodeId = Number(sourceNode.id);
        }
      }

      if (!_params.nodeConfig) {
        _params.nodeConfig = { extension: _params.extension };
      } else if (!_params.extension) {
        _params.extension = _params.nodeConfig.extension;
      }

      let nodeId: number;
      let apiNodeData: AddNodeResponse | null = null;

      try {
        const nodeConfigDto =
          _params.nodeConfigDto || _params.nodeConfig
            ? {
                ..._params.nodeConfigDto,
                ...(_params.nodeConfig?.toolName
                  ? { toolName: _params.nodeConfig.toolName }
                  : {}),
                ...(_params.nodeConfig?.mcpId
                  ? { mcpId: _params.nodeConfig.mcpId }
                  : {}),
                ...(_params.nodeConfig?.knowledgeBaseConfigs
                  ? {
                      knowledgeBaseConfigs:
                        _params.nodeConfig.knowledgeBaseConfigs,
                    }
                  : {}),
              }
            : undefined;

        const apiRes = await service.apiAddNode({
          workflowId: workflowId,
          type: _params.type,
          typeId: _params.typeId,
          name: _params.name,
          shape: _params.shape,
          description: _params.description,
          loopNodeId: _params.loopNodeId,
          extension: _params.extension,
          nodeConfigDto: nodeConfigDto,
        });

        if (apiRes.code === Constant.success && apiRes.data) {
          nodeId = apiRes.data.id;
          apiNodeData = apiRes.data;
          console.log('[V3] 添加节点 API 成功, nodeId:', nodeId);
        } else {
          // 离线模式：完全由前端生成节点数据
          nodeId = generateFallbackNodeId(workflowId);
          apiNodeData = ensureNodeShape(
            createOfflineNode(nodeId, _params, workflowId),
          );
          console.warn(
            '[V3] 添加节点 API 失败，进入离线模式:',
            nodeId,
            apiRes.message,
          );
        }
      } catch (error) {
        // 网络异常：进入离线模式
        nodeId = generateFallbackNodeId(workflowId);
        apiNodeData = ensureNodeShape(
          createOfflineNode(nodeId, _params, workflowId),
        );
        console.warn('[V3] 添加节点 API 异常，进入离线模式:', nodeId, error);
      }

      _params.id = nodeId;

      if (apiNodeData) {
        _params = {
          ..._params,
          ...apiNodeData,
          nodeConfig: {
            ...apiNodeData.nodeConfig,
            extension: _params.extension,
          },
        };

        if (_params.type === NodeTypeEnum.Loop) {
          _params.nodeConfig.extension = {
            ..._params.nodeConfig.extension,
            width: LOOP_NODE_DEFAULT_WIDTH,
            height: LOOP_NODE_DEFAULT_HEIGHT,
          };
          if (apiNodeData.innerNodes && apiNodeData.innerNodes.length > 0) {
            _params.innerNodes = apiNodeData.innerNodes.map(
              (innerNode: ChildNode) => {
                if (
                  innerNode.type === NodeTypeEnum.LoopStart ||
                  innerNode.type === NodeTypeEnum.LoopEnd
                ) {
                  return {
                    ...innerNode,
                    nodeConfig: {
                      ...innerNode.nodeConfig,
                      extension: {
                        ...innerNode.nodeConfig?.extension,
                        x: undefined,
                        y: undefined,
                      },
                    },
                  };
                }
                return innerNode;
              },
            );
          }
        }
      }

      const proxyResult = workflowProxy.addNode(_params as ChildNode);

      if (proxyResult.success) {
        try {
          await handleNodeCreationSuccess(_params as AddNodeResponse);
          debouncedSaveFullWorkflow();
        } catch (error) {
          console.error('处理节点创建成功后的操作失败:', error);
        }
      } else {
        message.error(proxyResult.message || '添加节点失败');
      }
    },
    [
      workflowId,
      foldWrapItem,
      currentNodeRef,
      handleNodeCreationSuccess,
      debouncedSaveFullWorkflow,
    ],
  );

  /**
   * 复制节点
   */
  const copyNode = useCallback(
    async (child: ChildNode, offset?: { x: number; y: number }) => {
      const res = workflowProxy.copyNode(Number(child.id), offset);
      if (res.success && res.newNode) {
        const newNode = res.newNode;

        if (!newNode.shape) {
          newNode.shape = getShape(newNode.type);
        }

        graphRef.current?.graphAddNode(
          newNode.nodeConfig.extension as GraphRect,
          newNode,
        );

        graphRef.current?.graphSelectNode(String(newNode.id));
        changeUpdateTime();
        debouncedSaveFullWorkflow();
      } else {
        message.error(res.message || '复制失败');
      }
    },
    [graphRef, changeUpdateTime, debouncedSaveFullWorkflow],
  );

  /**
   * 删除指定的节点
   */
  const deleteNode = useCallback(
    async (id: number | string, node?: ChildNode) => {
      setVisible(false);
      preventGetReference.current = Number(id);
      setFoldWrapItem({
        id: 0,
        description: '',
        shape: NodeShapeEnum.General,
        workflowId: workflowId,
        type: NodeTypeEnum.Start,
        nodeConfig: {},
        name: '',
        icon: '',
      } as ChildNode);

      const res = workflowProxy.deleteNode(Number(id));
      if (res.success) {
        const graph = graphRef.current?.getGraphRef();

        if (graph) {
          graph.batchUpdate('delete-node', () => {
            graphRef.current?.graphDeleteNode(String(id));

            if (res.data) {
              res.data.nodes.forEach((n) => {
                const cell = graph.getCellById(String(n.id));
                if (cell && cell.isNode()) {
                  const currentData = cell.getData();
                  if (
                    JSON.stringify(currentData.nextNodeIds) !==
                    JSON.stringify(n.nextNodeIds)
                  ) {
                    cell.setData({ nextNodeIds: n.nextNodeIds });
                  }
                }
              });
            }
          });
        }

        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        changeUpdateTime();
        debouncedSaveFullWorkflow();
        if (node) {
          if (node.type === 'Loop') {
            changeDrawer(null);
          } else {
            getNodeConfig(node.loopNodeId as number);
          }
        }
      } else {
        message.error(res.message || '删除失败');
      }
    },
    [
      workflowId,
      graphRef,
      setVisible,
      setFoldWrapItem,
      preventGetReference,
      timerRef,
      changeUpdateTime,
      debouncedSaveFullWorkflow,
      changeDrawer,
      getNodeConfig,
    ],
  );

  /**
   * 添加工作流，插件，知识库，数据库 mcp 节点
   */
  const onAdded = useCallback(
    (val: CreatedNodeItem, parentFC?: string) => {
      if (parentFC && parentFC !== 'workflow') return;
      let _child: Partial<ChildNode>;
      if (
        val.targetType === AgentComponentTypeEnum.Knowledge ||
        val.targetType === AgentComponentTypeEnum.Table
      ) {
        const knowledgeBaseConfigs = [
          {
            ...val,
            type: NodeTypeEnum.Knowledge,
            knowledgeBaseId: val.targetId,
          },
        ];
        const tableType = sessionStorage.getItem('tableType');
        _child = {
          name: val.name,
          shape: NodeShapeEnum.General,
          description: val.description,
          type:
            val.targetType === AgentComponentTypeEnum.Knowledge
              ? NodeTypeEnum.Knowledge
              : ((tableType || NodeTypeEnum.TableDataQuery) as NodeTypeEnum),
          typeId: val.targetId,
          nodeConfig: {
            knowledgeBaseConfigs: knowledgeBaseConfigs,
            extension: {},
          },
        };
      } else if (
        val.targetType === AgentComponentTypeEnum.Workflow ||
        val.targetType === AgentComponentTypeEnum.Plugin
      ) {
        const type =
          val.targetType === AgentComponentTypeEnum.Workflow
            ? NodeTypeEnum.Workflow
            : NodeTypeEnum.Plugin;
        _child = {
          name: val.name,
          shape: NodeShapeEnum.General,
          description: val.description,
          type,
          typeId: val.targetId,
        };
      } else if (val.targetType === AgentComponentTypeEnum.MCP) {
        _child = {
          name: val.name,
          shape: NodeShapeEnum.General,
          description: val.description,
          type: NodeTypeEnum.MCP,
          typeId: val.targetId,
          nodeConfig: {
            toolName: val.toolName,
            mcpId: val.targetId,
          },
        };
      } else {
        message.warning('暂不支持该类型组件');
        return;
      }

      addNode(_child, dragEvent);
      if (sessionStorage.getItem('tableType')) {
        sessionStorage.removeItem('tableType');
      }
      setOpen(false);
    },
    [addNode, dragEvent, setOpen],
  );

  /**
   * 拖拽组件到画布中
   */
  const dragChild = useCallback(
    async (
      child: StencilChildNode,
      position?: React.DragEvent<HTMLDivElement> | GraphRect,
      continueDragCount?: number,
    ) => {
      const childType = child?.type || '';

      const isSpecialType = [
        NodeTypeEnum.Plugin,
        NodeTypeEnum.Workflow,
        NodeTypeEnum.MCP,
      ].includes(childType);

      const isTableNode = [
        'TableDataAdd',
        'TableDataDelete',
        'TableDataUpdate',
        'TableDataQuery',
        'TableSQL',
      ].includes(childType);

      const viewGraph = graphRef.current?.getCurrentViewPort();
      if (isSpecialType) {
        setCreatedItem(childType as unknown as AgentComponentTypeEnum);
        setOpen(true);
        setDragEvent(getCoordinates(position, viewGraph, continueDragCount));
      } else if (isTableNode) {
        setCreatedItem(AgentComponentTypeEnum.Table);
        setOpen(true);
        setDragEvent(getCoordinates(position, viewGraph, continueDragCount));
        sessionStorage.setItem('tableType', childType);
      } else {
        const coordinates = getCoordinates(
          position,
          viewGraph,
          continueDragCount,
        );
        await addNode(child as ChildNode, coordinates);
      }
    },
    [graphRef, setCreatedItem, setOpen, setDragEvent, addNode],
  );

  return {
    isConditionalNode,
    handleSpecialPortConnection,
    handleExceptionPortConnection,
    handleOutputPortConnection,
    handleConditionalNodeConnection,
    handleNormalNodeConnection,
    handleInputPortConnection,
    handleTargetNodeConnection,
    handleNodeCreationSuccess,
    addNode,
    copyNode,
    deleteNode,
    onAdded,
    dragChild,
  };
};
