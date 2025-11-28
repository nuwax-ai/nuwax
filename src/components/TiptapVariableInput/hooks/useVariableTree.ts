/*
 * useVariableTree Hook
 * 变量树管理 Hook（复用现有逻辑）
 */

import { useMemo } from 'react';
import type { PromptVariable, VariableTreeNode } from '../types';
import { buildVariableTree } from '../utils/treeUtils';

/**
 * 变量树管理 Hook
 * @param variables 变量列表
 * @param skills 技能列表
 * @param searchText 搜索文本
 * @returns 变量树和过滤后的显示树
 */
export const useVariableTree = (
  variables: PromptVariable[] = [],
  skills: any[] = [],
  searchText: string = '',
) => {
  // 构建变量树
  const variableTree = useMemo(() => {
    const tree = buildVariableTree(variables);

    if (skills && skills.length > 0) {
      // 转换技能为树节点
      const skillNodes: VariableTreeNode[] = skills.map((skill, index) => ({
        key: `skill-${skill.typeId || skill.id || index}`,
        value: skill.toolName || skill.name || 'Unknown Tool',
        label: skill.toolName || skill.name || 'Unknown Tool',
        isLeaf: true,
        variable: {
          name: skill.name,
          type: 'Tool' as any,
          value: skill,
        } as any,
      }));

      // 添加技能分类
      tree.push({
        key: 'category-skills',
        value: 'Skills',
        label: 'Skills',
        isLeaf: false,
        children: skillNodes,
        variable: {
          name: 'Skills',
          type: 'Category' as any,
        } as any,
      });
    }

    return tree;
  }, [variables, skills]);

  // 搜索过滤逻辑
  const displayTree = useMemo(() => {
    if (!searchText.trim()) {
      return variableTree;
    }

    const filterTreeBySearch = (
      nodes: VariableTreeNode[],
      searchText: string,
    ): VariableTreeNode[] => {
      const searchLower = searchText.toLowerCase();

      const matchesNode = (node: VariableTreeNode): boolean => {
        const labelLower = node.label.toLowerCase();
        const valueLower = node.value.toLowerCase();
        return (
          labelLower.includes(searchLower) || valueLower.includes(searchLower)
        );
      };

      const filterNodes = (nodes: VariableTreeNode[]): VariableTreeNode[] => {
        const result: VariableTreeNode[] = [];

        for (const node of nodes) {
          const filteredChildren = node.children
            ? filterNodes(node.children)
            : [];
          const isMatch = matchesNode(node);

          if (isMatch || filteredChildren.length > 0) {
            result.push({
              ...node,
              children: filteredChildren,
            });
          }
        }

        return result;
      };

      return filterNodes(nodes);
    };

    return filterTreeBySearch(variableTree, searchText);
  }, [variableTree, searchText]);

  return {
    variableTree,
    displayTree,
  };
};
