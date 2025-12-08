/*
 * Tiptap Variable Input Component Types
 * Tiptap 变量输入组件类型定义
 */

/**
 * 变量类型枚举
 */
export enum VariableType {
  String = 'string',
  Integer = 'integer',
  Boolean = 'boolean',
  Number = 'number',
  Object = 'object',
  Array = 'array',
  ArrayString = 'array_string',
  ArrayInteger = 'array_integer',
  ArrayBoolean = 'array_boolean',
  ArrayNumber = 'array_number',
  ArrayObject = 'array_object',
}

/**
 * 变量定义接口
 */
export interface PromptVariable {
  /** 变量标识符 */
  key: string;
  /** 变量类型 */
  type: VariableType;
  /** 变量显示名称 */
  name: string;
  /** 变量描述 */
  description?: string;
  /** 子变量 */
  children?: PromptVariable[];
  /** 自定义显示标签 */
  label?: string;
  /** 变量数据示例 */
  example?: any;
  /** 是否是系统变量 */
  systemVariable?: boolean;
}

/**
 * 变量树节点接口
 */
export interface VariableTreeNode {
  key: string;
  label: string;
  value: string;
  variable?: PromptVariable;
  children?: VariableTreeNode[];
  isLeaf?: boolean;
}

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
  /** 是否启用 Markdown 快捷语法（所见即所得），默认关闭 */
  enableMarkdown?: boolean;
  /** 是否启用可编辑变量节点，默认开启。开启时使用 EditableVariableNode 替代 VariableNode */
  enableEditableVariables?: boolean;
  /** 变量实现模式: 'node' | 'mark' | 'text'，默认 'text' */
  variableMode?: 'node' | 'mark' | 'text';
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
