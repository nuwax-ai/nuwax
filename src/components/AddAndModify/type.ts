import { AnyObject } from 'antd/es/_util/type';
export interface FormItem {
  label: string;
  dataIndex: string;
  type: string;
  options?: Array<{
    label: string;
    value: string | number;
  }>;
  // 表单校验规则
  rules?: AnyObject[];
  placeholder?: string;
  isSpan?: boolean;
}

export interface AddedProps {
  // 表单提交的回调函数，参数为表单的值
  onSubmit: (values: AnyObject) => void;
  // 表单的宽度
  width?: number;
}
