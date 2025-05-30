import {
  ICON_AUDIT,
  ICON_GROUP_SET,
  ICON_PUBLISHED,
} from '@/constants/images.constants';
import { EcosystemMarketEnum } from '@/types/enums/ecosystemMarket';

// 生态市场应用列表（layout二级菜单）
export const ECOSYSTEM_MARKET_LIST = [
  {
    type: EcosystemMarketEnum.Plugin,
    icon: <ICON_GROUP_SET />,
    text: '插件',
  },
  {
    type: EcosystemMarketEnum.Template,
    icon: <ICON_AUDIT />,
    text: '模板',
  },
  {
    type: EcosystemMarketEnum.MCP,
    icon: <ICON_PUBLISHED />,
    text: 'MCP',
  },
];
