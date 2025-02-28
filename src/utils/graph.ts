import { Node } from '@antv/x6';
// 边界检查并调整子节点位置
// 调整父节点尺寸以包含所有子节点

export const adjustParentSize = (parentNode: Node) => {
  const childrenNodes = parentNode.getChildren
    ? Array.from(parentNode.getChildren() || [])
    : [];
  if (childrenNodes.length === 0) return;

  // 统一使用全局坐标系计算子节点包围盒
  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;
  const padding = 20; // 内边距

  childrenNodes.forEach((childNode) => {
    if (Node.isNode(childNode)) {
      // 假设 getBBox() 返回全局坐标
      const bbox = childNode.getBBox();
      const childMinX = bbox.x;
      const childMinY = bbox.y;
      const childMaxX = bbox.x + bbox.width;
      const childMaxY = bbox.y + bbox.height;

      minX = Math.min(minX, childMinX);
      minY = Math.min(minY, childMinY);
      maxX = Math.max(maxX, childMaxX);
      maxY = Math.max(maxY, childMaxY);
    }
  });

  if (!isFinite(minX)) return;

  // 扩展内边距后的包围盒
  const globalMinX = minX - padding;
  const globalMinY = minY - padding;
  const globalMaxX = maxX + padding;
  const globalMaxY = maxY + padding;

  // 计算基础尺寸
  let newWidth = globalMaxX - globalMinX;
  let newHeight = globalMaxY - globalMinY;

  // 应用最小尺寸限制
  const MIN_WIDTH = 600;
  const MIN_HEIGHT = 240;
  newWidth = Math.max(newWidth, MIN_WIDTH);
  newHeight = Math.max(newHeight, MIN_HEIGHT);

  // 计算最终位置（保持子节点居中于父节点）
  const centerX = (globalMinX + globalMaxX) / 2;
  const centerY = (globalMinY + globalMaxY) / 2;
  const newX = centerX - newWidth / 2;
  const newY = centerY - newHeight / 2;

  parentNode.prop(
    {
      position: { x: newX, y: newY },
      size: { width: newWidth, height: newHeight },
    },
    { skipParentHandler: true },
  );
};
