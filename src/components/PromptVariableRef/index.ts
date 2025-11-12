/*
 * Prompt Variable Reference Component Entry
 * 提示词变量引用组件入口文件
 */

// 从 PromptVariableRef.tsx 导入组件
export { default } from './PromptVariableRef';
export { VariableSegmentType, VariableType } from './types';
export type {
  CompletionContext,
  PromptVariable,
  PromptVariableRefProps,
  VariableParseData,
  VariableSegment,
  VariableTreeNode,
} from './types';

// 导出工具函数
export * from './utils/parser';
export * from './utils/treeUtils';

// 导出示例
export { default as PromptVariableRefExample } from './example';
