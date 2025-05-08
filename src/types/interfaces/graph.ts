import { NodeTypeEnum } from '@/types/enums/common';
import { NodeConfig } from '@/types/interfaces/node';
import { Graph, Node } from '@antv/x6';

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
  key: string;
  // 描述
  description: string;
  // 节点的id
  id?: number;
  // 如果涉及工作流、插件、数据库、知识库需要typeId
  typeId?: number;
  // 如果涉及循环，需要提供循环的节点id
  loopNodeId?: number;
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
  key?: string;
  icon: string;
  selected?: boolean;
  loopNodeId?: number;
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

export interface GraphContainerProps {
  graphParams: { nodeList: ChildNode[]; edgeList: Edge[] };
  changeDrawer: (child: ChildNode | null) => void;
  changeEdge: (
    type: string,
    targetId: string,
    sourceNode: ChildNode,
    id: string,
  ) => void;
  changeCondition: (config: ChildNode) => void;
  copyNode: (child: ChildNode) => void;
  // 删除节点
  removeNode: (id: string) => void;
  // 改变画布大小
  changeZoom: (val: number) => void;
  // 通过连接桩或者边创建节点
  createNodeToPortOrEdge: (
    child: Child,
    sourceNode: ChildNode,
    portId: string,
    targetNode?: ChildNode,
  ) => void;
}

export interface GraphContainerRef {
  getCurrentViewPort: () => {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  // 新增节点
  addNode: (e: { x: number; y: number }, child: ChildNode) => void;
  // 修改节点
  updateNode: (nodeId: string, newData: ChildNode) => void;
  // 保存节点
  saveAllNodes: () => void;
  // 删除节点
  deleteNode: (id: string) => void;
  // 选中节点
  selectNode: (id: string) => void;
  // 删除边
  deleteEdge: (id: string) => void;
  // 创建新的边
  createNewEdge: (source: string, target: string) => void;
  changeGraphZoom: (val: number) => void;
  drawGraph: () => void;
}

export interface BindEventHandlers {
  graph: Graph;
  // 新增或删除边
  changeEdge: (
    type: string,
    targetId: string,
    sourceNode: ChildNode,
    id: string,
  ) => void;
  changeCondition: (config: ChildNode, targetNodeId?: string) => void;
  copyNode: (child: ChildNode) => void;
  // 删除节点
  removeNode: (id: string, node?: ChildNode) => void;
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
  changeEdge: (
    type: string,
    targetId: string,
    sourceNode: ChildNode,
    id: string,
  ) => void;
  changeCondition: (newData: ChildNode, targetNodeId?: string) => void;
  changeZoom: (val: number) => void;
  // 通过连接桩或者边创建节点
  createNodeToPortOrEdge: (
    child: Child,
    sourceNode: ChildNode,
    portId: string,
    targetNode?: ChildNode,
  ) => void;
}
