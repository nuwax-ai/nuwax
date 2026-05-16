import { dict } from '@/services/i18nRuntime';
import { CreditSummaryInfo } from '@/types/interfaces/subscription';
import { Statistic } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { history } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

interface CreditsBreakdownProps {
  summary?: CreditSummaryInfo;
  onAddPurchase: () => void;
}

/**
 * 积分明细组件
 */
const CreditsBreakdown: React.FC<CreditsBreakdownProps> = ({
  summary,
  onAddPurchase,
}) => {
  return (
    <div className={cx(styles['credits-breakdown'])}>
      <div className={cx(styles['credits-item'])}>
        <div className={cx(styles['credits-label-area'])}>
          <span className={cx(styles['credits-label'])}>
            {dict('PC.Pages.MorePage.MySubscriptions.totalCredits')}
          </span>
          <span
            className={cx(styles['credits-detail-link'])}
            onClick={() => history.push('/more-page/credit-records')}
          >
            {dict('PC.Pages.MorePage.MySubscriptions.detail')}
          </span>
        </div>
        <span className={cx(styles['credits-value'])}>
          <Statistic value={summary?.totalCredit ?? 0} />
        </span>
      </div>

      <div className={cx(styles['credits-item'])}>
        <div className={cx(styles['credits-label-area'])}>
          <span className={cx(styles['credits-label'])}>
            {dict('PC.Pages.MorePage.MySubscriptions.subscriptionCredits')}
          </span>
        </div>
        <span className={cx(styles['credits-value'], styles.blue)}>
          <Statistic
            value={summary?.subscriptionCredit ?? 0}
            valueStyle={{ color: '#1a6bff' }}
          />
        </span>
      </div>

      <div className={cx(styles['credits-item'])}>
        <div className={cx(styles['credits-label-area'])}>
          <span className={cx(styles['credits-label'])}>
            {dict('PC.Pages.MorePage.MySubscriptions.purchaseCredits')}
          </span>
          <span
            className={cx(styles['add-purchase-link'])}
            onClick={onAddPurchase}
          >
            {dict('PC.Pages.MorePage.MySubscriptions.addPurchase')}
          </span>
        </div>
        <span className={cx(styles['credits-value'], styles.green)}>
          <Statistic
            value={summary?.purchaseCredit ?? 0}
            valueStyle={{ color: '#0d9488' }}
          />
        </span>
      </div>

      <div className={cx(styles['credits-item'])}>
        <div className={cx(styles['credits-label-area'])}>
          <span className={cx(styles['credits-label'])}>
            {dict('PC.Pages.MorePage.MySubscriptions.activityCredits')}
          </span>
        </div>
        <span className={cx(styles['credits-value'], styles.orange)}>
          <Statistic
            value={summary?.activityCredit ?? 0}
            valueStyle={{ color: '#f59e0b' }}
          />
        </span>
      </div>
    </div>
  );
};

export default CreditsBreakdown;
