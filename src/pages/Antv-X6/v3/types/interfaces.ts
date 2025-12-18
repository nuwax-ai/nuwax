/**
 * V3 工作流接口定义
 * 优先使用全局接口，减少专属类型设置
 */

import { BindConfigWithSub, CreatedNodeItem } from '@/types/interfaces/common';
import {
  ChangeEdgeProps,
  ChangeNodeProps,
  ChildNode,
  CreateNodeByPortOrEdgeProps,
  CurrentNodeRefProps,
  Edge,
  ExceptionItemProps,
  GraphNodeSize,
  GraphNodeSizeGetParams,
  GraphProp,
  GraphRect,
  NodeMetadata,
  RunResultItem,
  StencilChildNode,
  ViewGraphProps,
} from '@/types/interfaces/graph';
import {
  ArgMap,
  ConditionBranchConfigs,
  ExceptionHandleConfig,
  InputAndOutConfig,
  IntentConfigs,
  NodeConfig,
  NodeDrawerRef,
  NodePreviousAndArgMap,
  outputOrInputPortConfig as OutputOrInputPortConfig,
  PortConfig,
  PortMetadata,
  PortsConfig,
  PreviousList,
  QANodeOption,
  TestRunParams,
} from '@/types/interfaces/node';
import { Graph } from '@antv/x6';
import type { MessageInstance } from 'antd/es/message/interface';
import type { HookAPI as ModalHookAPI } from 'antd/es/modal/useModal';
import { HistoryActionTypeV3 } from './enums';

// ==================== 接口别名 (使用全局类型) ====================

/** 端口元数据 */
export type PortMetadataV3 = PortMetadata;

/** 输入输出端口配置 */
export type OutputOrInputPortConfigV3 = OutputOrInputPortConfig;

/** 端口配置 */
export type PortsConfigV3 = PortsConfig;

/** 端口配置项 */
export type PortConfigV3 = PortConfig;

/** 输入输出参数配置 */
export type InputAndOutConfigV3 = InputAndOutConfig;

/** 绑定配置（带子项） */
export type BindConfigWithSubV3 = BindConfigWithSub;

/** 意图配置 */
export type IntentConfigsV3 = IntentConfigs;

/** 问答节点选项 */
export type QANodeOptionV3 = QANodeOption;

/** 异常处理配置 */
export type ExceptionHandleConfigV3 = ExceptionHandleConfig;

/** 创建的节点项 */
export type CreatedNodeItemV3 = CreatedNodeItem;

/** 运行结果项 */
export type RunResultItemV3 = RunResultItem;

/** 子节点（核心节点数据结构） */
export type ChildNodeV3 = ChildNode;

/** 模板子节点 */
export type StencilChildNodeV3 = StencilChildNode;

/** 图形矩形 */
export type GraphRectV3 = GraphRect;

/** 视图图形属性 */
export type ViewGraphPropsV3 = ViewGraphProps;

/** 改变节点属性 */
export type ChangeNodePropsV3 = ChangeNodeProps;

/** 改变边属性 */
export type ChangeEdgePropsV3 = ChangeEdgeProps;

/** 通过端口或边创建节点属性 */
export type CreateNodeByPortOrEdgePropsV3 = CreateNodeByPortOrEdgeProps;

/** 图形属性 */
export type GraphPropV3 = GraphProp;

/** 节点上级节点列表 */
export type PreviousListV3 = PreviousList;

/** 参数映射 */
export type ArgMapV3 = ArgMap;

/** 节点上级节点和参数映射 */
export type NodePreviousAndArgMapV3 = NodePreviousAndArgMap;

/** 节点抽屉引用 */
export type NodeDrawerRefV3 = NodeDrawerRef;

/** 当前节点引用键 */
export type CurrentNodeRefKeyV3 =
  | 'sourceNode'
  | 'portId'
  | 'targetNode'
  | 'edgeId';

/** 当前节点引用属性 */
export type CurrentNodeRefPropsV3 = CurrentNodeRefProps;

/** 图形节点尺寸获取参数 */
export type GraphNodeSizeGetParamsV3 = GraphNodeSizeGetParams;

/** 图形节点尺寸 */
export type GraphNodeSizeV3 = GraphNodeSize;

/** 节点元数据 */
export type NodeMetadataV3 = NodeMetadata;

/** 异常项属性 */
export type ExceptionItemPropsV3 = ExceptionItemProps;

/** 试运行参数 */
export type TestRunParamsV3 = TestRunParams;

// ==================== V3 专属接口 (保持或组合) ====================

/**
 * 边 (V3 可能需要特定的端口信息)
 */
export interface EdgeV3 extends Edge {
  sourcePort?: string;
  targetPort?: string;
}

/**
 * 条件参数
 */
export interface ConditionArgsV3 {
  secondArg: BindConfigWithSubV3 | null;
  compareType: string | null;
  firstArg: BindConfigWithSubV3 | null;
}

