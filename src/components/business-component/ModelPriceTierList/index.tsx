import type { ModelPricingInfo } from '@/pages/SpaceResource/types/resource';
import { dict } from '@/services/i18nRuntime';
import { Tag } from 'antd';
import React from 'react';
import styles from './index.less';

export interface ModelPriceTierListProps {
  /** 模型阶梯价格档位 */
  tiers?: ModelPricingInfo[];
}

/**
 * 模型阶梯价格展示（与 ModelPricingTab 定价档位列布局、样式一致）
 */
const ModelPriceTierList: React.FC<ModelPriceTierListProps> = ({ tiers }) => {
  if (!tiers?.length) {
    return <>-</>;
  }

  return (
    <div className={styles['model-tier-list']}>
      {tiers.map((tier, index) => (
        <Tag key={tier.id ?? index} className={styles['model-tier-item']}>
          <span className={styles['model-tier-context']}>
            {`≤${tier.contextLength}K`}
          </span>
          <span className={styles['model-tier-separator']}>|</span>
          <span className={styles['model-tier-price']}>
            {dict('PC.Pages.SpaceResourcePricing.inputPriceLabel')}¥
            {tier.inputPrice}
          </span>
          <span className={styles['model-tier-separator']}>|</span>
          <span className={styles['model-tier-price']}>
            {dict('PC.Pages.SpaceResourcePricing.outputPriceLabel')}¥
            {tier.outputPrice}
          </span>
          {tier.cachePrice > 0 && (
            <>
              <span className={styles['model-tier-separator']}>|</span>
              <span className={styles['model-tier-cache-price']}>
                {dict('PC.Pages.SpaceResourcePricing.cachePriceLabel')}¥
                {tier.cachePrice}
              </span>
            </>
          )}
        </Tag>
      ))}
    </div>
  );
};

export default ModelPriceTierList;
