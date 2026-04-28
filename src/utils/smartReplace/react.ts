/**
 * React JSX 智能源码替换
 * 处理 className, className={expr}, dangerouslySetInnerHTML 等 React 语法
 */

import type {
  ContentMultiLineResult,
  MultiLineResult,
  SingleLineResult,
  SmartReplaceOptions,
} from './types';

import { escapeRegExp, structuralReplaceBase } from './shared';

/**
 * React 单行样式替换：className="..." / className={...}
 */
export async function replaceStyleSingleLine(
  line: string,
  newValue: string,
): Promise<SingleLineResult> {
  // 1. className="..." or className='...'
  const classNameRegex = /className=(["'])(.*?)\1/;
  if (classNameRegex.test(line)) {
    return {
      found: true,
      newLine: line.replace(classNameRegex, `className=$1${newValue}$1`),
    };
  }

  // 2. className={dynamic expression} — 设计模式仅支持静态 class，动态表达式降级为静态值
  const classNameExpressionRegex = /className=\{([^}]*)\}/;
  if (classNameExpressionRegex.test(line)) {
    return {
      found: true,
      newLine: line.replace(
        classNameExpressionRegex,
        `className="${newValue}"`,
      ),
    };
  }

  return { found: false, newLine: line };
}

/**
 * React 多行样式替换
 */
export async function replaceStyleMultiLine(
  lines: string[],
  startLine: number,
  options: SmartReplaceOptions,
): Promise<MultiLineResult> {
  const { newValue } = options;
  const currentLine = lines[startLine];

  // 1. 当前行
  const currentResult = await replaceStyleSingleLine(currentLine, newValue);
  if (currentResult.found) {
    return {
      found: true,
      lineIndex: startLine,
      newLine: currentResult.newLine,
    };
  }

  // 2. 向后搜索（最多15行）
  const maxSearchLines = Math.min(startLine + 15, lines.length);
  for (let i = startLine + 1; i < maxSearchLines; i++) {
    const result = await replaceStyleSingleLine(lines[i], newValue);
    if (result.found) {
      return { found: true, lineIndex: i, newLine: result.newLine };
    }

    const trimmed = lines[i].trim();
    if (trimmed === '>' || trimmed.endsWith('/>') || trimmed.startsWith('</')) {
      break;
    }
  }

  // 3. 插入 className 到标签名后
  const tagMatch = currentLine.match(/<([A-Z][a-zA-Z0-9.]*|[a-z][a-z0-9-]*)/);
  if (tagMatch) {
    const tagName = tagMatch[1];
    return {
      found: true,
      lineIndex: startLine,
      newLine: currentLine.replace(
        tagName,
        `${tagName} className="${newValue}"`,
      ),
    };
  }

  console.warn(
    '[SmartReplace:React] Failed to match className or tag at line:',
    startLine,
  );
  return { found: false, lineIndex: startLine, newLine: currentLine };
}

/**
 * React 结构化内容替换 fallback
 */
function structuralReplaceReact(
  lines: string[],
  startLine: number,
  options: SmartReplaceOptions,
): ContentMultiLineResult {
  return structuralReplaceBase(lines, startLine, options, (openTagContent) => {
    // React: strip dangerouslySetInnerHTML
    if (openTagContent.includes('dangerouslySetInnerHTML')) {
      return openTagContent
        .replace(/dangerouslySetInnerHTML=\{[^}]+\}/g, '')
        .replace(/dangerouslySetInnerHTML/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s+>/, '>')
        .replace(/\s+\/>/, '/>');
    }
    return openTagContent;
  });
}

/**
 * 安全替换行内内容（忽略标签内的文本）
 */
function safeReplaceContentInLine(
  line: string,
  originalValue: string,
  newValue: string,
): string {
  if (!originalValue) return line;

  const parts = line.split(/(<[^>]*>)/g);
  return parts
    .map((part) => {
      if (part.startsWith('<') && part.endsWith('>')) {
        return part;
      }
      return part.replace(
        new RegExp(escapeRegExp(originalValue), 'g'),
        newValue,
      );
    })
    .join('');
}

/**
 * React 内容替换（多行搜索）
 */
export async function replaceContentMultiLine(
  lines: string[],
  startLine: number,
  options: SmartReplaceOptions,
): Promise<ContentMultiLineResult> {
  const { originalValue, newValue } = options;

  const singleLineResult = (
    lineIndex: number,
    lineContent: string,
  ): ContentMultiLineResult => ({
    found: true,
    startLine: lineIndex,
    endLine: lineIndex,
    newLines: [lineContent],
  });

  const currentLine = lines[startLine];

  // 1. 当前行精确匹配
  if (originalValue) {
    const safeReplaced = safeReplaceContentInLine(
      currentLine,
      originalValue,
      newValue,
    );
    if (safeReplaced !== currentLine) {
      return singleLineResult(startLine, safeReplaced);
    }
  }

  // 2. 向后搜索（最多20行）
  const maxSearchLines = Math.min(startLine + 20, lines.length);
  for (let i = startLine + 1; i < maxSearchLines; i++) {
    const searchLine = lines[i];

    if (originalValue) {
      const safeReplaced = safeReplaceContentInLine(
        searchLine,
        originalValue,
        newValue,
      );
      if (safeReplaced !== searchLine) {
        return singleLineResult(i, safeReplaced);
      }
    }

    if (originalValue && searchLine.trim() === originalValue) {
      const leadingWhitespace = searchLine.match(/^(\s*)/)?.[1] || '';
      return singleLineResult(i, leadingWhitespace + newValue);
    }

    if (searchLine.trim().startsWith('</') || searchLine.includes('/>')) {
      break;
    }
  }

  // 3. 结构化替换 fallback
  return structuralReplaceReact(lines, startLine, options);
}
