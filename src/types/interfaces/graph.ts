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
  id: number | string;
  name: string;
  description: string;
  workflowId: number;
  type: NodeTypeEnum; // 使用枚举键作为类型;
  preNodes?: null;
  nodeConfig: NodeConfig;
  nextNodes?: null;
  nextNodeIds?: number[] | null;
  innerNodes?: ChildNode[] | null;
  innerStartNodeId?: number | null;
  innerEndNodeId?: number | null;
  unreachableNextNodeIds?: number[] | null;
  modified?: string;
  created?: string;
  key?: string;
}

export interface Edge {
  source: string | number;
  target: string | number;
}

/**
 * 定义 NodeProps 接口，用于定义传递给自定义节点组件的属性。
 */
export interface NodeProps {
  // 节点实例，类型为 AntV X6 的 Node 类型，泛型参数可以是任何类型
  node: Node<any>;
  // 图实例，类型为 AntV X6 的 Graph 类型
  graph: Graph;
}

export interface GraphContainerProps {
  graphParams: { nodeList: ChildNode[]; edgeList: Edge[] };
  handleNodeChange: (action: string, data: ChildNode) => void;
  changeDrawer: (child: ChildNode) => void;
  changeEdge: (
    sourceNode: ChildNode,
    targetId: string,
    type: string,
    id: string,
  ) => void;
  changeCondition: (config: ChildNode) => void;
}

export interface GraphContainerRef {
  addNode: (e: { x: number; y: number }, child: ChildNode) => void;
  updateNode: (nodeId: string, newData: Partial<ChildNode>) => void;
  saveAllNodes: () => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  changeGraphZoom: (val: number) => void;
  drawGraph: () => void;
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
  changeDrawer: (item: ChildNode) => void;
  changeEdge: (
    sourceNode: ChildNode,
    targetId: string,
    type: string,
    id: string,
  ) => void;
  changeCondition: (newData: ChildNode) => void;
}
