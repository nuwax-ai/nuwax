import { dict } from '@/services/i18nRuntime';
import { CheckOutlined } from '@ant-design/icons';
import classNames from 'classnames';
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
    <>
      {/* 背景装饰元素 */}
      <div className={styles['current-plan-card']}>
        <div className={styles['bg-decoration-1']} />
        <div className={styles['bg-decoration-2']} />
        <div className={styles['card-content']}>
          <div className={styles['plan-header']}>
            <div className={styles['header-left']}>
              <div className={styles['current-plan-label']}>
                {dict('PC.Pages.MorePage.MySubscriptions.currentPlan')}
              </div>
              <div className={styles['plan-name']}>{planInfo.planName}</div>
              <div className={styles['plan-validity']}>
                {dict('PC.Pages.MorePage.MySubscriptions.expireTime')}:{' '}
                {planInfo.expireAt} · 每月续费
              </div>
            </div>
            <div className={styles['plan-status']}>
              <CheckOutlined className={styles['status-icon']} />
              {dict('PC.Pages.MorePage.MySubscriptions.statusActive')}
            </div>
          </div>

          <div className={styles['plan-meta']}>
            <div className={styles['plan-meta-item']}>
              <span className={styles['meta-label']}>
                {dict('PC.Pages.MorePage.MySubscriptions.monthlyFee')}
              </span>
              <span className={styles['meta-value']}>¥{planInfo.price}</span>
            </div>
            <div className={styles['plan-meta-item']}>
              <span className={styles['meta-label']}>
                {dict('PC.Pages.MorePage.MySubscriptions.monthlyCredits')}
              </span>
              <span className={styles['meta-value']}>
                {planInfo.monthlyCredits.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 积分明细 */}
      <div className={styles['credits-breakdown']}>
        <div className={styles['credits-item']}>
          <div className={styles['credits-label-area']}>
            <span className={styles['credits-label']}>
              {dict('PC.Pages.MorePage.MySubscriptions.totalCredits')}
            </span>
            <span
              className={styles['credits-detail-link']}
              onClick={() => history.push('/more-page/credit-records')}
            >
              {dict('PC.Pages.MorePage.MySubscriptions.detail')}
            </span>
          </div>
          <span className={styles['credits-value']}>
            {creditsBreakdown.total.toLocaleString()}
          </span>
        </div>

        <div className={styles['credits-item']}>
          <div className={styles['credits-label-area']}>
            <span className={styles['credits-label']}>
              {dict('PC.Pages.MorePage.MySubscriptions.subscriptionCredits')}
            </span>
          </div>
          <span className={classNames(styles['credits-value'], styles.blue)}>
            {creditsBreakdown.subscription.toLocaleString()}
          </span>
        </div>

        <div className={styles['credits-item']}>
          <div className={styles['credits-label-area']}>
            <span className={styles['credits-label']}>
              {dict('PC.Pages.MorePage.MySubscriptions.purchaseCredits')}
            </span>
            <span
              className={styles['add-purchase-link']}
              onClick={onAddPurchase}
            >
              {dict('PC.Pages.MorePage.MySubscriptions.addPurchase')}
            </span>
          </div>
          <span className={classNames(styles['credits-value'], styles.green)}>
            {creditsBreakdown.purchase.toLocaleString()}
          </span>
        </div>

        <div className={styles['credits-item']}>
          <div className={styles['credits-label-area']}>
            <span className={styles['credits-label']}>
              {dict('PC.Pages.MorePage.MySubscriptions.activityCredits')}
            </span>
          </div>
          <span className={classNames(styles['credits-value'], styles.orange)}>
            {creditsBreakdown.activity.toLocaleString()}
          </span>
        </div>
      </div>
    </>
  );
};

export default CurrentPlanCard;
