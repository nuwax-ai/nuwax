/**
 * V3 工作流接口定义
 * 优先使用全局接口，减少专属类型设置
 */

import { Graph } from '@antv/x6';
import type { MessageInstance } from 'antd/es/message/interface';
import type { HookAPI as ModalHookAPI } from 'antd/es/modal/useModal';

// 直接从全局接口导出，不再使用 V3 后缀别名 (这些是“直接引用”)
export { BindConfigWithSub, CreatedNodeItem } from '@/types/interfaces/common';

export {
  ChangeEdgeProps,
  ChangeNodeProps,
  ChildNode,
  CreateNodeByPortOrEdgeProps,
  CurrentNodeRefProps,
  Edge,
  ExceptionItemProps,
  GraphContainerProps,
  GraphContainerRef,
  GraphNodeSize,
  GraphNodeSizeGetParams,
  GraphProp,
  GraphRect,
  NodeMetadata,
  RunResultItem,
  StencilChildNode,
  ViewGraphProps,
} from '@/types/interfaces/graph';

export {
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

import { BindConfigWithSub } from '@/types/interfaces/common';
import { ChildNode, Edge } from '@/types/interfaces/graph';
import { HistoryActionTypeV3 } from './enums';

// ==================== V3 专属/定制接口 (不是直接引用的，保留 V3 后缀) ====================

/**
 * 边 (V3 逻辑中常需带端口信息)
 */
export interface EdgeV3 extends Edge {
  sourcePort?: string;
  targetPort?: string;
}

/**
 * 条件参数
 */
export interface ConditionArgsV3 {
  secondArg: BindConfigWithSub | null;
  compareType: string | null;
  firstArg: BindConfigWithSub | null;
}

/**
 * 工作流元数据
 */
export interface WorkflowMetadataV3 {
  name: string;
  description: string;
  spaceId: number;
  startNode?: ChildNode;
  endNode?: ChildNode;
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
  workflowId: number;
  nodes: ChildNode[];
  edges: EdgeV3[];
  lastSavedVersion?: string;
  isDirty?: boolean;
  modified?: string;
  metadata?: WorkflowMetadataV3;
}

/**
 * 绑定事件处理器 (V3 逻辑)
 */
export interface BindEventHandlersV3 {
  graph: Graph;
  onNodeChange: (node: ChildNode) => void;
  onEdgeAdd: (edge: EdgeV3) => void;
  onEdgeDelete: (edge: EdgeV3) => void;
  onNodeCopy: (node: ChildNode) => void;
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
  nodes: ChildNode[];
  startNode: ChildNode;
  endNode?: ChildNode;
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
  nodes: ChildNode[];
  startNode?: ChildNode;
  endNode?: ChildNode;
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
 * 历史记录项 (用于撤销重做)
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
