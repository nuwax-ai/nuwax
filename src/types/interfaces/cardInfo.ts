import type { CardStyleEnum } from '@/types/enums/common';
import type { BindCardStyleEnum } from '@/types/enums/plugin';

// 卡片参数绑定配置信息详情
export interface CardArgsBindConfigInfo {
  // 卡片参数名称key
  key: string;
  // 卡片参数引用信息，例如插件的出参 data.xxx
  bindValue: string;
}

// 卡片绑定配置信息
export interface CardBindConfig {
  cardId: number;
  cardKey: CardStyleEnum;
  bindCardStyle: BindCardStyleEnum;
  maxCardCount: number;
  bindArray: string;
  cardArgsBindConfigs: CardArgsBindConfigInfo[];
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
export type CardProps = CardDataInfo;

export interface CardChildProps extends CardDataInfo {
  className?: string;
  onClick: () => void;
}
