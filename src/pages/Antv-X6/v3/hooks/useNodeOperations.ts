/**
 * useNodeOperations - 节点操作相关逻辑
 *
 * 从 indexV3.tsx 提取，负责管理节点的增删改操作
 */

import { message } from 'antd';
import { useCallback } from 'react';

import Constant from '@/constants/codes.constants';
import { useFlowKind } from '@/contexts/FlowKindContext';
import { t } from '@/services/i18nRuntime';
import * as service from '@/services/workflow';
import { AddNodeResponse } from '@/services/workflow';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  FlowKindEnum,
  NodeShapeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
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

import { isAgentFlowSelectableAgent } from '../agentFlow/createdPicker';
import {
  isFrontendMappedType,
  toBackendNodeType,
} from '../agentFlow/nodeTypeMapping';
import {
  resolveAgentFlowWorkflowNodeDescription,
  resolveNodeDescriptionWithNameFallback,
} from '../agentFlow/resolveNodePresentation';
import {
  buildKnowledgeInsertNodeConfigOnAdd,
  mergeNodeConfigAfterAddApi,
  pickKnowledgeInsertBindingForAddDto,
} from '../component/knowledgeInsert';
import {
  LOOP_NODE_DEFAULT_HEIGHT,
  LOOP_NODE_DEFAULT_WIDTH,
} from '../constants/loopNodeConstants';
import { workflowProxy } from '../services/workflowProxyV3';
import { getEdges } from '../utils/graphV3';
import { clearPendingNodeCreateSession } from '../utils/nodeCreateSession';
import { createDefaultNodeConfig } from '../utils/nodeDefaultConfigFactory';
import {
  getNodeSize,
  getShape,
  handleExceptionNodesNextIndex,
  handleSpecialNodesNextIndex,
  QuicklyCreateEdgeConditionConfig,
  removeFromSpecialNodesNextIndex,
} from '../utils/workflowV3';

