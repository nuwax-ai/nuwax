import type { TabsEnum, UserOperatorAreaEnum } from '@/types/enums/menus';

export interface UserOperateAreaType {
  onClick: (type: UserOperatorAreaEnum) => void;
}

export interface TabsType {
  onClick:  (type: TabsEnum) => void;
}