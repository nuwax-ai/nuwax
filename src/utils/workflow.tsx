import {
  ICON_END,
  ICON_NEW_AGENT,
  ICON_START,
} from '@/constants/images.constants';
import { ChildNode, Edge } from '@/types/interfaces/workflow';

// 递归获取节点的边
export const getEdges = (nodes: ChildNode[]): Edge[] => {
  // 查找出有边的普通节点
  const edges = nodes
    .filter((node) => node.nextNodeIds && node.nextNodeIds.length > 0)
    .flatMap((node) =>
      (node.nextNodeIds || []).map((item) => ({
        source: node.id,
        target: item,
      })),
    );
  // 筛选出意图识别和条件分支
  const edges2 = nodes
    .filter(
      (node) => node.type === 'Condition' || node.type === 'IntentRecognition',
    )
    .flatMap((item) => {
      if (item.type === 'Condition') {
        // 对于条件节点，遍历所有条件分支配置
        return (
          item.nodeConfig.conditionBranchConfigs?.flatMap((item2, index) => {
            // 对于每个nextNodeId，创建一个新的边对象
            return (
              item2.nextNodeIds.map((nextNodeId) => ({
                source: `${item.id}-${index}`, // 使用当前条件分支的索引作为source的一部分
                target: nextNodeId, // 使用nextNodeId作为target
              })) || []
            );
          }) || []
        );
      } else {
        // 对于意图识别节点，直接返回单条边
        return (
          item.nodeConfig.intentConfigs?.flatMap((item2, index) => {
            // 对于每个nextNodeId，创建一个新的边对象
            return (
              item2.nextNodeIds.map((nextNodeId) => ({
                source: `${item.id}-${index}`, // 使用当前条件分支的索引作为source的一部分
                target: nextNodeId, // 使用nextNodeId作为target
              })) || []
            );
          }) || []
        );
      }
    });

  const edgeList = [...edges, ...edges2];

  console.log(edgeList);
  // 使用 Set 来移除重复的边
  const uniqueEdges = new Set<string>();
  const resultEdges: Edge[] = [];

  edgeList.forEach((edge) => {
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
