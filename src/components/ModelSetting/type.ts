import type { ModelListItemProps } from '@/types/interfaces/model';
import { NodeConfig } from '@/types/interfaces/node';
import type { FormInstance } from 'antd';
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
  onChange: (value: NodeConfig) => void;
  nodeConfig: NodeConfig;
  groupedOptionsData?: GroupModelItem[];
}

export interface ModelSettingProp {
  form: FormInstance;
  modelConfig?: any;
  /** 父组件统一拉取的模型列表，供下拉与参数弹窗共享 */
  modelList?: ModelListItemProps[];
  /** 按协议分组后的下拉选项 */
  groupedOptionsData?: GroupModelItem[];
  /** 模型列表加载中 */
  loading?: boolean;
}
