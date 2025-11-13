/**
 * 位置计算工具函数 - 参考 Ant Design Select 组件
 */

export interface Position {
  x: number;
  y: number;
}

export interface DropdownDimensions {
  width: number;
  height: number;
  padding?: number;
  offset?: number; // 偏移量
  maxHeight?: number; // 最大高度限制
  placement?: 'bottom-right' | 'top-right' | 'top-left' | 'bottom-left'; // 显示方向
}

export interface PositionAdjustment {
  isAdjusted: boolean;
  direction: {
    horizontal: 'left' | 'right' | 'center';
    vertical: 'top' | 'bottom' | 'center';
  };
  reason: string;
}

export interface PositionOptions {
  hasSearch?: boolean; // 是否有搜索区域
  searchText?: string; // 当前搜索文本
  treeHeight?: number; // 树形列表的高度
}

/**
 * 获取元素的边界信息
 */
const getElementBounds = (element: Element | null | undefined) => {
  // 检查元素是否有效
  if (
    !element ||
    typeof (element as any).getBoundingClientRect !== 'function'
  ) {
    return null;
  }

  const rect = (element as any).getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    bottom: rect.bottom,
    right: rect.right,
    width: rect.width,
    height: rect.height,
  };
};

/**
 * 获取可用的空间信息
 */
const getAvailableSpace = (triggerBounds: any, containerBounds?: any) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // 如果指定了容器，则基于容器计算空间
  const bounds = containerBounds || {
    top: 0,
    left: 0,
    right: viewportWidth,
    bottom: viewportHeight,
  };

  return {
    above: triggerBounds.top - bounds.top,
    below: bounds.bottom - triggerBounds.bottom,
    left: triggerBounds.left - bounds.left,
    right: bounds.right - triggerBounds.right,
    totalWidth: bounds.right - bounds.left,
    totalHeight: bounds.bottom - bounds.top,
  };
};

/**
 * 计算最佳的放置方向 - 参考 antd Select 的逻辑
 */
const getBestPlacement = (
  triggerBounds: any,
  dropdownWidth: number,
  dropdownHeight: number,
  space: any,
): { placement: string; x: number; y: number; reason: string } => {
  // 尝试放置在下方（默认）
  if (space.below >= dropdownHeight) {
    const x = triggerBounds.left;
    const y = triggerBounds.bottom;
    return {
      placement: 'bottom',
      x,
      y,
      reason: 'enough_space_below',
    };
  }

  // 尝试放置在上方
  if (space.above >= dropdownHeight) {
    const x = triggerBounds.left;
    const y = triggerBounds.top - dropdownHeight;
    return {
      placement: 'top',
      x,
      y,
      reason: 'enough_space_above',
    };
  }

  // 水平空间检查
  if (space.right >= dropdownWidth) {
    const x = triggerBounds.right;
    const y = Math.max(triggerBounds.top, 0);
    return {
      placement: 'right',
      x,
      y,
      reason: 'enough_space_right',
    };
  }

  if (space.left >= dropdownWidth) {
    const x = triggerBounds.left - dropdownWidth;
    const y = Math.max(triggerBounds.top, 0);
    return {
      placement: 'left',
      x,
      y,
      reason: 'enough_space_left',
    };
  }

  // 空间不足，放置在空间最大的地方
  const placements = [
    { name: 'bottom', space: space.below },
    { name: 'top', space: space.above },
    { name: 'right', space: space.right },
    { name: 'left', space: space.left },
  ];

  const bestPlacement = placements.reduce((prev, current) =>
    current.space > prev.space ? current : prev,
  );

  const x =
    bestPlacement.name === 'right'
      ? triggerBounds.right
      : bestPlacement.name === 'left'
      ? triggerBounds.left - dropdownWidth
      : triggerBounds.left;

  const y =
    bestPlacement.name === 'top'
      ? triggerBounds.top - dropdownHeight
      : triggerBounds.bottom;

  return {
    placement: bestPlacement.name,
    x,
    y,
    reason: `insufficient_space_using_${bestPlacement.name}`,
  };
};

/**
 * 根据指定方向计算下拉框位置 - 以内容区域对齐
 */
const calculatePlacementPosition = (
  cursorX: number,
  cursorY: number,
  dropdownWidth: number,
  dropdownHeight: number,
  offset: number,
  placement: 'bottom-right' | 'top-right' | 'top-left' | 'bottom-left',
  contentHeight?: number, // 实际内容高度
): { x: number; y: number; direction: string } => {
  // 如果没有指定内容高度，使用下拉框高度
  const actualContentHeight = contentHeight || dropdownHeight;

  const positions = {
    'bottom-right': {
      // 右下：以内容区域底部对齐光标下方
      x: cursorX + offset,
      y: cursorY + offset,
      direction: '右下',
    },
    'top-right': {
      // 右上：以内容区域顶部对齐光标上方
      x: cursorX + offset,
      y: cursorY - actualContentHeight - offset,
      direction: '右上',
    },
    'bottom-left': {
      // 左下：以内容区域底部对齐光标下方
      x: cursorX - dropdownWidth - offset,
      y: cursorY + offset,
      direction: '左下',
    },
    'top-left': {
      // 左上：以内容区域顶部对齐光标上方
      x: cursorX - dropdownWidth - offset,
      y: cursorY - actualContentHeight - offset,
      direction: '左上',
    },
  };

  return positions[placement];
};

