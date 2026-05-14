/**
 * 数据转换工具
 */
import type { KnowledgeTriple } from '@/types/interfaces/knowledge';
import type { GraphData, GraphEdge, GraphNode } from '../types/graph';
import { generateColor } from './colorGenerator';

/**
 * 将原始数据转换为图谱数据（发散形布局）
 * 每个主题节点作为中心，子节点向四周发散
 * 主题节点之间通过双向箭头连接，显示双向关系
 */
export function convertToGraphData(rawData: KnowledgeTriple[]): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeMap = new Map<string, GraphNode>();

  // 先收集所有 object 名称，用于判断 subject 是否是主题节点
  const objectNames = new Set(rawData.map((item) => item.object));

  // 第一遍遍历：创建所有节点和边
  rawData.forEach((item, index) => {
    // 创建对象节点（中心节点）
    const objectNodeId = `object-${item.object}`;
    if (!nodeMap.has(objectNodeId)) {
      const objectNode: GraphNode = {
        id: objectNodeId,
        label: item.object,
        type: 'object',
        color: generateColor('object'),
        fullText: item.object,
      };
      nodeMap.set(objectNodeId, objectNode);
      nodes.push(objectNode);
    }

    // 创建内容节点（发散节点）
    const subjectNodeId = objectNames.has(item.subject)
      ? `object-${item.subject}`
      : `content-${item.subject}`;

    if (!objectNames.has(item.subject) && !nodeMap.has(subjectNodeId)) {
      const contentNode: GraphNode = {
        id: subjectNodeId,
        label: item.subject,
        type: 'content',
        color: generateColor('content'),
        fullText: item.subject,
      };
      nodeMap.set(subjectNodeId, contentNode);
      nodes.push(contentNode);
    }

    // 创建边（从主语节点指向宾语节点）
    edges.push({
      id: `edge-${item.subject}-${item.object}-${index}`,
      source: subjectNodeId,
      target: objectNodeId,
      label: item.predicate,
      fullText: item.predicate,
      edgeType: objectNames.has(item.subject) ? 'link' : 'relation',
    });
  });

  // 第二遍：合并 object 到 object 之间的双向关系边
  const linkEdgeMap = new Map<
    string,
    { edge: GraphEdge; relations: string[] }
  >();

  edges.forEach((edge) => {
    if (edge.edgeType === 'link') {
      // 用两个节点 id 排序后作为 key，确保双向边使用同一个 key
      const key = [edge.source, edge.target].sort().join('-');

      if (!linkEdgeMap.has(key)) {
        linkEdgeMap.set(key, { edge, relations: [edge.label] });
      } else {
        linkEdgeMap.get(key)!.relations.push(edge.label);
      }
    }
  });

  // 过滤掉重复的 link 边，只保留一条并合并关系标签
  const mergedEdges: GraphEdge[] = [];
  const linkKeys = new Set<string>();

  edges.forEach((edge) => {
    if (edge.edgeType === 'link') {
      const key = [edge.source, edge.target].sort().join('-');
      if (!linkKeys.has(key)) {
        const data = linkEdgeMap.get(key)!;
        mergedEdges.push({
          ...data.edge,
          label: data.relations.join(' | '),
          fullText: data.relations.join(' | '),
        });
        linkKeys.add(key);
      }
    } else {
      mergedEdges.push(edge);
    }
  });

  return { nodes, edges: mergedEdges };
}

/**
 * 搜索过滤图谱数据
 */
export function filterGraphData(data: GraphData, keyword: string): GraphData {
  if (!keyword) return data;

  const lowerKeyword = keyword.toLowerCase();

  // 过滤匹配的节点
  const matchedNodes = data.nodes.filter(
    (node) =>
      node.label.toLowerCase().includes(lowerKeyword) ||
      (node.fullText && node.fullText.toLowerCase().includes(lowerKeyword)),
  );

  const matchedNodeIds = new Set(matchedNodes.map((n) => n.id));

  // 过滤相关的边
  const relatedEdges = data.edges.filter(
    (edge) =>
      matchedNodeIds.has(edge.source) || matchedNodeIds.has(edge.target),
  );

  // 收集所有相关节点ID
  const allRelatedNodeIds = new Set<string>();
  relatedEdges.forEach((edge) => {
    allRelatedNodeIds.add(edge.source);
    allRelatedNodeIds.add(edge.target);
  });

  // 返回过滤后的数据
  return {
    nodes: data.nodes.filter((n) => allRelatedNodeIds.has(n.id)),
    edges: relatedEdges,
  };
}
