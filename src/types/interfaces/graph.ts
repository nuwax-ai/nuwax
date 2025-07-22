import {
  NodeShapeEnum,
  NodeTypeEnum,
  RunResultStatusEnum,
} from '@/types/enums/common';
import {
  ExceptionHandleConfig,
  NodeConfig,
  outputOrInputPortConfig,
  PortsConfig,
} from '@/types/interfaces/node';
import { Graph, Node } from '@antv/x6';
import type { MessageInstance } from 'antd/es/message/interface';
import type { HookAPI as ModalHookAPI } from 'antd/es/modal/useModal';
import {
  NodeSizeGetTypeEnum,
  NodeUpdateEnum,
  UpdateEdgeType,
} from '../enums/node';

/**
 * 定义 Child 接口，用于描述子节点的数据结构。
 */
export interface Child {
  // 子节点标题
  name: string;
  // 子节点显示的图像路径
  icon?: string | React.ReactNode; // 直接使用 SVGProps
  // 唯一标识符
  type: string;
  // 子节点的类型，可能用于区分不同种类的节点
  key: NodeTypeEnum;
  // 子节点的形状
  // 描述
  description: string;
  // 节点的id
  id?: number;
  // 如果涉及工作流、插件、数据库、知识库需要typeId
  typeId?: number;
  // 如果涉及循环，需要提供循环的节点id
  loopNodeId?: number;
}

export interface RunResultItem {
  options: {
    data: object | null;
    nodeName: string;
    nodeId: number;
    startTime: number;
    input: any[];
    endTime: number;
    error: object | null;
    success: boolean;
  };
  requestId: string;
  status: RunResultStatusEnum;
}

// 节点的数据
export interface ChildNode {
  id: number;
  name: string;
  description: string;
  workflowId: number;
  type: NodeTypeEnum; // 使用枚举键作为类型;
  preNodes?: number[] | null;
  nodeConfig: NodeConfig;
  nextNodes?: number[] | null;
  nextNodeIds?: number[] | null;
  innerNodes?: ChildNode[] | null;
  innerStartNodeId?: number | null;
  innerEndNodeId?: number | null;
  unreachableNextNodeIds?: number[] | null;
  modified?: string;
  created?: string;
  shape: NodeShapeEnum;
  icon: string | React.ReactNode;
  loopNodeId?: number;
  isEditingName?: boolean; // 是否正在编辑名称
  isFocus?: boolean; // 是否聚焦
  runResults?: RunResultItem[] | []; // 运行结果
  typeId?: number;
}

export interface StencilChildNode extends Partial<ChildNode> {
  bgIcon: string;
  type: NodeTypeEnum;
}
/**
 * 定义 StencilList 接口，用于描述模板列表的数据结构。
 */
export interface StencilList {
  // 模板列表名称
  name: string;
  // 模板列表的唯一标识符
  key: string;
  // 模板列表中的子节点集合，遵循 Child 接口定义
  children: StencilChildNode[];
}

export interface Edge {
  source: string;
  target: string;
  zIndex?: number;
}

/**
 * 定义 NodeProps 接口，用于定义传递给自定义节点组件的属性。
 */
export interface NodeProps {
  // 节点实例，类型为 AntV X6 的 Node 类型，泛型参数可以是任何类型
  node: Node;
  // 图实例，类型为 AntV X6 的 Graph 类型
  graph: Graph;
}

export interface ChangeNodeProps {
  nodeData: ChildNode;
  targetNodeId?: string;
  update?: NodeUpdateEnum | undefined;
}

export interface ChangeEdgeProps {
  type: UpdateEdgeType;
  targetId: string;
  sourceNode: ChildNode;
  id?: string;
}
export interface CreateNodeByPortOrEdgeProps {
  child: StencilChildNode;
  sourceNode: ChildNode;
  portId: string;
  position: { x: number; y: number };
  targetNode?: ChildNode;
  edgeId?: string;
}

export interface GraphContainerProps {
  graphParams: { nodeList: ChildNode[]; edgeList: Edge[] };
  changeDrawer: (child: ChildNode | null) => void;
  onSaveNode: (data: ChildNode, payload: Partial<ChildNode>) => void;
  changeEdge: (
    config: ChangeEdgeProps,
    callback?: () => Promise<boolean> | void,
  ) => Promise<number[] | false>;
  changeCondition: (
    config: ChangeNodeProps,
    callback?: () => Promise<boolean> | void,
  ) => Promise<boolean>;
  copyNode: (child: ChildNode) => void;
  // 删除节点
  removeNode: (id: string) => void;
  // 改变画布大小
  changeZoom: (val: number) => void;
  // 通过连接桩或者边创建节点
  createNodeByPortOrEdge: (config: CreateNodeByPortOrEdgeProps) => void;
  onClickBlank: () => void;
  onRefresh: () => void;
  onInit: () => void;
}

