import { DataTypeEnum } from '@/types/enums/common';
import {
  NodeConfig,
  // ConditionBranchConfigs,
  NodePreviousAndArgMap,
} from '@/types/interfaces/node';
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
  // 当前的引用列表
  referenceList: NodePreviousAndArgMap;
  // 与输入
  placeholder?: string;
  // 新增：接受当前值
  value: string;
  // 父组件传递的方法，改变当前的值，渲染页面
  onChange: (value: string) => void;
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
// 定义传递给 renderItem 的参数类型
export interface RenderItemProps {
  // 当前字段的field
  field: FormListFieldData;
  // 删除当前行
  onRemove: () => void;
  // 当前渲染的详细信息
  fieldConfigs: FieldConfig[];
  // 父组件传递下来的form
  form: FormInstance;
  // 当前值改变的时候，通知父组件，重新获取值
  onChange: () => void;
  referenceList: NodePreviousAndArgMap;
  //   预显示的值，(通常用于二次编辑的时候)
  initialValues?: object;
  // 是否渲染复选框
  showCheckbox?: boolean;
  // 是否显示复制按钮
  showCopy?: boolean;
}

export interface TreeFormProps {
  params: NodeConfig;
  // 改变节点的入参和出参
  handleChangeNodeConfig: (params: NodeConfig) => void;
  // 标题
  title: string;
}
