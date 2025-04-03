import type { CardStyleEnum } from '@/types/enums/common';
import type { BindCardStyleEnum } from '@/types/enums/plugin';

// 卡片绑定配置信息
export interface CardBindConfig {
  cardId: number;
  cardKey: CardStyleEnum;
  bindCardStyle: BindCardStyleEnum;
  maxCardCount: number;
  bindArray: string;
  cardArgsBindConfigs: {
    key: string;
    bindValue: string;
  }[];
  bindLinkUrl: string;
}

// 单张卡片数据
export interface CardDataInfo {
  image: string;
  title: string;
  content: string;
  bindLinkUrl: string;
  // 自定义属性，用于匹配卡片组件
  cardKey: CardStyleEnum;
}

// 单张卡片
export interface CardProps extends CardDataInfo {
  className?: string;
  onClick: () => void;
}
