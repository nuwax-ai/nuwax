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
 * 3. XML 标签: <tag_name>、</tag_name>、<tag-name attr="value">
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

  // 3. XML 标签（包含下划线或连字符的标签名，以及大写开头的标签名）
  // 这些标签不应被 Markdown 高亮处理，防止标签中的下划线被识别为斜体
  // 匹配格式：
  //   - 开始标签：<tag_name>、<tag_name attr="value">
  //   - 结束标签：</tag_name>
  //   - 自闭合标签：<tag_name />
  //   - 包括大写开头的标签：<OutputFormat>
  //   - 包括完整的配对标签内容：<task_result>content</task_result>
  // 先匹配完整的配对标签（开始标签 + 内容 + 结束标签）
  const pairedXmlTagRegex =
    /<([a-zA-Z][a-zA-Z0-9_-]*)(?:\s+[^>]*)?>[\s\S]*?<\/\1>/g;
  let pairedMatch;
  while ((pairedMatch = pairedXmlTagRegex.exec(text)) !== null) {
    const tagName = pairedMatch[1];
    // 只保护自定义 XML 标签（大写开头或包含下划线/连字符）
    if (
      /^[A-Z]/.test(tagName) ||
      tagName.includes('_') ||
      tagName.includes('-')
    ) {
      ranges.push({
        start: basePos + pairedMatch.index,
        end: basePos + pairedMatch.index + pairedMatch[0].length,
      });
    }
  }

  // 再匹配单独的 XML 标签（开始、结束、自闭合）以处理不完整或未配对的标签
  const singleXmlTagRegex = /<\/?([a-zA-Z][a-zA-Z0-9_-]*)(?:\s+[^>]*)?\s*\/?>/g;
  let singleMatch;
  while ((singleMatch = singleXmlTagRegex.exec(text)) !== null) {
    const tagName = singleMatch[1];
    // 只保护自定义 XML 标签（大写开头或包含下划线/连字符）
    if (
      /^[A-Z]/.test(tagName) ||
      tagName.includes('_') ||
      tagName.includes('-')
    ) {
      const start = basePos + singleMatch.index;
      const end = basePos + singleMatch.index + singleMatch[0].length;
      // 检查是否已被配对标签范围覆盖，避免重复添加
      const alreadyCovered = ranges.some(
        (r) => start >= r.start && end <= r.end,
      );
      if (!alreadyCovered) {
        ranges.push({ start, end });
      }
    }
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
