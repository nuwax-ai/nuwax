// 定义可以展开的inputTextarea
export interface ExpandableInputTextareaProps {
  // 标题
  title: string;
  // 输入框的文字
  value: string;
  // 输入框的文字变化事件
  onChange: (value: string) => void;
  // 输入框的提示文字
  placeholder?: string;
  // 输入框的行数
  rows?: number;
  // 是否有展开的按钮
  onExpand?: boolean;
  // 是否有优化的按钮
  onOptimize?: boolean;
}

//
export interface ExpandableInputTextareaState {
  marginRight: number;
  title: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  // 输入框的提示文字
  placeholder?: string;
}
