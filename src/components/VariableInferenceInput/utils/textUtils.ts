/**
 * 从文本输入框中提取搜索关键词
 */
export const extractSearchTextFromInput = (
  inputText: string,
  cursorPosition: number,
): string => {
  // 检查光标前是否有 { 或 {{
  const beforeCursor = inputText.substring(0, cursorPosition);
  const lastBraceStart = beforeCursor.lastIndexOf('{');
  const lastDoubleBraceStart = beforeCursor.lastIndexOf('{{');

  // 确定当前在哪种上下文中
  let mode: 'single' | 'double' = 'double';
  let braceStartPos = lastDoubleBraceStart;

  if (lastBraceStart > lastDoubleBraceStart) {
    // 检查单个大括号是否有效
    // 需要检查完整的 inputText，而不仅仅是 beforeCursor，因为 } 可能在光标后面
    const afterBraceInFullText = inputText.substring(lastBraceStart + 1);
    const closingBracePosInFullText = afterBraceInFullText.indexOf('}');
    const hasClosingBrace = closingBracePosInFullText !== -1;

    if (hasClosingBrace) {
      // 检查光标是否在 { 和 } 之间
      const betweenBraces = inputText.substring(
        lastBraceStart + 1,
        cursorPosition,
      );
      const hasClosingBeforeCursor = betweenBraces.includes('}');

      if (!hasClosingBeforeCursor) {
        mode = 'single';
        braceStartPos = lastBraceStart;
      }
    }
  }

  // 提取搜索文本：支持在 {} 或 {{}} 中输入内容时搜索
  if (braceStartPos !== -1) {
    if (mode === 'single') {
      // 单个大括号模式：在 { } 中搜索
      const afterBrace = inputText.substring(braceStartPos + 1);
      const closingBracePos = afterBrace.indexOf('}');

      if (closingBracePos !== -1) {
        // 检查光标是否在 { 和 } 之间（包括 } 的位置）
        const isInBraces =
          cursorPosition > braceStartPos &&
          cursorPosition <= braceStartPos + 1 + closingBracePos + 1; // +1 包括 } 的位置

        if (isInBraces) {
          // 提取光标前的内容作为搜索文本（从 { 后到光标位置，但不包括 }）
          const endPos = Math.min(
            cursorPosition,
            braceStartPos + 1 + closingBracePos,
          );
          const searchText = inputText.substring(braceStartPos + 1, endPos);
          const result = searchText.split(' ')[0];
          return result;
        }
      }
    } else {
      // 双大括号模式：检查光标是否在 {{ 后面
      if (cursorPosition >= braceStartPos + 2) {
        const match = inputText.match(/{{([^}]*)$/);
        if (match) {
          // 提取光标前的内容作为搜索文本
          const searchText = inputText.substring(
            braceStartPos + 2,
            cursorPosition,
          );
          return searchText.split(' ')[0];
        }
      }
    }
  }

  // 光标不在 { 或 {{ 后面时，返回空字符串（不进行搜索）
  return '';
};
