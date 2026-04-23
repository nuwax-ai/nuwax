/**
 * smartReplace 共享工具函数
 */

import type { ContentMultiLineResult, SmartReplaceOptions } from './types';

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 结构化内容替换基础逻辑（React/Vue 共用）
 * @param stripOpenTag 清理 openTag 中框架特有属性的函数（如 dangerouslySetInnerHTML / v-html）
 */
export function structuralReplaceBase(
  lines: string[],
  startLine: number,
  options: SmartReplaceOptions,
  stripOpenTag: (openTag: string) => string,
): ContentMultiLineResult {
  const { newValue, columnNumber } = options;
  let colIndex = -1;
  let targetLineIndex = startLine;
  const currentLine = lines[startLine];

  if (columnNumber !== undefined) {
    colIndex = columnNumber - 1;
  }

  const isValidTagStart = (index: number, line: string) =>
    line[index] === '<' && line[index + 1] !== '/';

  if (
    colIndex === -1 ||
    colIndex >= currentLine.length ||
    !isValidTagStart(colIndex, currentLine)
  ) {
    if (options.tagName) {
      const searchLimit = Math.min(startLine + 300, lines.length);
      const escapedTagName = escapeRegExp(options.tagName);
      const tagRegex = new RegExp(`<${escapedTagName}(?=[\\s>/>])`);

      for (let i = startLine; i < searchLimit; i++) {
        const match = lines[i].match(tagRegex);
        if (match && match.index !== undefined) {
          colIndex = match.index;
          targetLineIndex = i;
          break;
        }
      }
    }
  }

  if (colIndex !== -1 && targetLineIndex < lines.length) {
    const targetLine = lines[targetLineIndex];
    if (isValidTagStart(colIndex, targetLine)) {
      const lineSuffix = targetLine.substring(colIndex);
      const tagMatch = lineSuffix.match(/^<([a-zA-Z0-9-.]+)/);

      if (tagMatch) {
        const tagName = tagMatch[1];
        let tagEndIndex = -1;
        let isSelfClosing = false;

        let inQuote: string | null = null;
        for (let i = colIndex; i < targetLine.length; i++) {
          const char = targetLine[i];
          if (inQuote) {
            if (char === inQuote) inQuote = null;
          } else {
            if (char === '"' || char === "'") inQuote = char;
            else if (char === '>') {
              tagEndIndex = i;
              if (targetLine[i - 1] === '/') isSelfClosing = true;
              break;
            }
          }
        }

        if (tagEndIndex !== -1) {
          let openTagContent = stripOpenTag(
            targetLine.substring(colIndex, tagEndIndex + 1),
          );

          if (isSelfClosing) {
            const newOpenTag = openTagContent.replace(/\s*\/>$/, '>');
            const newContent = `${newOpenTag}${newValue}</${tagName}>`;
            return {
              found: true,
              startLine: targetLineIndex,
              endLine: targetLineIndex,
              newLines: [
                targetLine.substring(0, colIndex) +
                  newContent +
                  targetLine.substring(tagEndIndex + 1),
              ],
            };
          }

          const closingTag = `</${tagName}>`;
          const closingTagIndex = targetLine.indexOf(closingTag, tagEndIndex);

          if (closingTagIndex !== -1) {
            return {
              found: true,
              startLine: targetLineIndex,
              endLine: targetLineIndex,
              newLines: [
                targetLine.substring(0, colIndex) +
                  openTagContent +
                  newValue +
                  targetLine.substring(closingTagIndex),
              ],
            };
          }

          // Multi-line closing tag search
          for (let j = targetLineIndex + 1; j < lines.length; j++) {
            const closeIdx = lines[j].indexOf(closingTag);
            if (closeIdx !== -1) {
              const prefix = lines[targetLineIndex].substring(0, colIndex);
              const suffix = lines[j].substring(closeIdx + closingTag.length);
              return {
                found: true,
                startLine: targetLineIndex,
                endLine: j,
                newLines: [
                  prefix + openTagContent + newValue + `</${tagName}>` + suffix,
                ],
              };
            }
          }
        }
      }
    }
  }

  return { found: false, startLine, newLines: [] };
}
