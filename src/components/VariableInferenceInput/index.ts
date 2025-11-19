/*
 * Variable Inference Input Component Entry
 * 变量智能推断输入组件入口文件
 */

// 从 VariableInferenceInput.tsx 导入组件
export { VariableSegmentType, VariableType } from './types';
export type {
  CompletionContext,
  PromptVariable,
  VariableInferenceInputProps,
  VariableParseData,
  VariableSegment,
  VariableTreeNode,
} from './types';
export { default } from './VariableInferenceInput';

// 导出工具函数
export * from './utils/parser';
export * from './utils/treeUtils';

// 导出示例
export { default as VariableInferenceInputExample } from './example';
