/**
 * 知识图谱类型定义
 */

/**
 * 节点类型
 */
export type NodeType = 'root' | 'object' | 'content';

/**
 * 图节点数据
 */
export interface GraphNode {
  id: string;
  label: string; // 显示文字
  type: NodeType; // 节点类型
  color?: string; // 自定义颜色
  fullText?: string; // 完整内容（用于tooltip）
  x?: number; // x坐标
  y?: number; // y坐标
}

/**
 * 图边数据
 */
export interface GraphEdge {
  id: string;
  source: string; // 源节点ID（对象）
  target: string; // 目标节点ID（内容）
  label: string; // 关系内容
  fullText?: string; // 完整关系描述
  edgeType?: 'relation' | 'link'; // 边类型：relation=关系边，link=关联边
}

/**
 * 图谱数据
 */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * 原始数据格式（用户输入）
 */
export interface RawDataItem {
  object: string;
  relations: RelationItem[];
}

export interface RelationItem {
  relation: string;
  content: string;
}

/**
 * 编辑弹窗数据
 */
export interface EditModalData {
  type: 'node' | 'edge';
  id: string;
  label: string;
  fullText?: string;
}
