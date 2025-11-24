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
  // 移除 placement，使用智能动态定位
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
 * 计算下拉框的安全显示位置 - 智能动态定位
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
  },
  options?: PositionOptions,
): { position: Position; adjustment: PositionAdjustment } => {
  const {
    width: dropdownWidth,
    height: dropdownHeight,
    padding = 8,
    offset = 4,
    maxHeight = 280,
    // 移除默认的 placement，使用动态计算
  } = dimensions;

  // 优先使用 options 中的 treeHeight
  const targetHeight = options?.treeHeight || dropdownHeight;

  // 计算实际内容区域高度（考虑搜索区域等）
  const actualHeight = Math.min(targetHeight, maxHeight);

  // 使用光标位置作为主要参考点
  const cursorBasedBounds = {
    left: cursorX,
    top: cursorY,
    right: cursorX,
    bottom: cursorY + offset,
    width: 0,
    height: 0,
  };

  // 获取可用空间
  const space = getAvailableSpace(cursorBasedBounds);

  // 根据最佳方向计算位置
  let position: Position;
  let direction: string;

  // 动态计算最佳放置方向（简化版本）
  if (cursorY + actualHeight + offset <= window.innerHeight) {
    position = {
      x: cursorX,
      y: cursorY + offset,
    };
    direction = '下方';
  } else {
    position = {
      x: cursorX,
      y: cursorY - actualHeight - offset,
    };
    direction = '上方';
  }

  // 确保不超出视口边界
  const finalX = Math.max(
    padding,
    Math.min(position.x, window.innerWidth - dropdownWidth - padding),
  );
  const finalY = Math.max(
    padding,
    Math.min(position.y, window.innerHeight - actualHeight - padding),
  );

  // 边界调整检查
  let isAdjusted = finalX !== position.x || finalY !== position.y;
  let adjustmentReason = direction;

  if (isAdjusted) {
    adjustmentReason += '，已调整边界';
  }

  // 如果边界调整导致离光标太远，进一步优化
  const distanceFromCursor =
    Math.abs(finalX - cursorX) + Math.abs(finalY - cursorY);

  if (distanceFromCursor > 100) {
    // 尝试在光标附近找到最佳位置
    let smartPosition: Position;

    if (space.below >= actualHeight) {
      // 下方有空间
      smartPosition = {
        x: Math.max(
          padding,
          Math.min(cursorX, window.innerWidth - dropdownWidth - padding),
        ),
        y: Math.max(
          padding,
          Math.min(
            cursorY + offset,
            window.innerHeight - actualHeight - padding,
          ),
        ),
      };
    } else if (space.above >= actualHeight) {
      // 上方有空间
      smartPosition = {
        x: Math.max(
          padding,
          Math.min(cursorX, window.innerWidth - dropdownWidth - padding),
        ),
        y: Math.min(
          cursorY - actualHeight - offset,
          window.innerHeight - actualHeight - padding,
        ),
      };
    } else {
      // 上下都没有足够空间，选择空间较大的方向
      const horizontalSpace = Math.max(space.left, space.right);
      const verticalSpace = Math.max(space.below, space.above);

      if (horizontalSpace > verticalSpace) {
        // 左右放置
        if (space.right >= dropdownWidth) {
          smartPosition = {
            x: cursorX + offset,
            y: Math.max(
              padding,
              Math.min(cursorY, window.innerHeight - actualHeight - padding),
            ),
          };
        } else {
          smartPosition = {
            x: cursorX - dropdownWidth - offset,
            y: Math.max(
              padding,
              Math.min(cursorY, window.innerHeight - actualHeight - padding),
            ),
          };
        }
      } else {
        // 上下放置
        const verticalY =
          space.below >= space.above
            ? cursorY + offset
            : cursorY - actualHeight - offset;
        smartPosition = {
          x: Math.max(
            padding,
            Math.min(cursorX, window.innerWidth - dropdownWidth - padding),
          ),
          y: verticalY,
        };
      }
    }

    // 再次检查边界
    const constrainedX = Math.max(
      padding,
      Math.min(smartPosition.x, window.innerWidth - dropdownWidth - padding),
    );
    const constrainedY = Math.max(
      padding,
      Math.min(smartPosition.y, window.innerHeight - actualHeight - padding),
    );

    position = { x: constrainedX, y: constrainedY };
    adjustmentReason += '，已优化位置';
    isAdjusted = true;
  } else {
    position = { x: finalX, y: finalY };
  }

  // 确定水平方向
  const horizontalDirection =
    position.x < cursorX ? 'left' : position.x > cursorX ? 'right' : 'center';

  // 确定垂直方向
  const verticalDirection =
    position.y < cursorY ? 'top' : position.y > cursorY ? 'bottom' : 'center';

  const adjustment: PositionAdjustment = {
    isAdjusted,
    direction: {
      horizontal: horizontalDirection,
      vertical: verticalDirection,
    },
    reason: adjustmentReason,
  };

  return { position, adjustment };
};
