/*
 * Tiptap Variable Input Component Entry
 * Tiptap 变量输入组件入口文件
 */

export { default } from './TiptapVariableInput';
export type {
  MentionItem,
  TiptapVariableInputProps,
  VariableSuggestionItem,
} from './types';

// 导出扩展（供高级用户使用）
export { HTMLTagProtection } from './extensions/HTMLTagProtection';
export { MentionNode } from './extensions/MentionNode';
export { MentionSuggestion } from './extensions/MentionSuggestion';
export { RawNode } from './extensions/RawNode';
export { ToolBlockNode } from './extensions/ToolBlockNode';
export { VariableNode } from './extensions/VariableNode';
export { VariableSuggestion } from './extensions/VariableSuggestion';
