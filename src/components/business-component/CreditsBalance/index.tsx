import PurchaseModal from '@/pages/MorePage/MySubscriptions/components/CreditsBreakdown/components/PurchaseModal';
import { dict } from '@/services/i18nRuntime';
import { apiGetCreditSummary } from '@/services/subscriptionService';
import { Button } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useModel, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const CreditsBalance: React.FC = () => {
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const [balance, setBalance] = useState<number | null>(null);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);

  const showCredits = tenantConfigInfo?.enableSubscription !== 0;

  const { run: fetchCredits } = useRequest(apiGetCreditSummary, {
    manual: true,
    onSuccess: (data: any) => {
      setBalance(data.totalCredit);
    },
  });

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (showCredits) {
      fetchCredits();
      // 增加定时刷新，每 15 秒刷新一次
      intervalId = setInterval(() => {
        fetchCredits();
      }, 15000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showCredits, fetchCredits]);

  const handleClickBalance = () => {
    history.push('/more-page/my-subscriptions');
  };

  const handleTopUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPurchaseModalVisible(true);
  };

  return (
    <div className={cx(styles['credits-balance-wrapper'])}>
      {showCredits && (
        <div className={cx(styles.container)} onClick={handleClickBalance}>
          <span className={cx(styles.label)}>
            {dict('PC.Components.CreditsBalance.credits')}:
          </span>
          <span className={cx(styles.balance)}>
            {balance !== null && balance !== undefined
              ? balance.toLocaleString()
              : '--'}
          </span>
          <Button
            className={cx(styles['top-up-btn'])}
            size="small"
            onClick={handleTopUp}
          >
            {dict('PC.Components.CreditsBalance.topUp')} +
          </Button>
        </div>
      )}
      <div className={cx(styles.footer)}>
        {dict('PC.Components.SiteFooter.poweredBy')}
      </div>
      <PurchaseModal
        open={purchaseModalVisible}
        onCancel={() => setPurchaseModalVisible(false)}
      />
    </div>
  );
};

export default CreditsBalance;
