import { dict } from '@/services/i18nRuntime';
import { Button } from 'antd';
import React from 'react';
import { history } from 'umi';
import styles from './index.less';

export interface PlanInfo {
  planName: string;
  price: number;
  expireAt: string;
  monthlyCredits: number;
  issuedCredits: number;
}

export interface CreditsBreakdown {
  total: number;
  subscription: number;
  purchase: number;
  activity: number;
}

interface CurrentPlanCardProps {
  planInfo: PlanInfo;
  creditsBreakdown: CreditsBreakdown;
  onAddPurchase: () => void;
}

/**
 * 当前订阅计划卡片组件
 */
const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({
  planInfo,
  creditsBreakdown,
  onAddPurchase,
}) => {
  return (
    <div className={styles.currentPlanCard}>
      <div className={styles.planHeader}>
        <div>
          <div className={styles.planName}>{planInfo.planName}</div>
          <div className={styles.planStatus}>
            {dict('PC.Pages.MorePage.MySubscriptions.statusActive')}
          </div>
        </div>
      </div>

      <div className={styles.planMeta}>
        <div className={styles.planMetaItem}>
          <span className={styles.metaLabel}>
            {dict('PC.Pages.MorePage.MySubscriptions.monthlyFee')}
          </span>
          <span className={styles.metaValue}>¥{planInfo.price}</span>
          <span className={styles.metaHint}>
            {dict(
              'PC.Pages.MorePage.MySubscriptions.renewedTo',
              planInfo.expireAt.slice(0, 7),
            )}
          </span>
        </div>
        <div className={styles.planMetaItem}>
          <span className={styles.metaLabel}>
            {dict('PC.Pages.MorePage.MySubscriptions.monthlyCredits')}
          </span>
          <span className={styles.metaValue}>
            {planInfo.monthlyCredits.toLocaleString()}
          </span>
          <span className={styles.metaHint}>
            {dict(
              'PC.Pages.MorePage.MySubscriptions.creditsIssued',
              String(planInfo.issuedCredits),
            )}
          </span>
        </div>
      </div>

      {/* 积分明细 */}
      <div className={styles.creditsBreakdown}>
        <div className={styles.creditsRow}>
          <span className={styles.creditsLabel}>
            {dict('PC.Pages.MorePage.MySubscriptions.totalCredits')}
            <span
              className={styles.creditsLink}
              onClick={() => history.push('/more-page/credit-records')}
            >
              {' '}
              {dict('PC.Pages.MorePage.MySubscriptions.detail')}
            </span>
          </span>
          <span className={styles.creditsValue}>
            {creditsBreakdown.total.toLocaleString()}
          </span>
        </div>
        <div className={styles.creditsRow}>
          <span className={styles.creditsLabel}>
            {dict('PC.Pages.MorePage.MySubscriptions.subscriptionCredits')}
          </span>
          <span className={styles.creditsValue}>
            {creditsBreakdown.subscription.toLocaleString()}
          </span>
        </div>
        <div className={styles.creditsRow}>
          <span className={styles.creditsLabel}>
            {dict('PC.Pages.MorePage.MySubscriptions.purchaseCredits')}
            <Button
              type="link"
              size="small"
              className={styles.addPurchaseBtn}
              onClick={onAddPurchase}
            >
              {dict('PC.Pages.MorePage.MySubscriptions.addPurchase')}
            </Button>
          </span>
          <span className={styles.creditsValue}>
            {creditsBreakdown.purchase.toLocaleString()}
          </span>
        </div>
        <div className={styles.creditsRow}>
          <span className={styles.creditsLabel}>
            {dict('PC.Pages.MorePage.MySubscriptions.activityCredits')}
          </span>
          <span className={styles.creditsValue}>
            {creditsBreakdown.activity.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CurrentPlanCard;
