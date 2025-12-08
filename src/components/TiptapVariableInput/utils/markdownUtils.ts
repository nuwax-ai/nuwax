/**
 * Markdown 处理工具函数
 */

export interface Range {
  start: number;
  end: number;
}

/**
 * 获取文本中受保护的范围（不应应用 Markdown 高亮的区域）
 * 目前包括：
 * 1. 变量: {{variable}}
 * 2. 工具块: {#ToolBlock ...#}content{#/ToolBlock#}
 *
 * @param text 要检查的文本
 * @param basePos 文本在文档中的起始位置（用于计算绝对坐标）
 * @returns 受保护的范围列表
 */
export const getProtectedRanges = (
  text: string,
  basePos: number = 0,
): Range[] => {
  const ranges: Range[] = [];

  if (!text) return ranges;

  // 1. 变量 {{xxx}}
  const variableRegex = /\{\{([^}]+)\}\}/g;
  let varMatch;
  while ((varMatch = variableRegex.exec(text)) !== null) {
    ranges.push({
      start: basePos + varMatch.index,
      end: basePos + varMatch.index + varMatch[0].length,
    });
  }

  // 2. 工具块 {#ToolBlock ...#}content{#/ToolBlock#}
  // 虽然通常是节点，但如果作为文本出现，也需要保护
  const toolBlockRegex = /\{#ToolBlock[\s\S]*?\{#\/ToolBlock#\}/g;
  let toolMatch;
  while ((toolMatch = toolBlockRegex.exec(text)) !== null) {
    ranges.push({
      start: basePos + toolMatch.index,
      end: basePos + toolMatch.index + toolMatch[0].length,
    });
  }

  return ranges;
};

/**
 * 检查给定范围是否与任何受保护范围重叠
 * @param ranges 受保护的范围列表
 * @param start 检查范围的开始位置
 * @param end 检查范围的结束位置
 * @returns 是否重叠
 */
export const isOverlappingRange = (
  ranges: Range[],
  start: number,
  end: number,
): boolean => {
  return ranges.some(
    (range) =>
      (start >= range.start && start < range.end) || // Start is inside
      (end > range.start && end <= range.end) || // End is inside
      (start <= range.start && end >= range.end), // Encloses range
  );
};
