import { useEffect, useState } from 'react';
import { TreeNodeData } from '../utils';

/**
 * 键盘选择管理 Hook
 */
export const useKeyboardSelection = (flatAllNodes: TreeNodeData[]) => {
  const [keyboardSelectedIndex, setKeyboardSelectedIndex] = useState(0);
  const [selectedTreeKey, setSelectedTreeKey] = useState<string>('');

  // 重置选择状态
  const resetSelection = () => {
    setKeyboardSelectedIndex(0);
    if (flatAllNodes.length > 0) {
      setSelectedTreeKey(flatAllNodes[0].key);
    } else {
      setSelectedTreeKey('');
    }
  };

  // 当节点列表变化时，重置选择状态
  useEffect(() => {
    resetSelection();
  }, [flatAllNodes]);

  // 处理键盘选择
  const handleKeyboardSelect = (direction: 'up' | 'down') => {
    if (flatAllNodes.length === 0) return;

    let newIndex = keyboardSelectedIndex;

    if (direction === 'down') {
      newIndex = (keyboardSelectedIndex + 1) % flatAllNodes.length;
    } else {
      newIndex =
        (keyboardSelectedIndex - 1 + flatAllNodes.length) % flatAllNodes.length;
    }

    setKeyboardSelectedIndex(newIndex);
    setSelectedTreeKey(flatAllNodes[newIndex].key);

    // 滚动到选中的节点
    setTimeout(() => {
      const selectedElement = document.querySelector(
        `[data-node-key="${flatAllNodes[newIndex].key}"]`,
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }, 0);
  };

  // 处理回车键确认选择
  const getCurrentSelectedNode = () => {
    if (
      flatAllNodes.length > 0 &&
      keyboardSelectedIndex < flatAllNodes.length
    ) {
      return flatAllNodes[keyboardSelectedIndex];
    }
    return null;
  };

  return {
    keyboardSelectedIndex,
    selectedTreeKey,
    setKeyboardSelectedIndex,
    setSelectedTreeKey,
    resetSelection,
    handleKeyboardSelect,
    getCurrentSelectedNode,
  };
};
