/**
 * 从边列表同步更新节点的 nextNodeIds
 *
 * 在保存工作流时，确保所有节点的 nextNodeIds 都与当前的 edgeList 保持一致
 * 这样可以确保保存的数据准确反映当前的连线状态
 */

import type { ChildNodeV2, EdgeV2 } from '../types';
import { AnswerTypeEnumV2, NodeTypeEnumV2 } from '../types';

/**
 * 从边列表同步更新节点的 nextNodeIds
 * @param nodes 节点列表
 * @param edges 边列表
 * @returns 更新后的节点列表
 */
export function syncNodesFromEdges(
  nodes: ChildNodeV2[],
  edges: EdgeV2[],
): ChildNodeV2[] {
  // 创建节点映射，方便查找
  const nodeMap = new Map<number, ChildNodeV2>();
  nodes.forEach((node) => {
    nodeMap.set(node.id, { ...node });
  });

  // 按节点ID分组边
  const normalEdgesBySource = new Map<number, number[]>();
  const exceptionEdgesBySource = new Map<number, number[]>();
  // 使用完整端口ID作为key，格式：${nodeId}-${uuid}-out
  const specialPortEdges = new Map<string, number[]>();

  edges.forEach((edge) => {
    const sourceId = parseInt(edge.source, 10);
    const targetId = parseInt(edge.target, 10);
    const sourcePort = edge.sourcePort || '';

    // 异常边（端口格式：${nodeId}-exception-out）
    if (sourcePort.includes('exception')) {
      const current = exceptionEdgesBySource.get(sourceId) || [];
      if (!current.includes(targetId)) {
        exceptionEdgesBySource.set(sourceId, [...current, targetId]);
      }
      return;
    }

    // 特殊端口边（条件分支、意图识别、问答选项）
    // 端口格式：${nodeId}-${uuid}-out
    // 需要根据节点类型和uuid来匹配
    if (sourcePort.includes('-') && sourcePort.endsWith('-out')) {
      // 检查是否是特殊端口（包含uuid）
      const parts = sourcePort.split('-');
      if (parts.length >= 3) {
        // 使用完整端口ID作为key
        const key = sourcePort;
        const current = specialPortEdges.get(key) || [];
        if (!current.includes(targetId)) {
          specialPortEdges.set(key, [...current, targetId]);
        }
        return;
      }
    }

    // 普通输出边（端口格式：${nodeId}-out）
    if (sourcePort === `${sourceId}-out`) {
      const current = normalEdgesBySource.get(sourceId) || [];
      if (!current.includes(targetId)) {
        normalEdgesBySource.set(sourceId, [...current, targetId]);
      }
    }
  });

  // 更新节点
  return nodes.map((node) => {
    const updatedNode = { ...node };

    // 判断是否为特殊分支节点
    const isSpecialBranchNode =
      node.type === NodeTypeEnumV2.Condition ||
      node.type === NodeTypeEnumV2.IntentRecognition ||
      (node.type === NodeTypeEnumV2.QA &&
        node.nodeConfig?.answerType === AnswerTypeEnumV2.SELECT);

    if (!isSpecialBranchNode) {
      // 普通节点：更新 nextNodeIds
      const nextNodeIds = normalEdgesBySource.get(node.id) || [];
      updatedNode.nextNodeIds = nextNodeIds.length > 0 ? nextNodeIds : null;
    } else {
      // 特殊分支节点：更新对应的分支配置中的 nextNodeIds
      if (node.type === NodeTypeEnumV2.Condition) {
        const conditionBranchConfigs =
          node.nodeConfig?.conditionBranchConfigs || [];
        updatedNode.nodeConfig = {
          ...updatedNode.nodeConfig,
          conditionBranchConfigs: conditionBranchConfigs.map((branch) => {
            // 端口格式：${node.id}-${branch.uuid}-out
            const portKey = `${node.id}-${branch.uuid}-out`;
            const nextNodeIds = specialPortEdges.get(portKey) || [];
            return {
              ...branch,
              nextNodeIds: nextNodeIds.length > 0 ? nextNodeIds : [],
            };
          }),
        };
      } else if (node.type === NodeTypeEnumV2.IntentRecognition) {
        const intentConfigs = node.nodeConfig?.intentConfigs || [];
        updatedNode.nodeConfig = {
          ...updatedNode.nodeConfig,
          intentConfigs: intentConfigs.map((intent) => {
            // 端口格式：${node.id}-${intent.uuid}-out
            const portKey = `${node.id}-${intent.uuid}-out`;
            const nextNodeIds = specialPortEdges.get(portKey) || [];
            return {
              ...intent,
              nextNodeIds: nextNodeIds.length > 0 ? nextNodeIds : [],
            };
          }),
        };
      } else if (
        node.type === NodeTypeEnumV2.QA &&
        node.nodeConfig?.answerType === AnswerTypeEnumV2.SELECT
      ) {
        const options = node.nodeConfig?.options || [];
        updatedNode.nodeConfig = {
          ...updatedNode.nodeConfig,
          options: options.map((option) => {
            // 端口格式：${node.id}-${option.uuid}-out
            const portKey = `${node.id}-${option.uuid}-out`;
            const nextNodeIds = specialPortEdges.get(portKey) || [];
            return {
              ...option,
              nextNodeIds: nextNodeIds.length > 0 ? nextNodeIds : [],
            };
          }),
        };
      }
    }

    // 更新异常处理配置
    const exceptionNodeIds = exceptionEdgesBySource.get(node.id);
    if (exceptionNodeIds && exceptionNodeIds.length > 0) {
      updatedNode.nodeConfig = {
        ...updatedNode.nodeConfig,
        exceptionHandleConfig: {
          ...updatedNode.nodeConfig?.exceptionHandleConfig,
          exceptionHandleNodeIds: exceptionNodeIds,
        },
      };
    }

    return updatedNode;
  });
}
