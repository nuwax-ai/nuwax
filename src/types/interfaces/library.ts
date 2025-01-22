import type { PluginModeEnum } from '@/types/enums/library';
import type { CustomPopoverItem } from '@/types/interfaces/common';

// 组件库单个组件项
export interface ComponentItemProps {
  title: string;
  desc: string;
  img: string;
  onClick: (type: CustomPopoverItem) => void;
}

// 新建、更新插件组件
export interface CreateNewPluginProps {
  type?: PluginModeEnum;
  open: boolean;
  onCancel: () => void;
}
