import { Graph, Node } from '@antv/x6';

interface KeyValuePairs {
  label: string;
  value: string;
}

export interface NodeProps {
  node: Node<any>;
  graph: Graph;
}

export interface Child {
  title: string;
  image: string;
  key: string;
  type: string;
  content: string | KeyValuePairs[];
  width?: number;
  height?: number;
  isParent?: boolean;
  backgroundColor?: string;
}

export interface StencilList {
  name: string;
  key: string;
  children: Child[];
}

export interface GraphProp {
  containerId: string;
  changeDrawer: (item: Child) => void;
}