// 辅助函数：获取坐标
const getCoordinates = (
  position: React.DragEvent<HTMLDivElement> | GraphRect | undefined,
  viewGraph: any,
  continueDragCount?: number,
): GraphRect => {
  if (!position) {
    // 没有拖拽位置时，返回视口中心点（图坐标系）
    const _continueDragCount = continueDragCount || 0;
    return {
      x:
        (viewGraph?.x || 0) +
        (viewGraph?.width || 0) / 2 +
        _continueDragCount * 16,
      y:
        (viewGraph?.y || 0) +
        (viewGraph?.height || 0) / 2 +
        _continueDragCount * 16,
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
  /**
   * 新增节点后是否自动选中并打开右侧属性面板。
   * 默认 true（Workflow v3 行为）；AgentFlow 传 false，拖入/添加节点时仅放置到画布，
   * 不自动弹出属性面板（避免「拖动节点直接弹面板」），需用户点击节点再配置。
   */
  focusNewNode?: boolean;
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
  getWorkflow?: (key: string) => any;
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
    portId: string;
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
  focusNewNode = true,
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
  changeNode,
  nodeChangeEdge,
}: UseNodeOperationsParams): UseNodeOperationsReturn => {
  const flowKind = useFlowKind();
  const isAgentFlow = flowKind === FlowKindEnum.AgentFlow;

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
        // portId 直接传递：parseEndpoint 会根据是否含 'in'/'out' 自动处理；
        // 剥去 '-out' 再传会导致含 "route" 等子串的端口 ID 被误判，丢失 '-out' 后缀。
        graphRef.current?.graphCreateNewEdge(portId, String(newNodeId), isLoop);
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
        graphRef.current?.graphCreateNewEdge(portId, String(newNodeId), isLoop);
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

      // 如果 sourcePortId 为空，说明条件配置还未初始化，跳过连线
      if (!sourcePortId) {
        console.warn(
          '[handleConditionalNodeConnection] sourcePortId is empty, skip edge creation',
        );
        return;
      }

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
   * 处理路由决策节点作为「新建/插入节点」时的出边连接
   *
   * 适用场景：边中快捷插入 RouteDecision（A→B 变 A→RouteDecision→B）、
   * 或在某节点 in 端口上游新建 RouteDecision。
   *
   * 关键：必须连到 intentConfigs 里真实存在的路由分支端口
   * （{nodeId}-route-{uuid}-out），不能用 defaultNextNodeIds / route-default-out。
   * 原因：defaultNextNodeIds 不会被后端 IntentRecognition 持久化，刷新后丢失
   * （这正是「灰色端口连上又消失」的根因）；而 intentConfigs 端到端持久化
   * （save 由 computeConnections 从边重建、load 原样保留、表单 hydrate）。
   * 对照：IntentRecognition 走 handleConditionalNodeConnection→QuicklyCreateEdgeConditionConfig
   * 连到 intentConfigs[0] 才「没问题」，RouteDecision 须对齐同一机制。
   *
   * 与 IntentRecognition 的差异仅在端口格式：RouteDecision 端口带 route- 前缀
   * （{nodeId}-route-{uuid}-out），IntentRecognition 是 {nodeId}-{uuid}-out，
   * 故不能直接复用 QuicklyCreateEdgeConditionConfig，需自行拼端口 id。
   */
  const handleRouteDecisionOutgoingConnection = useCallback(
    async ({
      newNode,
      targetNode,
      isLoop,
    }: {
      newNode: ChildNode;
      targetNode: ChildNode;
      isLoop: boolean;
    }) => {
      // 连到首个路由分支（与 IntentRecognition 的 QuicklyCreateEdgeConditionConfig 一致）
      const firstBranch = (newNode.nodeConfig as any)?.intentConfigs?.[0];
      // createDefaultIntentConfig 保证至少一条分支；防御性判空
      if (!firstBranch?.uuid) return;

      // 写入 intentConfigs[0].nextNodeIds（持久化、刷新不丢）；端口用 RouteDecision 专属格式
      const sourcePortId = `${newNode.id}-route-${firstBranch.uuid}-out`;
      const params = handleSpecialNodesNextIndex(
        newNode,
        sourcePortId,
        targetNode.id,
      );
      const isSuccess = await changeNode({ nodeData: params }, noop);
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

      // RouteDecision 作为上游新建节点：出边走默认分支端口，避免画到不存在的
      // {nodeId}-out 端口（回转连线）并在刷新后丢失（见 handleRouteDecisionOutgoingConnection）
      if (newNode.type === NodeTypeEnum.RouteDecision) {
        await handleRouteDecisionOutgoingConnection({
          newNode,
          targetNode: sourceNode,
          isLoop,
        });
        return;
      }

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
    [
      isConditionalNode,
      changeNode,
      nodeChangeEdge,
      graphRef,
      handleRouteDecisionOutgoingConnection,
    ],
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
      portId,
    }: {
      newNode: ChildNode;
      targetNode: ChildNode;
      sourceNode: ChildNode;
      edgeId: string;
      isLoop: boolean;
      portId: string;
    }) => {
      // 建立新边：newNode -> targetNode
      // 注意：QA TEXT 模式应该作为普通节点处理，因为它只有一个普通 out 端口
      // 只有 QA SELECT 模式才有多个选项端口，需要特殊处理
      const isQaTextMode =
        newNode.type === NodeTypeEnum.QA &&
        newNode.nodeConfig?.answerType !== 'SELECT';

      // RouteDecision 作为插入节点：出边走默认分支端口，避免画到不存在的 {nodeId}-out
      // 端口（回转连线）并在刷新后丢失（见 handleRouteDecisionOutgoingConnection）
      if (newNode.type === NodeTypeEnum.RouteDecision) {
        await handleRouteDecisionOutgoingConnection({
          newNode,
          targetNode,
          isLoop,
        });
      } else if (isConditionalNode(newNode.type) && !isQaTextMode) {
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

      // 检查是否是特殊端口（QA SELECT、条件分支、意图识别）
      const portSegments = portId.split('-');
      const hasUuidSegment =
        portSegments.length >= 3 &&
        portSegments.slice(1, -1).join('-').length >= 8;
      const isSpecialPort = hasUuidSegment;

      if (isSpecialPort) {
        // 特殊端口：需要从源节点的配置中移除目标节点ID
        // 使用 handleSpecialNodesNextIndex 的反向操作
        const params = removeFromSpecialNodesNextIndex(
          sourceNode,
          portId,
          targetNode.id,
        );
        const isSuccess = await changeNode({ nodeData: params }, noop);
        if (isSuccess) {
          graphRef.current?.graphDeleteEdge(edgeId);
        }
      } else {
        // 普通端口：删除边
        // 检测是否是循环节点的内部边（Loop-in -> innerNode）
        const isLoopInPort =
          portId.endsWith('-in') && sourceNode.type === NodeTypeEnum.Loop;

        // 使用正确的 source 格式调用 deleteEdge
        const edgeSource = isLoopInPort ? portId : String(sourceNode.id);

        // 直接调用 workflowProxy.deleteEdge
        const res = workflowProxy.deleteEdge(
          edgeSource,
          targetNode.id.toString(),
        );

        if (res.success) {
          // 同步删除画布上的边
          graphRef.current?.graphDeleteEdge(edgeId);
          // 触发保存
          debouncedSaveFullWorkflow();
        } else {
          // 如果删除失败，尝试使用纯节点 ID 格式（兼容旧数据）
          const fallbackRes = workflowProxy.deleteEdge(
            String(sourceNode.id),
            targetNode.id.toString(),
          );

          if (fallbackRes.success) {
            graphRef.current?.graphDeleteEdge(edgeId);
            debouncedSaveFullWorkflow();
          } else {
            console.warn(
              '[handleTargetNodeConnection] Failed to delete edge:',
              res.message,
              '| source:',
              edgeSource,
              '-> target:',
              targetNode.id,
            );
          }
        }
      }
    },
    [
      graphRef,
      isConditionalNode,
      handleConditionalNodeConnection,
      handleNormalNodeConnection,
      handleRouteDecisionOutgoingConnection,
      nodeChangeEdge,
      changeNode,
      debouncedSaveFullWorkflow,
    ],
  );

  /**
   * 处理节点创建成功后的所有操作
   */
  const handleNodeCreationSuccess = useCallback(
    async (nodeData: AddNodeResponse) => {
      // 添加节点到画布
      // 端口/边快捷添加（currentNodeRef 已置位）的 extension 是模型(local)坐标的节点左上角
      // （见 graphV3.calculateNodePosition），显式声明 'model' 直接落点，绕开 _doAddNode 的
      // 容器范围启发式——该启发式在 in 端口向左偏移（落点落到容器外）或画布平移/缩放时会
      // 误判坐标系，导致新节点大幅偏移。拖拽落点/视口中心仍走 'auto'。
      graphRef.current?.graphAddNode(
        nodeData.nodeConfig.extension as GraphRect,
        nodeData as unknown as ChildNode,
        currentNodeRef.current ? 'model' : 'auto',
      );

      // 选中新增的节点并打开右侧属性面板。
      // Workflow v3（focusNewNode=true）：选中节点 + 显式打开面板。
      // AgentFlow（focusNewNode=false）：拖入/添加节点仅放置到画布，不主动选中、不弹面板——
      // 面板已改由 node:click 触发（见 registerNodeClickAndDblclick），程序化选中不再自动开面板，
      // 故此处需显式调用；AgentFlow 下留待用户点击节点再打开。
      if (focusNewNode) {
        graphRef.current?.graphSelectNode(String(nodeData.id));
        changeDrawer(nodeData as unknown as ChildNode);
      }

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
        // 特殊端口格式: {nodeId}-{uuid}-out (条件分支、意图识别、QA选项)
        // 普通端口格式: {nodeId}-out
        // 检测方法: 分割后至少有3段（nodeId, uuid, out），且中间段是UUID格式（长度>=8）
        const portSegments = portId.split('-');
        const hasUuidSegment =
          portSegments.length >= 3 &&
          portSegments.slice(1, -1).join('-').length >= 8; // UUID至少有8个字符
        const isSpecial = !isException && hasUuidSegment;

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
              portId,
            });
          }

          // 重新获取新节点的引用信息
          await getReference(nodeData.id);
        } catch (error) {
          console.error(
            'Error occurred while handling node connections:',
            error,
          );
          throw error;
        } finally {
          currentNodeRef.current = null;
        }
      }
    },
    [
      graphRef,
      currentNodeRef,
      focusNewNode,
      changeDrawer,
      handleSpecialPortConnection,
      handleExceptionPortConnection,
      handleOutputPortConnection,
      handleInputPortConnection,
      handleTargetNodeConnection,
      getReference,
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
          message.warning(t('PC.Pages.AntvX6Workflow.cannotNestLoop'));
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
                ...(_params.type === NodeTypeEnum.KnowledgeInsert
                  ? pickKnowledgeInsertBindingForAddDto(_params.nodeConfig) ||
                    {}
                  : {}),
              }
            : undefined;

        // Agent 节点：关联智能体 ID 走顶层 typeId（与 Workflow、MCP 一致）
        const resolvedTypeId =
          _params.type === NodeTypeEnum.Agent
            ? _params.typeId ?? _params.nodeConfig?.agentId
            : _params.typeId;

        const apiRes = await service.apiAddNodeV3({
          workflowId: workflowId,
          // RouteDecision 复用后端 IntentRecognition 类型收发（见 nodeTypeMapping.ts）
          type: toBackendNodeType(_params.type),
          typeId: resolvedTypeId,
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
        } else {
          // API 失败：显示错误消息并阻止添加节点
          message.error(
            apiRes.message || t('PC.Pages.AntvX6NodeOperations.addNodeFailed'),
          );
          console.error('[V3] Add node API failed:', apiRes.message);
          return;
        }
      } catch (error) {
        // 网络异常：显示错误消息并阻止添加节点
        message.error(t('PC.Pages.AntvX6NodeOperations.addNodeNetworkError'));
        console.error('[V3] Add node API exception:', error);
        return;
      }

      _params.id = nodeId;

      if (apiNodeData) {
        // RouteDecision / HumanInteraction 复用后端类型创建（见 nodeTypeMapping.ts）：
        // 后端返回的 type/name 会回写成后端类型的默认值，这里按请求值还原前端语义。
        const requestedType = _params.type;
        const wasRemapped = isFrontendMappedType(requestedType);
        const requestedName = _params.name;
        const requestedDescription = _params.description;
        const requestedNodeConfig = _params.nodeConfig;
        _params = {
          ..._params,
          ...apiNodeData,
          nodeConfig: mergeNodeConfigAfterAddApi(
            requestedType,
            requestedNodeConfig,
            apiNodeData,
            _params.extension,
          ),
        };
        // name/description 始终以请求值为准：后端 apiAddNodeV3 的回显可能为空或回写后端默认文案
        //（如 Agent 节点），若不还原，画布节点会丢失名称/描述，进而保存时不传给后端。
        _params = {
          ..._params,
          name: requestedName,
          description: requestedDescription,
        };
        // 仅「类型被映射」的节点（RouteDecision/HumanInteraction）需要把 type 还原为前端语义
        if (wasRemapped) {
          _params = { ..._params, type: requestedType };
        }
        // Agent 节点的 outputArgs（output → Agent reply）是前端默认值，后端 apiAddNodeV3
        // 不会回显；合并后若缺失则补齐，否则下游「变量引用」里看不到智能体节点的输出变量。
        if (
          _params.type === NodeTypeEnum.Agent &&
          (!_params.nodeConfig?.outputArgs ||
            _params.nodeConfig.outputArgs.length === 0)
        ) {
          _params.nodeConfig = {
            ..._params.nodeConfig,
            outputArgs: createDefaultNodeConfig(NodeTypeEnum.Agent).outputArgs,
          };
        }

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
        // [Fix] Manually add inner nodes and inner edges to proxy
        // Because addNode only adds the top-level loop node
        if (_params.type === NodeTypeEnum.Loop && _params.innerNodes) {
          _params.innerNodes.forEach((innerNode: ChildNode) => {
            workflowProxy.addNode(innerNode);
          });
          // 添加 Loop 节点的边（Loop-in → LoopStart, LoopEnd → Loop-out）
          const loopEdges = getEdges([_params as ChildNode], false);
          loopEdges.forEach((edge) => {
            workflowProxy.addEdge(edge as any);
          });
          // 添加 innerNodes 之间的边（如 LoopStart → LoopEnd）
          const innerEdges = getEdges(_params.innerNodes, false);
          innerEdges.forEach((edge) => {
            workflowProxy.addEdge(edge as any);
          });
        }

        try {
          await handleNodeCreationSuccess(_params as AddNodeResponse);
          debouncedSaveFullWorkflow();
        } catch (error) {
          console.error(
            'Failed to process post-actions after successful node creation:',
            error,
          );
        }
      } else {
        // 静默异常消息，不弹出提示
        console.warn(
          '[V3] Failed to add node in proxy layer:',
          proxyResult.message,
        );
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
   * 复制节点 - 调用后端 API（与 V1 保持一致）
   */
  const copyNode = useCallback(
    async (child: ChildNode, offset?: { x: number; y: number }) => {
      try {
        // 调用后端 copy 接口
        const _res = await service.apiCopyNode(child.id.toString());
        if (_res.code === Constant.success && _res.data) {
          const { nodeConfig, ...rest } = _res.data;
          const resExtension = nodeConfig?.extension || {};
          const { toolName, mcpId } = child.nodeConfig || {};

          // 计算偏移位置
          const offsetX = offset?.x ?? 32;
          const offsetY = offset?.y ?? 32;

          const newNode: ChildNode = {
            ...rest,
            // RouteDecision / HumanInteraction 复用后端类型：复制返回的 type 为后端类型，
            // 这里按源节点类型还原前端语义（见 nodeTypeMapping.ts）
            ...(isFrontendMappedType(child.type) ? { type: child.type } : {}),
            shape: getShape(_res.data.type),
            nodeConfig: {
              ...nodeConfig,
              ...(toolName ? { toolName, mcpId } : {}),
              extension: {
                ...resExtension,
                x: (resExtension.x || 0) + offsetX,
                y: (resExtension.y || 0) + offsetY,
              },
            },
          } as ChildNode;

          // 添加到代理层
          const proxyResult = workflowProxy.addNode(newNode);
          if (proxyResult.success) {
            // 添加节点到画布
            // 复制节点的 extension 来自源节点保存位置 + 偏移，是模型(local)坐标左上角，
            // 同样用 'model' 直接落点（与端口/边一致），避免容器范围启发式在画布平移时误判。
            graphRef.current?.graphAddNode(
              newNode.nodeConfig.extension as GraphRect,
              newNode,
              'model',
            );

            // 选中复制出的节点并打开属性面板。
            // 面板打开已从 node:selected 迁移到 node:click，程序化选中不再自动打开，
            // 故此处显式处理；AgentFlow（focusNewNode=false）下与新增节点一致，仅放置不弹面板。
            if (focusNewNode) {
              graphRef.current?.graphSelectNode(String(newNode.id));
              changeDrawer(newNode);
            }
            changeUpdateTime();
          } else {
            console.warn(
              '[V3] Failed to add copied node in proxy layer:',
              proxyResult.message,
            );
          }
        } else {
          message.error(
            _res.message || t('PC.Pages.AntvX6NodeOperations.copyNodeFailed'),
          );
        }
      } catch (error) {
        console.error('[V3] Copy node API exception:', error);
        message.error(t('PC.Pages.AntvX6NodeOperations.copyNodeNetworkError'));
      }
    },
    [graphRef, changeUpdateTime, focusNewNode, changeDrawer],
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
        message.error(
          res.message || t('PC.Pages.AntvX6NodeOperations.deleteNodeFailed'),
        );
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
        const knowledgeNodeType = sessionStorage.getItem('knowledgeNodeType');
        const resolvedKnowledgeType =
          knowledgeNodeType === NodeTypeEnum.KnowledgeInsert
            ? NodeTypeEnum.KnowledgeInsert
            : NodeTypeEnum.Knowledge;
        const tableType = sessionStorage.getItem('tableType');
        const isKnowledgeInsert =
          val.targetType === AgentComponentTypeEnum.Knowledge &&
          resolvedKnowledgeType === NodeTypeEnum.KnowledgeInsert;
        const resolvedDescription = isKnowledgeInsert
          ? resolveNodeDescriptionWithNameFallback(val.name, val.description)
          : val.description;

        _child = {
          name: val.name,
          shape: NodeShapeEnum.General,
          description: resolvedDescription,
          type:
            val.targetType === AgentComponentTypeEnum.Knowledge
              ? ((knowledgeNodeType || NodeTypeEnum.Knowledge) as NodeTypeEnum)
              : ((tableType || NodeTypeEnum.TableDataQuery) as NodeTypeEnum),
          typeId: val.targetId,
          nodeConfig: isKnowledgeInsert
            ? buildKnowledgeInsertNodeConfigOnAdd(val)
            : {
                knowledgeBaseConfigs: [
                  {
                    ...val,
                    type: resolvedKnowledgeType,
                    knowledgeBaseId: val.targetId,
                  },
                ],
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
          // 工作流节点：描述为空时回退到名称，再兜底默认文案
          description:
            type === NodeTypeEnum.Workflow
              ? resolveAgentFlowWorkflowNodeDescription(
                  val.name,
                  val.description,
                )
              : val.description,
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
      } else if (val.targetType === AgentComponentTypeEnum.Agent) {
        if (isAgentFlow && !isAgentFlowSelectableAgent(val)) {
          message.warning(
            t(
              'PC.Pages.AgentFlowParams.agentGroupNotAllowed',
              '智能体不允许选择 AgentGroup',
            ),
          );
          return;
        }
        // 智能体节点：弹窗选择当前空间已发布 ChatBot；
        // add 请求顶层 typeId，nodeConfig.agentId 供属性面板与整图保存
        // name/description 缺省回退到智能体节点的类型名/类型描述，保证画布始终有名称与描述
        _child = {
          name: val.name || t('PC.Pages.AgentFlowParams.nodeAgentName'),
          shape: NodeShapeEnum.General,
          description:
            val.description ||
            t('PC.Pages.AgentFlowParams.nodeAgentDescription'),
          type: NodeTypeEnum.Agent,
          typeId: val.targetId,
          nodeConfig: {
            agentId: val.targetId,
            inputArgs: [],
            extraPrompt: '',
            selfLoopTimes: 0,
            reminderPrompt: '',
          },
        };
      } else {
        message.warning(t('PC.Pages.AntvX6Workflow.unsupportedComponentType'));
        return;
      }

      addNode(_child, dragEvent);
      clearPendingNodeCreateSession();
      setOpen(false);
    },
    [addNode, dragEvent, setOpen, isAgentFlow],
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
        NodeTypeEnum.Agent,
      ].includes(childType);

      const isTableNode = [
        'TableDataAdd',
        'TableDataDelete',
        'TableDataUpdate',
        'TableDataQuery',
        'TableSQL',
      ].includes(childType);

      // 知识库写入：拖入时先弹出知识库选择弹窗（与数据新增选表交互一致）
      const isKnowledgeInsertNode = childType === NodeTypeEnum.KnowledgeInsert;

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
      } else if (isKnowledgeInsertNode) {
        setCreatedItem(AgentComponentTypeEnum.Knowledge);
        setOpen(true);
        setDragEvent(getCoordinates(position, viewGraph, continueDragCount));
        sessionStorage.setItem('knowledgeNodeType', childType);
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