/**
 * 计算下拉框的安全显示位置 - 参考 Ant Design Select 组件
 * @param cursorX 光标X坐标
 * @param cursorY 光标Y坐标
 * @param triggerElement 触发元素（输入框）
 * @param dimensions 下拉框尺寸配置
 * @returns 调整后的安全位置和调整信息
 */
export const calculateDropdownPosition = (
  cursorX: number,
  cursorY: number,
  triggerElement?: Element,
  dimensions: DropdownDimensions = {
    width: 300,
    height: 200,
    padding: 8,
    offset: 4,
    maxHeight: 280,
    placement: 'bottom-right', // 默认右下方向
  },
  options?: PositionOptions,
): { position: Position; adjustment: PositionAdjustment } => {
  const {
    width: dropdownWidth,
    height: dropdownHeight,
    padding = 8,
    offset = 4,
    maxHeight = 280,
    placement = 'bottom-right',
  } = dimensions;

  // 计算实际内容区域高度（考虑搜索区域等）
  const searchAreaHeight = options?.hasSearch && options?.searchText ? 60 : 40; // 搜索区域高度
  const treeHeight = options?.treeHeight || dropdownHeight;
  const contentHeight = searchAreaHeight + treeHeight; // 实际内容区域高度

  // 使用实际高度，但不超过最大高度
  const actualHeight = Math.min(dropdownHeight, maxHeight);

  // 获取触发元素的边界信息（如果可用）
  const triggerBounds = getElementBounds(triggerElement);

  // 使用光标位置作为基准，而不是触发元素底部
  const cursorBasedBounds = {
    left: cursorX,
    top: cursorY,
    right: cursorX,
    bottom: cursorY + offset, // 光标下方一点点的位置
    width: 0,
    height: 0,
  };

  // 如果有触发元素信息，可以用于更好的位置调整
  const referenceBounds = triggerBounds || cursorBasedBounds;

  // 获取可用空间
  const space = getAvailableSpace(referenceBounds);

  // 计算最佳放置位置 - 优先考虑光标位置（用于调试和未来优化）
  getBestPlacement(
    cursorBasedBounds, // 使用光标位置作为参考
    dropdownWidth,
    actualHeight,
    space,
  );

  // 根据指定方向计算基础位置
  const placementPosition = calculatePlacementPosition(
    cursorX,
    cursorY,
    dropdownWidth,
    dropdownHeight, // 原始下拉框高度
    offset,
    placement,
    contentHeight, // 实际内容高度
  );

  // 最终位置调整（确保不超出边界）
  const finalX = Math.max(
    padding,
    Math.min(placementPosition.x, window.innerWidth - dropdownWidth - padding),
  );
  const finalY = Math.max(
    padding,
    Math.min(placementPosition.y, window.innerHeight - actualHeight - padding),
  );

  // 如果调整后的位置离光标太远，尝试其他方案
  const distanceFromCursor =
    Math.abs(finalX - cursorX) + Math.abs(finalY - cursorY);
  let adjustedPosition = { x: finalX, y: finalY };

  // 如果调整后的位置离光标太远（超过100px），尝试智能调整
  if (distanceFromCursor > 100) {
    // 尝试将下拉框放在光标附近的安全位置
    const smartX = Math.max(
      padding,
      Math.min(cursorX, window.innerWidth - dropdownWidth - padding),
    );
    const smartY = cursorY + offset;

    // 检查这个位置是否合适
    if (smartY + actualHeight <= window.innerHeight - padding) {
      adjustedPosition = { x: smartX, y: smartY };
    } else if (cursorY - actualHeight - offset >= padding) {
      // 如果下方空间不够，检查上方
      adjustedPosition = { x: smartX, y: cursorY - actualHeight - offset };
    }
  }

  const position = {
    x: isNaN(adjustedPosition.x) ? cursorX : adjustedPosition.x,
    y: isNaN(adjustedPosition.y) ? cursorY : adjustedPosition.y,
  };

  const adjustment: PositionAdjustment = {
    isAdjusted: position.x !== finalX || position.y !== finalY,
    direction: {
      horizontal:
        position.x < cursorX
          ? 'left'
          : position.x > cursorX
          ? 'right'
          : 'center',
      vertical:
        position.y < cursorY
          ? 'top'
          : position.y > cursorY
          ? 'bottom'
          : 'center',
    },
    reason: `${placementPosition.direction}方向放置${
      distanceFromCursor > 100 ? '，已调整位置' : ''
    }`,
  };

  return { position, adjustment };
};
