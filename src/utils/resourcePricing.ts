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
};

/** 获取资源定价类型的展示文案 */
export const getPricingTypeLabel = (type: ResourcePricingType) =>
  dict(PRICING_TYPE_LABEL_KEY[type] || type);
