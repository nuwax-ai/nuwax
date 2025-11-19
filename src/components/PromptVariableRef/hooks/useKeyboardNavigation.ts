import { useCallback } from 'react';
import { VariableTreeNode } from '../types';

interface UseKeyboardNavigationProps {
  visible: boolean;
  displayTree: VariableTreeNode[];
  selectedKeys: React.Key[];
  expandedKeys: React.Key[];
  setSelectedKeys: (keys: React.Key[]) => void;
  setExpandedKeys: (keys: React.Key[]) => void;
  onSelect: (value: string) => void;
  onClose: () => void;
  extractSearchTextFromInput: (text: string, cursorPos: number) => string;
  internalValue: string;
  textCursorPosition: number;
  setInternalValue: (value: string) => void;
}

export const useKeyboardNavigation = ({
  visible,
  displayTree,
  selectedKeys,
  expandedKeys,
  setSelectedKeys,
  setExpandedKeys,
  onSelect,
  onClose,
  extractSearchTextFromInput,
  internalValue,
  textCursorPosition,
  setInternalValue,
}: UseKeyboardNavigationProps) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!visible) return;

      // 只处理我们的快捷键
      if (
        e.key !== 'ArrowDown' &&
        e.key !== 'ArrowUp' &&
        e.key !== 'Enter' &&
        e.key !== 'Escape'
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        const searchText = extractSearchTextFromInput(
          internalValue,
          textCursorPosition,
        );

        if (searchText.trim()) {
          // 如果有搜索文本，检查是单个大括号还是双大括号
          const beforeCursor = internalValue.substring(0, textCursorPosition);
          const lastBraceStart = beforeCursor.lastIndexOf('{');
          const lastDoubleBraceStart = beforeCursor.lastIndexOf('{{');

          if (lastBraceStart > lastDoubleBraceStart) {
            // 单个大括号：删除 { 和搜索内容
            const index = internalValue.lastIndexOf('{' + searchText);
            if (index >= 0) {
              setInternalValue(internalValue.substring(0, index));
            }
          } else {
            // 双大括号：删除 {{ 和搜索内容
            const index = internalValue.lastIndexOf('{{' + searchText);
            if (index >= 0) {
              setInternalValue(internalValue.substring(0, index));
            }
          }
        } else {
          // 检查是否有 { 或 {{
          if (internalValue.includes('{')) {
            const beforeCursor = internalValue.substring(0, textCursorPosition);
            const lastBraceStart = beforeCursor.lastIndexOf('{');
            const lastDoubleBraceStart = beforeCursor.lastIndexOf('{{');

            if (lastBraceStart > lastDoubleBraceStart) {
              // 单个大括号：删除 { 和对应的 }
              const index = internalValue.lastIndexOf('{');
              if (index >= 0) {
                // 找到对应的 }
                const afterBrace = internalValue.substring(index + 1);
                const closingBracePos = afterBrace.indexOf('}');

                if (closingBracePos !== -1) {
                  // 删除 {xxx}
                  setInternalValue(
                    internalValue.substring(0, index) +
                      internalValue.substring(index + 1 + closingBracePos + 1),
                  );
                } else {
                  // 只有 {，删除 {
                  setInternalValue(internalValue.substring(0, index));
                }
              }
            } else if (internalValue.includes('{{')) {
              // 双大括号：删除 {{
              const index = internalValue.lastIndexOf('{{');
              if (index >= 0) {
                setInternalValue(
                  internalValue.substring(0, index) +
                    internalValue.substring(index + 2),
                );
              }
            }
          }
        }
        onClose();
        return;
      }

      // 扁平化树结构以进行线性导航
      // 注意：这里我们需要所有可见节点，包括未展开的子节点吗？
      // 通常键盘导航只在可见节点间移动。
      // 为了简化，我们假设 displayTree 已经是过滤后的树。
      // 我们需要一个辅助函数来获取所有"可见"节点（即父节点已展开的节点）
      // 但 transformToTreeDataForTree 逻辑里似乎所有节点都渲染了？
      // 不，Tree 组件会处理展开/折叠。
      // 我们需要模拟 Tree 的导航逻辑。

      // 重新实现简单的扁平化逻辑，只包含当前可见的节点
      // 这里简化处理：假设用户想在所有匹配的节点中导航，或者只在顶层导航？
      // 原代码逻辑：
      // const getAllNodes = (nodes: any[], path: string[] = []): any[] => { ... }
      // const allNodes = getAllNodes(treeData);
      // 原代码似乎是扁平化了所有节点，不管是否展开。

      const getAllNodes = (
        nodes: VariableTreeNode[],
        path: string[] = [],
      ): { key: string; value: string; path: string[] }[] => {
        const result: { key: string; value: string; path: string[] }[] = [];
        for (const node of nodes) {
          const currentPath = [...path, node.key];
          result.push({ key: node.key, value: node.value, path: currentPath });
          if (node.children) {
            result.push(...getAllNodes(node.children, currentPath));
          }
        }
        return result;
      };

      const allNodes = getAllNodes(displayTree);

      if (allNodes.length === 0) return;

      const currentIndex =
        selectedKeys.length > 0
          ? allNodes.findIndex((node) => node.key === selectedKeys[0])
          : -1;

      if (e.key === 'ArrowDown') {
        const nextIndex =
          currentIndex >= 0 ? (currentIndex + 1) % allNodes.length : 0;
        const nextNode = allNodes[nextIndex];
        setSelectedKeys([nextNode.key]);

        // 自动展开父级节点
        const parentPath = nextNode.path.slice(0, -1);
        if (parentPath.length > 0) {
          setExpandedKeys([...new Set([...expandedKeys, ...parentPath])]);
        }
      } else if (e.key === 'ArrowUp') {
        const prevIndex =
          currentIndex >= 0
            ? (currentIndex - 1 + allNodes.length) % allNodes.length
            : allNodes.length - 1;
        const prevNode = allNodes[prevIndex];
        setSelectedKeys([prevNode.key]);

        // 自动展开父级节点
        const parentPath = prevNode.path.slice(0, -1);
        if (parentPath.length > 0) {
          setExpandedKeys([...new Set([...expandedKeys, ...parentPath])]);
        }
      } else if (e.key === 'Enter') {
        if (currentIndex >= 0) {
          const selectedNode = allNodes[currentIndex];
          onSelect(selectedNode.value);
        }
      }
    },
    [
      visible,
      displayTree,
      selectedKeys,
      expandedKeys,
      setSelectedKeys,
      setExpandedKeys,
      onSelect,
      onClose,
      extractSearchTextFromInput,
      internalValue,
      textCursorPosition,
      setInternalValue,
    ],
  );

  return { handleKeyDown };
};
