/**
 * smartReplace 类型定义
 */

export interface SmartReplaceOptions {
  lineNumber: number;
  columnNumber: number;
  newValue: string;
  originalValue?: string;
  type: 'style' | 'content' | 'attribute';
  tagName?: string;
}

export interface SingleLineResult {
  found: boolean;
  newLine: string;
}

export interface MultiLineResult {
  found: boolean;
  lineIndex: number;
  newLine: string;
}

export interface ContentMultiLineResult {
  found: boolean;
  startLine: number;
  endLine?: number;
  newLines: string[];
}

export type FrameworkType = 'react' | 'vue';

/**
 * 根据文件路径判断框架类型
 */
export function detectFramework(filePath: string): FrameworkType {
  if (filePath.endsWith('.vue')) return 'vue';
  return 'react'; // .tsx, .jsx, .js, .ts 等默认走 React 路径
}
