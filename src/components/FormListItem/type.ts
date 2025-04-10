import { DataTypeEnum } from '@/types/enums/common';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { FormInstance } from 'antd';

export interface KeyValueTree {
  // 键值对的标签
  label: string;
  // 键值对对应的值
  value: DataTypeEnum;
  children?: KeyValueTree[];
}

// 定义输入或引用参数
export interface InputOrReferenceProps {
  placeholder?: string;
  form?: FormInstance; // 表单实例
  fieldName?: (string | number)[]; // 字段路径
  inputItemName?: string; // 输入项名称
  style?: React.CSSProperties; // 样式
  isDisabled?: boolean; // 是否禁用
  referenceType?: 'Input' | 'Reference'; // 引用类型
  isLoop?: boolean; // 是否循环
  value?: string; // 注入的值（由 Form.Item 提供）
  onChange?: (value: string) => void; // 注入的变更事件（由 Form.Item 提供）
}

/**
 * 定义 右侧节点数组设置。
 */
// 使用 antd 内置的 FormListFieldData 类型
export type FormListFieldData = {
  key: string | number;
  name: string | number;
  fieldKey?: string | number;
};

// 定义输入项配置类型
export interface FieldConfig {
  name: string;
  placeholder?: string;
  rules?: any[];
  component: React.ComponentType<any>;
  width: number;
  label: string;
  options?: KeyValueTree[];
}

export interface TreeFormProps {
  params?: InputAndOutConfig[];
  // 改变节点的入参和出参
  // 外部传递进来的form
  form: FormInstance;
  // 标题
  title?: string;
  inputItemName?:
    | 'inputArgs'
    | 'outputArgs'
    | 'variableArgs'
    | 'conditionBranchConfigs'
    | 'skillComponentConfigs'
    | 'body';
  notShowTitle?: boolean;
  showCheck?: boolean;
  isBody?: boolean;
}

export interface TreeFormSubProps {
  form: FormInstance;
  fieldName: string | (string | number)[];
  inputItemName: string;
  showCheck?: boolean;
  level: number;
}

export interface TreeFormSubRef {
  addChild: () => void; // 子组件暴露的 add 方法
}

export interface TreeFormItemProps {
  form: FormInstance;
  field: FormListFieldData;
  fieldName: (string | number)[];
  remove: (index: number | number[]) => void;
  showCheck?: boolean;
  inputItemName?: string;
}

export interface TreeInputProps {
  form: FormInstance;
  title: string;
  params: InputAndOutConfig[];
}
