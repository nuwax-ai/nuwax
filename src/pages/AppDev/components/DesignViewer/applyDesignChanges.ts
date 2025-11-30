/**
 * 应用设计更改到文件内容
 * @param fileContent 原始文件内容
 * @param changes 更改列表
 * @returns 更新后的文件内容
 */
export const applyDesignChanges = (
  fileContent: string,
  changes: Array<{
    type: 'style' | 'content';
    sourceInfo: any;
    newValue: string;
    originalValue?: string;
  }>,
): string => {
  let updatedContent = fileContent;

  // 1. 按位置从后往前排序，防止索引偏移
  const sortedChanges = [...changes].sort((a, b) => {
    if (a.sourceInfo.lineNumber !== b.sourceInfo.lineNumber) {
      return b.sourceInfo.lineNumber - a.sourceInfo.lineNumber;
    }
    return b.sourceInfo.columnNumber - a.sourceInfo.columnNumber;
  });

  // 辅助函数：获取指定行列在字符串中的索引
  const getIndex = (line: number, col: number, text: string) => {
    const lines = text.split('\n');
    let index = 0;
    // line 是 1-based
    for (let i = 0; i < line - 1 && i < lines.length; i++) {
      index += lines[i].length + 1; // +1 是换行符
    }
    // col 是 1-based
    return index + (col - 1);
  };

  // 2. 应用每个修改
  for (const change of sortedChanges) {
    const { lineNumber, columnNumber } = change.sourceInfo;
    const startIndex = getIndex(lineNumber, columnNumber, updatedContent);

    // 确保索引在有效范围内
    if (startIndex < 0 || startIndex >= updatedContent.length) {
      console.warn(
        `[DesignViewer] Invalid position for change: ${lineNumber}:${columnNumber}`,
      );
      continue;
    }

    if (change.type === 'style') {
      // 样式修改：查找 className 并替换
      // 从 startIndex 开始查找标签结束符 >
      const tagEndIndex = updatedContent.indexOf('>', startIndex);
      if (tagEndIndex === -1) continue;

      const tagContent = updatedContent.substring(startIndex, tagEndIndex);

      // 查找 className 属性
      // 匹配 className="...", className='...', className={...}
      const classNameRegex = /className=(["'])(.*?)\1|className={([^}]*)}/;
      const match = tagContent.match(classNameRegex);

      if (match) {
        // 如果找到了 className，替换它
        // match.index 是相对于 tagContent 的偏移
        const matchStart = startIndex + (match.index || 0);
        const matchLength = match[0].length;

        // 构建新的 className 字符串
        // 保持原有的引号类型，或者默认使用双引号
        const quote = match[1] || '"';
        const newClassNameAttr = `className=${quote}${change.newValue}${quote}`;

        updatedContent =
          updatedContent.substring(0, matchStart) +
          newClassNameAttr +
          updatedContent.substring(matchStart + matchLength);
      } else {
        // 如果没找到 className，插入它
        // 在标签名后或属性前插入，简单起见插在 > 前，但要处理自闭合 />
        let insertPos = tagEndIndex;
        if (
          updatedContent.substring(tagEndIndex - 1, tagEndIndex + 1) === '/>'
        ) {
          insertPos = tagEndIndex - 1;
        }

        // 确保前面有空格
        const prefix = updatedContent[insertPos - 1] === ' ' ? '' : ' ';
        const newAttr = `${prefix}className="${change.newValue}"`;

        updatedContent =
          updatedContent.substring(0, insertPos) +
          newAttr +
          updatedContent.substring(insertPos);
      }
    } else if (change.type === 'content') {
      // 内容修改：替换标签内的文本
      // 假设是简单文本节点：<Tag>Text</Tag>
      const tagEndIndex = updatedContent.indexOf('>', startIndex);
      if (tagEndIndex === -1) continue;

      // 内容开始位置
      const contentStart = tagEndIndex + 1;

      // 查找下一个 < (可能是结束标签或子标签)
      const nextTagIndex = updatedContent.indexOf('<', contentStart);

      if (nextTagIndex !== -1) {
        updatedContent =
          updatedContent.substring(0, contentStart) +
          change.newValue +
          updatedContent.substring(nextTagIndex);
      }
    }
  }

  return updatedContent;
};
