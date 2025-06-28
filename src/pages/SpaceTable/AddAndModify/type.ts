export interface FormItem {
  label: string;
  name: string;
  type: string;
  options?: Array<{
    label: string;
    value: string | number;
  }>;
  // 表单校验规则
  rules?: {
    required?: boolean;
    message?: string;
  }[];
  placeholder?: string;
  isSpan?: boolean;
  maxLength?: number;
}

export interface AddedProps {
  // 表单提交的回调函数，参数为表单的值
  onSubmit: (values: { [key: string]: string | number | boolean }) => void;
  // 表单的宽度
  width?: number;
}
