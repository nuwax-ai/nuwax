import { NodeTypeEnum } from '@/types/enums/common';
import { NodeConfig } from '@/types/interfaces/node';
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

import { Graph, Node } from '@antv/x6';
/**
 * 定义 NodeProps 接口，用于定义传递给自定义节点组件的属性。
 */
export interface NodeProps {
  // 节点实例，类型为 AntV X6 的 Node 类型，泛型参数可以是任何类型
  node: Node<any>;
  // 图实例，类型为 AntV X6 的 Graph 类型
  graph: Graph;
}
