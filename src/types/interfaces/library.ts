import type { ComponentMoreActionEnum } from '@/types/enums/library';

// 组件库单个组件项
export interface ComponentItemProps {
  title: string;
  desc: string;
  img: string;
  onClickMore: (type: ComponentMoreActionEnum) => void;
}
