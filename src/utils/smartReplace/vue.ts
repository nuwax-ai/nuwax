/**
 * Vue SFC 模板智能源码替换
 * 处理 class, :class, v-bind:class, v-html, {{ }} 插值等 Vue 语法
 */

import type {
  ContentMultiLineResult,
  MultiLineResult,
  SingleLineResult,
  SmartReplaceOptions,
} from './types';

import { escapeRegExp, structuralReplaceBase } from './shared';

/**
 * Vue 单行样式替换：class="..." / :class="..." / v-bind:class="..."
 */
export async function replaceStyleSingleLine(
  line: string,
  newValue: string,
): Promise<SingleLineResult> {
  // 1. class="..." or class='...'
  const classAttrRegex = /\bclass=(["'])(.*?)\1/;
  if (classAttrRegex.test(line)) {
    return {
      found: true,
      newLine: line.replace(classAttrRegex, `class=$1${newValue}$1`),
    };
  }

  // 2. :class="..."（v-bind shorthand）— 设计模式仅支持静态 class，动态绑定降级为静态值
  const classBindRegex = /:class=(["'])(.*?)\1/;
  if (classBindRegex.test(line)) {
    return {
      found: true,
      newLine: line.replace(classBindRegex, `class=$1${newValue}$1`),
    };
  }

  // 3. v-bind:class="..."（full syntax）
  const vBindClassRegex = /v-bind:class=(["'])(.*?)\1/;
  if (vBindClassRegex.test(line)) {
    return {
      found: true,
      newLine: line.replace(vBindClassRegex, `class=$1${newValue}$1`),
    };
  }

  return { found: false, newLine: line };
}

/**
 * Vue 多行样式替换
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

  // 3. 插入 class 到标签名后（Vue 用 class，不是 className）
  const tagMatch = currentLine.match(/<([A-Z][a-zA-Z0-9.]*|[a-z][a-z0-9-]*)/);
  if (tagMatch) {
    const tagName = tagMatch[1];
    return {
      found: true,
      lineIndex: startLine,
      newLine: currentLine.replace(tagName, `${tagName} class="${newValue}"`),
    };
  }

  console.warn(
    '[SmartReplace:Vue] Failed to match class or tag at line:',
    startLine,
  );
  return { found: false, lineIndex: startLine, newLine: currentLine };
}

/**
 * Vue 结构化内容替换 fallback
 * 处理 v-html（对应 React 的 dangerouslySetInnerHTML）
 */
function structuralReplaceVue(
  lines: string[],
  startLine: number,
  options: SmartReplaceOptions,
): ContentMultiLineResult {
  return structuralReplaceBase(lines, startLine, options, (openTagContent) => {
    // Vue: strip v-html
    if (openTagContent.includes('v-html')) {
      return openTagContent
        .replace(/v-html=(["'])([^"']*)\1/g, '')
        .replace(/v-html/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s+>/, '>')
        .replace(/\s+\/>/, '/>');
    }
    return openTagContent;
  });
}

/**
 * Vue 安全内容替换
 * 与 React 版本类似，但额外保护 {{ }} 插值表达式不被误替换
 */
function safeReplaceContentVue(
  line: string,
  originalValue: string,
  newValue: string,
): string {
  if (!originalValue) return line;

  // Split by HTML tags AND Vue {{ }} interpolation (use .*? to handle nested } like {{ obj.key }})
  const parts = line.split(/(<[^>]*>|\{\{.*?\}\})/g);
  return parts
    .map((part) => {
      // Protect tags and {{ }} expressions from replacement
      if (
        (part.startsWith('<') && part.endsWith('>')) ||
        (part.startsWith('{{') && part.endsWith('}}'))
      ) {
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
 * Vue 内容替换（多行搜索）
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
    const safeReplaced = safeReplaceContentVue(
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
      const safeReplaced = safeReplaceContentVue(
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
  return structuralReplaceVue(lines, startLine, options);
}
