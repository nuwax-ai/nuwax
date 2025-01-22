import {
  ICON_END,
  ICON_NEW_AGENT,
  ICON_START,
} from '@/constants/images.constants';
import { ChildNode, Edge } from '@/types/interfaces/workflow';

// 递归获取节点的边
export const getEdges = (nodes: ChildNode[]): Edge[] => {
  const edges = nodes
    .filter((node) => node.nextNodeIds && node.nextNodeIds.length > 0)
    .flatMap((node) =>
      (node.nextNodeIds || []).map((item) => ({
        source: node.id,
        target: item,
      })),
    );

  // 使用 Set 来移除重复的边
  const uniqueEdges = new Set<string>();
  const resultEdges: Edge[] = [];

  edges.forEach((edge) => {
    const edgeKey = `${edge.source}-${edge.target}`;
    if (!uniqueEdges.has(edgeKey)) {
      uniqueEdges.add(edgeKey);
      resultEdges.push(edge);
    }
  });

  return resultEdges;
};

// 根据type返回图片
export const returnImg = (type: string) => {
  switch (type) {
    case 'Start':
      return <ICON_START />;
    case 'End':
      return <ICON_END />;
    default:
      return <ICON_NEW_AGENT />;
  }
};

// 根据type返回背景色
export const returnBackgroundColor = (type: string) => {
  switch (type) {
    case 'Start':
      return '#EEEEFF';
    case 'End':
      return '#EEEEFF';
    default:
      return '#EEEEFF';
  }
};
