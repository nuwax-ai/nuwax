import { ResourcePricingType } from '@/pages/SpaceResource/types/resource';
import { dict } from '@/services/i18nRuntime';

/** 资源定价类型对应的 i18n key */
export const PRICING_TYPE_LABEL_KEY: Record<ResourcePricingType, string> = {
  [ResourcePricingType.ONE_TIME]:
    'PC.Pages.SpaceResourcePricing.pricingTypeOneTime',
  [ResourcePricingType.BUYOUT]:
    'PC.Pages.SpaceResourcePricing.pricingModeBuyout',
  [ResourcePricingType.MONTHLY]:
    'PC.Pages.SpaceResourcePricing.pricingTypeMonthly',
  [ResourcePricingType.TIERED]:
    'PC.Pages.SpaceResourcePricing.pricingTypeTiered',
  [ResourcePricingType.SECOND]: 'PC.Pages.SpaceResourcePricing.periodSecond',
  [ResourcePricingType.MILLION_TOKEN]:
    'PC.Pages.SpaceResourcePricing.periodMillionToken',
};

/** 工具定价计价周期选项（下拉 value + 单位展示文案） */
export const TOOL_PRICING_TYPE_OPTIONS: {
  value: ResourcePricingType;
  labelKey: string;
}[] = [
  {
    value: ResourcePricingType.ONE_TIME,
    labelKey: 'PC.Pages.SpaceResourcePricing.periodOnce',
  },
  {
    value: ResourcePricingType.SECOND,
    labelKey: 'PC.Pages.SpaceResourcePricing.periodSecond',
  },
  {
    value: ResourcePricingType.MILLION_TOKEN,
    labelKey: 'PC.Pages.SpaceResourcePricing.periodMillionToken',
  },
];

/** 工具定价列表价格列单位文案 */
export const getToolPricingPeriodLabel = (type?: ResourcePricingType) => {
  const option = TOOL_PRICING_TYPE_OPTIONS.find((item) => item.value === type);
  return dict(option?.labelKey || 'PC.Pages.SpaceResourcePricing.periodOnce');
};

/** 获取资源定价类型的展示文案 */
export const getPricingTypeLabel = (type: ResourcePricingType) =>
  dict(PRICING_TYPE_LABEL_KEY[type] || type);
