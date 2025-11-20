/*
 * Variable Inference Input Component Types
 * 变量智能推断输入组件类型定义
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
}

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

// 匹配模式枚举
export enum MatchMode {
  EXACT = 'exact', // 精确匹配
  FUZZY = 'fuzzy', // 模糊匹配
  PREFIX = 'prefix', // 前缀匹配
  REGEX = 'regex', // 正则表达式匹配
}

export interface VariableTreeNode {
  key: string;
  label: string;
  value: string;
  variable?: PromptVariable;
  children?: VariableTreeNode[];
  isLeaf?: boolean;
}

export interface CompletionContext {
  text: string;
  from: number;
  to: number;
}

export interface VariableInferenceInputProps {
  /** 可用变量列表 */
  variables?: PromptVariable[];
  /** 技能列表 */
  skills?: any[];
  /** 是否只读模式 */
  readonly?: boolean;
  /** 弹窗方向 - 已废弃，现在使用智能动态定位 */
  direction?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
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
}
