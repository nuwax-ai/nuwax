import type { AnyObject } from 'antd/es/_util/type';

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
}

export interface AddedProps {
  // 是否显示表单
  visible: boolean;
  // 表单的标题
  title: string;
  // 需要渲染的表单配置项
  formList: FormItem[];
  // 表单提交的回调函数，参数为表单的值
  onSubmit: (values: AnyObject) => void;
  // 表单取消的回调函数，参数为表单的值
  onCancel: () => void;
  // 表单的宽度
  width?: number;
  // 表单的初始值
  initialValues?: AnyObject;
}
