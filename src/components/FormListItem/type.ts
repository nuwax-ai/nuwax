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
  // 新增类型定义
  form: FormInstance; // 表单实例
  fieldName: string; // 当前字段完整路径（如 "inputItems[0].bindValue"）
  inputItemName?: string; // 列表字段名称（默认 "inputItems"）
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
  params: NodeConfig;
  // 改变节点的入参和出参
  handleChangeNodeConfig: (params: NodeConfig) => void;
  // 标题
  title: string;
}
