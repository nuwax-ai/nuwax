import type { ModelListItemProps } from '@/types/interfaces/model';
import { LLMNodeConfig } from '@/types/interfaces/node';
// type.ts 或 types/index.ts
interface GroupModelItem {
  // 分组的名称
  label: string;
  options: ModelListItemProps[];
}

export interface GroupModel {
  label: string;
  options: ModelListItemProps[];
}

// 定义分组的模型列表
export interface GroupModelListItemProps {
  onChange: (value: LLMNodeConfig) => void;
  nodeConfig: LLMNodeConfig;
  groupedOptionsData?: GroupModelItem[];
}

export interface ModelSettingProp {
  nodeConfig: LLMNodeConfig;
  onChange: (newConfig: LLMNodeConfig) => void;
  groupedOptionsData?: GroupModelItem[];
}
