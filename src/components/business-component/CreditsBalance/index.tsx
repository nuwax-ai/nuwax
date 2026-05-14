import { dict } from '@/services/i18nRuntime';
import { apiGetCreditSummary } from '@/services/subscriptionService';
import { Button } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const CreditsBalance: React.FC = () => {
  const [balance, setBalance] = useState<number | null>(null);

  const { run: fetchCredits } = useRequest(apiGetCreditSummary, {
    manual: true,
    onSuccess: (data: any) => {
      setBalance(data.totalCredit);
    },
  });

  useEffect(() => {
    fetchCredits();
  }, []);

  const handleClickBalance = () => {
    history.push('/more-page/credit-records');
  };

  const handleTopUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    history.push('/more-page/my-subscriptions');
  };

  return (
    <div className={cx(styles['credits-balance-wrapper'])}>
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
          type="primary"
          className={cx(styles['top-up-btn'])}
          onClick={handleTopUp}
        >
          {dict('PC.Components.CreditsBalance.topUp')} +
        </Button>
      </div>
      <div className={cx(styles.footer)}>
        {dict('PC.Components.SiteFooter.poweredBy')}
      </div>
    </div>
  );
};

export default CreditsBalance;
