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
  // 与输入
  placeholder?: string;
  // 新增：接受当前值
  value: string;
  // 父组件传递的方法，改变当前的值，渲染页面
  onChange: (value: string, type?: 'Input' | 'Reference') => void;
  // 新增类型定义
  form?: FormInstance; // 表单实例
  fieldName?: (string | number)[]; // 当前字段完整路径（如 "inputItems[0].bindValue"）
  inputItemName?: string; // 列表字段名称（默认 "inputItems"）
  style?: any;
  isDisabled?: boolean;
  referenceType?: 'Input' | 'Reference';
  isLoop?: boolean;
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
