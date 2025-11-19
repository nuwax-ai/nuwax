/*
 * Prompt Variable Parser
 * 提示词变量解析器
 * 支持 {{变量名}}、{{变量名.子变量名}}、{{变量名[数组索引]}} 语法
 */

import type { VariableParseData, VariableSegment } from '../types';
import { VariableSegmentType } from '../types';

export enum VariableToken {
  Start = '{',
  End = '}',
  FullStart = '{{',
  FullEnd = '}}',
  Separator = '.',
  ArrayStart = '[',
  ArrayEnd = ']',
}

/**
 * 计算开始和结束标记的序号
 */
export const tokenOffset = (line: {
  lineContent: string;
  lineOffset: number;
}):
  | {
      lastStartTokenOffset: number;
      firstEndTokenOffset: number;
    }
  | undefined => {
  const { lineContent: content, lineOffset: offset } = line;

  const firstEndTokenOffset = content.indexOf(VariableToken.End, offset);

  const endChars = content.slice(firstEndTokenOffset, firstEndTokenOffset + 2);
  if (endChars !== VariableToken.FullEnd) {
    // 结束符号 "}}" 不完整
    return;
  }

  const lastStartTokenOffset = content.lastIndexOf(
    VariableToken.Start,
    offset - 1,
  );
  const startChars = content.slice(
    lastStartTokenOffset - 1,
    lastStartTokenOffset + 1,
  );
  if (startChars !== VariableToken.FullStart) {
    // 开始符号 "{{" 不完整
    return;
  }

  return {
    lastStartTokenOffset,
    firstEndTokenOffset,
  };
};

/**
 * 从行内容中提取变量内容
 */
export const extractContent = (params: {
  lineContent: string;
  lineOffset: number;
  lastStartTokenOffset: number;
  firstEndTokenOffset: number;
}):
  | {
      content: string;
      offset: number;
    }
  | undefined => {
  const { lineContent, lineOffset, lastStartTokenOffset, firstEndTokenOffset } =
    params;

  const content = lineContent.slice(
    lastStartTokenOffset + 1,
    firstEndTokenOffset,
  );
  const offset = lineOffset - lastStartTokenOffset - 1;

  return {
    content,
    offset,
  };
};

/**
 * 根据偏移量将文本内容分割为可达和不可达部分
 */
export const sliceReachable = (params: {
  content: string;
  offset: number;
}): {
  reachable: string;
  unreachable: string;
} => {
  const { content, offset } = params;
  const reachable = content.slice(0, offset);
  const unreachable = content.slice(offset, content.length);
  return {
    reachable,
    unreachable,
  };
};

/**
 * 分割文本路径
 * 支持 {{variable.property}} 和 {{variable[0]}} 语法
 */
export const splitText = (pathString: string): string[] => {
  // 获取的分割数组，初始为用 "." 分割原始字符串的结果
  const segments = pathString.split(VariableToken.Separator);

  // 定义结果数组并处理因连续 "." 产生的空字符串
  const result: string[] = [];

  segments.forEach((segment) => {
    if (!segment.match(/\[\d+\]/)) {
      // 如果不是数组索引，直接添加结果数组，即使是空字符串，以保持正确的分段
      result.push(segment);
      return;
    }

    // 如果当前段是数组索引，分别将前一个字符串和当前数组索引添加到结果数组
    const lastSegmentIndex = segment.lastIndexOf(VariableToken.ArrayStart);
    const key = segment.substring(0, lastSegmentIndex);
    const index = segment.substring(lastSegmentIndex);

    // {{array [0]}} 中的 array
    result.push(key);
    // {{array [0]}} 中的 [0]
    result.push(index);
  });

  return result;
};

/**
 * 将字符串解析为路径段
 */
export const toSegments = (text: string): VariableSegment[] | undefined => {
  const textSegments = splitText(text);
  const segments: VariableSegment[] = [];

  const validate = textSegments.every((textSegment, index) => {
    // 数组下标
    if (
      textSegment.startsWith(VariableToken.ArrayStart) &&
      textSegment.endsWith(VariableToken.ArrayEnd)
    ) {
      const arrayIndexString = textSegment.slice(1, -1);
      const arrayIndex = Number(arrayIndexString);

      if (arrayIndexString === '' || Number.isNaN(arrayIndex)) {
        // 索引必须是数字
        return false;
      }

      const lastSegment = segments[segments.length - 1];
      if (!lastSegment || lastSegment.type !== VariableSegmentType.ObjectKey) {
        // 数组索引必须在键之后
        return false;
      }

      segments.push({
        type: VariableSegmentType.ArrayIndex,
        index,
        arrayIndex,
      });
    }
    // 最后的空行文本
    else if (index === textSegments.length - 1 && textSegment === '') {
      segments.push({
        type: VariableSegmentType.EndEmpty,
        index,
      });
    } else {
      if (!textSegment || !/^[\u4e00-\u9fa5_a-zA-Z0-9]*$/.test(textSegment)) {
        return false;
      }
      segments.push({
        type: VariableSegmentType.ObjectKey,
        index,
        objectKey: textSegment,
      });
    }
    return true;
  });

  if (!validate) {
    return undefined;
  }

  return segments;
};

/**
 * 解析变量表达式
 */
export const parseVariableExpression = (line: {
  lineContent: string;
  lineOffset: number;
}): VariableParseData | undefined => {
  const { lineContent, lineOffset } = line;

  const tokenOffsets = tokenOffset(line);
  if (!tokenOffsets) {
    return;
  }

  const { lastStartTokenOffset, firstEndTokenOffset } = tokenOffsets;

  const extractedContent = extractContent({
    ...line,
    ...tokenOffsets,
  });
  if (!extractedContent) {
    return;
  }

  const { content, offset } = extractedContent;

  const slicedReachable = sliceReachable(extractedContent);
  if (!slicedReachable) {
    return;
  }

  const reachableSegments = toSegments(slicedReachable.reachable);
  const inlineSegments = toSegments(content);

  if (!reachableSegments) {
    return;
  }

  return {
    content: {
      line: lineContent,
      inline: content,
      reachable: slicedReachable.reachable,
      unreachable: slicedReachable.unreachable,
    },
    offset: {
      line: lineOffset,
      inline: offset,
      lastStart: lastStartTokenOffset,
      firstEnd: firstEndTokenOffset,
    },
    segments: {
      inline: inlineSegments,
      reachable: reachableSegments,
    },
  };
};

/**
 * 查找文本中所有的变量引用
 */
export const findAllVariableReferences = (text: string): string[] => {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const matches: string[] = [];
  let match;

  while ((match = variableRegex.exec(text)) !== null) {
    matches.push(match[0]);
  }

  return matches;
};

/**
 * 提取变量名（去掉花括号）
 */
export const extractVariableName = (
  variableReference: string,
): string | null => {
  const match = variableReference.match(/^\{\{(.+)\}\}$/);
  return match ? match[1] : null;
};

/**
 * 检查是否为有效的变量引用格式
 */
export const isValidVariableReference = (text: string): boolean => {
  return /^\{\{[\u4e00-\u9fa5_a-zA-Z0-9.[\]]*\}\}$/.test(text);
};
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
