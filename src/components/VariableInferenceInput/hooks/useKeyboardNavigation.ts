import { useCallback } from 'react';
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
      // 优先处理 Escape 键，不需要依赖节点数据
      if (e.key === 'Escape') {
        console.log('Escape pressed, closing dropdown');
        e.preventDefault();
        setVisible(false);
        return;
      }

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

  // 移除全局键盘事件监听，改为返回 onKeyDown 处理函数
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement> | KeyboardEvent) => {
      if (readonly) return;

      // 只在下拉框可见时处理导航键
      if (visible) {
        if (
          e.key === 'ArrowDown' ||
          e.key === 'ArrowUp' ||
          e.key === 'Enter' ||
          e.key === 'Escape'
        ) {
          e.preventDefault();
          e.stopPropagation();
          handleTreeNavigation(e as any);
        }
      }
    },
    [visible, readonly, handleTreeNavigation],
  );

  return { onKeyDown };
};