/**
 * 条件分支配置
 */
export type ConditionBranchConfigsV3 = ConditionBranchConfigs;

/**
 * 节点配置 (扩展自全局 NodeConfig)
 */
export type NodeConfigV3 = NodeConfig;

/**
 * 工作流元数据 (特定于 V3 保存)
 */
export interface WorkflowMetadataV3 {
  name: string;
  description: string;
  spaceId: number;
  startNode?: ChildNodeV3;
  endNode?: ChildNodeV3;
  extension?: {
    size?: number;
  };
  category?: string;
  version?: string;
  publishStatus?: string;
  modified?: string;
}

/**
 * 工作流数据 (V3 核心数据结构)
 */
export interface WorkflowDataV3 {
  nodeList: ChildNodeV3[];
  edgeList: EdgeV3[];
  lastSavedVersion: string;
  isDirty: boolean;
  metadata?: WorkflowMetadataV3;
}

/**
 * 图形容器属性 (特定于 V3 逻辑)
 */
export interface GraphContainerPropsV3 {
  workflowData: WorkflowDataV3;
  onNodeChange: (node: ChildNodeV3) => void;
  onEdgeChange: (edges: EdgeV3[]) => void;
  onNodeAdd: (node: ChildNodeV3) => void;
  onNodeDelete: (nodeId: number) => void;
  onNodeSelect: (node: ChildNodeV3 | null) => void;
  onZoomChange: (zoom: number) => void;
  onUndo: () => void;
  onRedo: () => void;
}

/**
 * 图形容器引用 (特定于 V3 逻辑)
 */
export interface GraphContainerRefV3 {
  getCurrentViewPort: () => ViewGraphPropsV3;
  graphAddNode: (e: GraphRectV3, child: ChildNodeV3) => void;
  graphUpdateNode: (nodeId: string, newData: ChildNodeV3 | null) => void;
  graphUpdateByFormData: (
    changedValues: any,
    fullNodeConfig: NodeConfigV3,
    nodeId: string,
  ) => void;
  graphDeleteNode: (id: string) => void;
  graphSelectNode: (id: string) => void;
  graphDeleteEdge: (id: string) => void;
  graphCreateNewEdge: (
    source: string,
    target: string,
    isLoop?: boolean,
    sourcePort?: string,
    targetPort?: string,
  ) => void;
  graphChangeZoom: (val: number) => void;
  graphChangeZoomToFit: () => void;
  drawGraph: () => void;
  getGraphRef: () => Graph;
  graphTriggerBlankClick: () => void;
  graphResetRunResult: () => void;
  graphActiveNodeRunResult: (id: string, runResult: RunResultItemV3) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  undo: () => void;
  redo: () => void;
}

/**
 * 绑定事件处理器 (特定于 V3 逻辑)
 */
export interface BindEventHandlersV3 {
  graph: Graph;
  onNodeChange: (node: ChildNodeV3) => void;
  onEdgeAdd: (edge: EdgeV3) => void;
  onEdgeDelete: (edge: EdgeV3) => void;
  onNodeCopy: (node: ChildNodeV3) => void;
  onNodeDelete: (nodeId: number) => void;
  modal: ModalHookAPI;
  message: MessageInstance;
}

/**
 * 工作流详情响应
 */
export interface WorkflowDetailsV3 {
  id: number;
  name: string;
  description: string;
  spaceId: number;
  nodes: ChildNodeV3[];
  startNode: ChildNodeV3;
  endNode?: ChildNodeV3;
  extension?: {
    size?: number;
  };
  modified?: string;
  publishDate?: string;
  publishStatus?: string;
  category?: string;
  permissions?: string[];
  version?: string;
}

/**
 * 验证结果
 */
export interface ValidationResultV3 {
  nodeId: number;
  success: boolean;
  messages: string[];
}

/**
 * 保存工作流请求
 */
export interface SaveWorkflowRequestV3 {
  workflowId: number;
  name?: string;
  description?: string;
  spaceId?: number;
  nodes: ChildNodeV3[];
  startNode?: ChildNodeV3;
  endNode?: ChildNodeV3;
  extension?: {
    size?: number;
  };
  category?: string;
  version?: string;
}

/**
 * 保存工作流响应
 */
export interface SaveWorkflowResponseV3 {
  success: boolean;
  message?: string;
  version?: string;
}

/**
 * 历史记录项 (特定于 V3 撤销重做)
 */
export interface HistoryItemV3 {
  id: string;
  type: HistoryActionTypeV3;
  timestamp: number;
  data: {
    before: WorkflowDataV3;
    after: WorkflowDataV3;
  };
}

/**
 * 节点动画配置
 */
export interface NodeAnimationConfigV3 {
  type: 'highlight' | 'flash' | 'pulse';
  duration: number;
  color?: string;
}
