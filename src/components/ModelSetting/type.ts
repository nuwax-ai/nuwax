// type.ts 或 types/index.ts

export interface ModelListItemProps {
  icon: React.ReactNode;
  label: string;
  size: string | number;
  modelName?: string;
  desc?: string;
  tagList?: string[];
}

export interface GroupModelOption {
  icon: React.ReactNode;
  label: string;
  size: string | number;
  modelName: string;
  desc: string;
  value: string;
  tagList?: string[];
}

export interface GroupModel {
  label: string;
  options: GroupModelOption[];
}

export interface GroupModelListItemProps {
  groupedOptionsData: GroupModel[];
  onChange: (value: string) => void;
  value: string;
}

export interface ModelSettingProp {
  value: { top: number; reply: number; random: number };
  onChange: (newValue: { top: number; reply: number; random: number }) => void;
}

export interface ModelSelectProp {
  onSettingsChange?: (newSettings: {
    top: number;
    reply: number;
    random: number;
  }) => void;
  defaultSettings?: { top: number; reply: number; random: number };
  onModelChange?: (newModel: string) => void;
  defaultModel?: string;
  groupedOptionsData: GroupModel[];
}
