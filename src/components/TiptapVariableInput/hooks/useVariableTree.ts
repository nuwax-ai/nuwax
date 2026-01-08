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
      // 根据类型分类：工具（Plugin/Workflow/Mcp）和技能（Skill/SubAgent）
      const toolTypes = ['Plugin', 'Workflow', 'Mcp'];
      const skillTypes = ['Skill', 'SubAgent'];

      const tools = skills.filter((s) => toolTypes.includes(s.type));
      const skillItems = skills.filter((s) => skillTypes.includes(s.type));

      // 转换工具为树节点
      const toolNodes: VariableTreeNode[] = tools.map((tool, index) => ({
        key: `tool-${tool.typeId || tool.id || index}`,
        value: tool.toolName || tool.name || 'Unknown Tool',
        label: tool.toolName || tool.name || 'Unknown Tool',
        isLeaf: true,
        variable: {
          name: tool.name,
          type: 'Tool' as any,
          value: tool,
          displayType: 'Tool', // 用于显示标签
        } as any,
      }));

      // 转换技能为树节点
      // 转换技能为树节点
      const skillNodes: VariableTreeNode[] = [];

      skillItems.forEach((skill, index) => {
        const isSubAgent = skill.type === 'SubAgent';
        const skillKey = `skill-${skill.typeId || skill.id || index}`;
        const skillName = skill.toolName || skill.name || 'Unknown Skill';

        if (
          isSubAgent &&
          skill.bindConfig?.subAgents &&
          skill.bindConfig.subAgents.length > 0
        ) {
          // 子智能体：平铺展示子项
          skill.bindConfig.subAgents.forEach(
            (subAgent: any, subIndex: number) => {
              skillNodes.push({
                key: `subagent-${skill.id}-${subIndex}`,
                value: subAgent.name, // 使用子智能体名称作为 value
                label: subAgent.name,
                isLeaf: true,
                variable: {
                  name: subAgent.name,
                  type: 'SubAgent' as any, // 确保 ToolBlock 使用正确的类型
                  value: {
                    ...subAgent,
                    id: skill.id, // 指向父智能体ID
                    typeId: skill.typeId,
                    type: 'SubAgent', // 覆盖类型为 SubAgent
                  },
                  displayType: 'SubAgent', // 用于显示标签
                } as any,
              });
            },
          );
        } else {
          // 普通技能或无子项的子智能体
          skillNodes.push({
            key: skillKey,
            value: skillName,
            label: skillName,
            isLeaf: true,
            variable: {
              name: skill.name,
              type: isSubAgent ? 'SubAgent' : ('Skill' as any), // 使用实际类型
              value: skill,
              displayType: isSubAgent ? 'SubAgent' : 'Skill', // 用于显示标签
            } as any,
          });
        }
      });

      // 有变量时，添加分类节点
      if (tree.length > 0) {
        // 添加工具分类节点（如果有工具）
        if (toolNodes.length > 0) {
          tree.push({
            key: 'category-tools',
            value: 'Tools',
            label: '工具',
            isLeaf: false,
            children: toolNodes,
            variable: {
              name: 'Tools',
              type: 'Category' as any,
            } as any,
          });
        }

        // 添加技能分类节点（如果有技能）
        if (skillNodes.length > 0) {
          tree.push({
            key: 'category-skills',
            value: 'Skills',
            label: '技能',
            isLeaf: false,
            children: skillNodes,
            variable: {
              name: 'Skills',
              type: 'Category' as any,
            } as any,
          });
        }
      } else {
        // 没有变量时，根据内容决定是否创建分类
        // 如果既有工具又有技能，则创建分类节点
        if (toolNodes.length > 0 && skillNodes.length > 0) {
          tree.push({
            key: 'category-tools',
            value: 'Tools',
            label: '工具',
            isLeaf: false,
            children: toolNodes,
            variable: {
              name: 'Tools',
              type: 'Category' as any,
            } as any,
          });
          tree.push({
            key: 'category-skills',
            value: 'Skills',
            label: '技能',
            isLeaf: false,
            children: skillNodes,
            variable: {
              name: 'Skills',
              type: 'Category' as any,
            } as any,
          });
        } else {
          // 只有工具或只有技能，直接返回扁平列表
          return [...toolNodes, ...skillNodes];
        }
      }
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
