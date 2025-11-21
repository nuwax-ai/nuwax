/*
 * Suggestion Utils
 * 自动补全工具函数
 */

import type { VariableTreeNode } from '../../VariableInferenceInput/types';
import type { VariableSuggestionItem } from '../types';

/**
 * 将变量树节点转换为 Suggestion 项
 * @param nodes 变量树节点列表
 * @returns Suggestion 项列表
 */
export const convertTreeNodesToSuggestions = (
  nodes: VariableTreeNode[],
): VariableSuggestionItem[] => {
  const suggestions: VariableSuggestionItem[] = [];

  const traverse = (nodeList: VariableTreeNode[]) => {
    for (const node of nodeList) {
      // 所有节点都可以选择（包括非叶子节点）
      // 检查是否是工具：工具的 key 以 'skill-' 开头，或者 variable.type 是 'Tool'（通过 as any 设置）
      const isTool =
        node.key.startsWith('skill-') ||
        (node.variable as any)?.type === 'Tool';

      suggestions.push({
        key: node.key,
        label: node.label,
        value: node.value,
        node,
        isTool: isTool && node.isLeaf, // 只有叶子节点才能是工具
        toolData:
          isTool && node.isLeaf ? (node.variable as any)?.value : undefined,
      });

      // 递归处理子节点
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  };

  traverse(nodes);
  return suggestions;
};

/**
 * 生成技能块格式字符串
 * @param toolData 技能数据
 * @returns 技能块格式字符串
 */
export const generateToolBlock = (toolData: any): string => {
  const id = toolData.typeId || toolData.id;
  const type = toolData.type;
  const name = toolData.name;
  const content = toolData.toolName || toolData.name;

  return `{#ToolBlock id="${id}" type="${type}" name="${name}"#}${content}{#/ToolBlock#}`;
};
