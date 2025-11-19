import { useCallback, useEffect } from 'react';
import { extractSearchTextFromInput } from '../utils/textUtils';
import { transformToTreeDataForTree } from '../utils/treeHelpers';

export const useKeyboardNavigation = (
  visible: boolean,
  displayTree: any[],
  selectedKeys: React.Key[],
  setSelectedKeys: (keys: React.Key[]) => void,
  expandedKeys: React.Key[],
  setExpandedKeys: (keys: React.Key[]) => void,
  handleApplyVariable: (value: string) => void,
  setVisible: (visible: boolean) => void,
  internalValue: string,
  setInternalValue: (value: string) => void,
  textCursorPosition: number,
  readonly: boolean,
) => {
  // 键盘导航的具体实现
  const handleTreeNavigation = useCallback(
    (e: KeyboardEvent) => {
      const treeData = transformToTreeDataForTree(displayTree);

      // 获取所有可选择的节点
      const getAllNodes = (nodes: any[], path: string[] = []): any[] => {
        const result: any[] = [];
        for (const node of nodes) {
          result.push({ ...node, path: [...path, node.key] });
          if (node.children) {
            result.push(...getAllNodes(node.children, [...path, node.key]));
          }
        }
        return result;
      };

      const allNodes = getAllNodes(treeData);
      console.log('Available nodes:', allNodes.length);

      if (allNodes.length === 0) return;

      // 获取当前选中节点的索引
      const getCurrentIndex = (): number => {
        if (selectedKeys.length === 0) return -1;
        return allNodes.findIndex((node) => node.key === selectedKeys[0]);
      };

      const currentIndex = getCurrentIndex();
      console.log(
        'Current selected index:',
        currentIndex,
        'selectedKeys:',
        selectedKeys,
      );

      if (e.key === 'ArrowDown') {
        console.log('ArrowDown pressed');
        e.preventDefault();
        const nextIndex =
          currentIndex >= 0 ? (currentIndex + 1) % allNodes.length : 0;
        const nextNode = allNodes[nextIndex];
        setSelectedKeys([nextNode.key]);
        console.log('Next node selected:', nextNode.key);

        // 自动展开父级节点
        const parentPath = nextNode.path.slice(0, -1);
        if (parentPath.length > 0) {
          const newExpandedKeys = [
            ...new Set([...expandedKeys, ...parentPath]),
          ];
          setExpandedKeys(newExpandedKeys);
        }
      } else if (e.key === 'ArrowUp') {
        console.log('ArrowUp pressed');
        e.preventDefault();
        const prevIndex =
          currentIndex >= 0
            ? (currentIndex - 1 + allNodes.length) % allNodes.length
            : allNodes.length - 1;
        const prevNode = allNodes[prevIndex];
        setSelectedKeys([prevNode.key]);
        console.log('Prev node selected:', prevNode.key);

        // 自动展开父级节点
        const parentPath = prevNode.path.slice(0, -1);
        if (parentPath.length > 0) {
          const newExpandedKeys = [
            ...new Set([...expandedKeys, ...parentPath]),
          ];
          setExpandedKeys(newExpandedKeys);
        }
      } else if (e.key === 'Enter') {
        console.log('Enter pressed');
        e.preventDefault();
        if (currentIndex >= 0) {
          const selectedNode = allNodes[currentIndex];
          handleApplyVariable(selectedNode.value);
          setVisible(false);
          console.log('Variable applied:', selectedNode.value);
        }
      } else if (e.key === 'Escape') {
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
      }
    },
    [
      displayTree,
      expandedKeys,
      selectedKeys,
      handleApplyVariable,
      internalValue,
      textCursorPosition,
      setExpandedKeys,
      setInternalValue,
      setSelectedKeys,
      setVisible,
    ],
  );

  // 全局键盘事件处理，作为 Tree 组件内置键盘导航的备选方案
  useEffect(() => {
    if (!visible) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (readonly) return;

      console.log('Global keydown detected:', e.key, 'visible:', visible);

      // 只处理我们的快捷键
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'Enter' ||
        e.key === 'Escape'
      ) {
        e.preventDefault();
        e.stopPropagation();

        // 直接在这里实现键盘导航逻辑，避免函数依赖问题
        handleTreeNavigation(e);
      }
    };

    console.log('Adding global keyboard listener');
    document.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      console.log('Removing global keyboard listener');
      document.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [visible, readonly, handleTreeNavigation]);

  return { handleTreeNavigation };
};
