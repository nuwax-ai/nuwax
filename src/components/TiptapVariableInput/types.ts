/*
 * Tiptap Variable Input Component Types
 * Tiptap 变量输入组件类型定义
 */

import type {
  PromptVariable,
  VariableTreeNode,
} from '../VariableInferenceInput/types';

/**
 * Mentions 项数据结构
 */
export interface MentionItem {
  /** 唯一标识符 */
  id: string;
  /** 显示标签 */
  label: string;
  /** 类型 */
  type?: 'user' | 'file' | 'datasource' | 'custom';
  /** 附加数据 */
  data?: any;
}

/**
 * Tiptap Variable Input 组件 Props
 */
export interface TiptapVariableInputProps {
  /** 可用变量列表 */
  variables?: PromptVariable[];
  /** 技能列表 */
  skills?: any[];
  /** Mentions 数据列表（用于 @ 补全） */
  mentions?: MentionItem[];
  /** 是否只读模式 */
  readonly?: boolean;
  /** 占位符文本 */
  placeholder?: string;
  /** 输入框值变化回调 */
  onChange?: (value: string) => void;
  /** 变量选择回调 */
  onVariableSelect?: (variable: PromptVariable, path: string) => void;
  /** 默认值 */
  defaultValue?: string;
  /** 受控值 */
  value?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 样式类名 */
  className?: string;
  /** 输入框样式 */
  style?: React.CSSProperties;
  /** 是否禁用 @ mentions 建议 */
  disableMentions?: boolean;
  /** 获取编辑器实例 */
  getEditor?: (editor: any) => void;
}

/**
 * Suggestion 命令参数
 */
export interface SuggestionCommandProps {
  editor: any;
  range: { from: number; to: number };
  props: any;
}

/**
 * Variable Suggestion 项
 */
export interface VariableSuggestionItem {
  key: string;
  label: string;
  value: string;
  node?: VariableTreeNode;
  isTool?: boolean;
  toolData?: any;
}