export interface GraphRect {
  x: number;
  y: number;
  height?: number;
  width?: number;
}
export interface ViewGraphProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GraphContainerRef {
  getCurrentViewPort: () => ViewGraphProps;
  // 新增节点
  graphAddNode: (e: GraphRect, child: ChildNode) => void;
  // 修改节点
  graphUpdateNode: (nodeId: string, newData: ChildNode | null) => void;
  // 修改节点通过表单数据
  graphUpdateByFormData: (
    changedValues: any,
    fullFormValues: any,
    nodeId: string,
  ) => void;
  // 保存节点
  // graphSaveAllNodes: () => void;
  // 删除节点
  graphDeleteNode: (id: string) => void;
  // 选中节点
  graphSelectNode: (id: string) => void;
  // 删除边
  graphDeleteEdge: (id: string) => void;
  // 创建新的边
  graphCreateNewEdge: (
    source: string,
    target: string,
    isLoop?: boolean,
  ) => void;
  graphChangeZoom: (val: number) => void;
  graphChangeZoomToFit: () => void;
  drawGraph: () => void;
  getGraphRef: () => Graph;
  graphTriggerBlankClick: () => void;
  // 清空运行结果
  graphResetRunResult: () => void;
  // 激活节点运行结果
  graphActiveNodeRunResult: (id: string, runResult: RunResultItem) => void;
}

export interface BindEventHandlers {
  graph: Graph;
  // 新增或删除边
  changeEdgeConfigWithRefresh: (
    config: ChangeEdgeProps,
  ) => Promise<number[] | boolean>;
  changeNodeConfigWithRefresh: (config: ChangeNodeProps) => Promise<boolean>;
  copyNode: (child: ChildNode) => void;
  // 删除节点
  removeNode: (id: string, node?: ChildNode) => void;
  modal: ModalHookAPI;
  message: MessageInstance;
}

export interface ControlPanelProps {
  // 拖拽节点到画布
  dragChild: (e: React.DragEvent<HTMLDivElement>, child: Child) => void;
  //   试运行
  handleTestRun: () => void;
  // 切换画布大小
  changeGraph: (val: number) => void;
}

/**
 * 定义 GraphProp 接口，用于描述图组件的属性。
 */
export interface GraphProp {
  // 包含图的 DOM 容器的 ID
  containerId: string;
  // 改变抽屉内容的回调函数，接收一个 Child 类型的参数
  changeDrawer: (item: ChildNode | null) => void;
  onSaveNode: (data: ChildNode, payload: Partial<ChildNode>) => void;
  changeCondition: (config: ChangeNodeProps) => Promise<boolean>;
  changeEdgeConfigWithRefresh: (
    config: ChangeEdgeProps,
  ) => Promise<number[] | boolean>;
  changeNodeConfigWithRefresh: (config: ChangeNodeProps) => Promise<boolean>;
  changeZoom: (val: number) => void;
  // 通过连接桩或者边创建节点
  createNodeByPortOrEdge: (config: CreateNodeByPortOrEdgeProps) => void;
  onClickBlank: () => void;
}

export interface ExceptionItemProps extends ExceptionHandleConfig {
  /** 表单项名称 */
  name: string;
  /** 是否禁用 */
  disabled?: boolean;
}

export interface NodeMetadata extends Node.Metadata {
  shape: NodeShapeEnum;
  data: ChildNode & {
    nodeConfig: NodeConfig;
    parentId: string | null;
  };
  ports: PortsConfig;
}

export interface GraphNodeSizeGetParams {
  data: ChildNode;
  ports: outputOrInputPortConfig[];
  type: NodeSizeGetTypeEnum;
}
export interface CurrentNodeRefProps {
  sourceNode: ChildNode;
  portId: string;
  targetNode?: ChildNode;
  edgeId?: string;
}

export interface GraphNodeSize {
  type: NodeSizeGetTypeEnum; // 创建或更新
  width: number;
  height: number;
}
