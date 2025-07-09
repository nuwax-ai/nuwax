import { FormInstance } from 'antd';

// 定义可以展开的inputTextarea
export interface ExpandableInputTextareaProps {
  // 标题
  title: React.ReactNode;
  // 输入框的文字
  inputFieldName: string;
  // 输入框的提示文字
  placeholder?: string;
  // 输入框的行数
  rows?: number;
  // 是否有展开的按钮
  onExpand?: boolean;
  // 是否有优化的按钮
  onOptimize?: boolean;
  // 优化的回调函数
  onOptimizeClick?: () => void;
  // 输入参数
  inputVariables?: any;
  // 输入框的值
  value?: string;
  // 表单
  form?: FormInstance;
}

//
export interface ExpandableInputTextareaState {
  marginRight: number;
  title: string;
  // 输入框的文字
  inputFieldName: string;
  onClose: () => void;
  // 输入框的提示文字
  placeholder?: string;
}
