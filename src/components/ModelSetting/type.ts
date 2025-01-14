// type.ts 或 types/index.ts
interface GroupModelItem {
  // 分组的名称
  label: string;
  options: ModelListItemProps[];
}

// 定义模型列表
export interface ModelListItemProps {
  // 模型的图标
  icon: React.ReactNode;
  // 模型的名称
  label: string;
  // 模型的大小
  size: string | number;
  // 模型的id
  modelName: string;
  // 模型的简介
  desc: string;
  // 值
  value: string;
  // 模型的标签
  tagList?: string[];
}

export interface GroupModel {
  label: string;
  options: ModelListItemProps[];
}

// 定义分组的模型列表
export interface GroupModelListItemProps {
  groupedOptionsData?: GroupModelItem[];
  onChange: (value: string) => void;
  value?: string;
}

export interface ModelSettingProp {
  value: {
    top: number;
    reply: number;
    random: number;
  };
  onChange: (newSettings: {
    top: number;
    reply: number;
    random: number;
  }) => void;
}

export interface ModelSelectProp {
  settings: ModelSettingProp;
  groupModelList: GroupModelListItemProps;
}
