import SvgIcon from '@/components/base/SvgIcon';
import { dict } from '@/services/i18nRuntime';
import { apiGetUserCredits } from '@/services/subscriptionService';
import { Button, Spin } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useRequest } from 'umi';
import CreditsPurchaseModal from './CreditsPurchaseModal';
import styles from './index.less';

const cx = classNames.bind(styles);

const CreditsBalance: React.FC = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const { run: fetchCredits } = useRequest(apiGetUserCredits, {
    manual: true,
    onSuccess: (res) => {
      if (res?.data) setBalance(res.data.balance);
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
    setPurchaseOpen(true);
  };

  const handlePurchaseSuccess = () => {
    fetchCredits();
  };

  if (balance === null) {
    return <Spin size="small" style={{ margin: '0 8px' }} />;
  }

  return (
    <>
      <div className={cx(styles.container)} onClick={handleClickBalance}>
        <SvgIcon name="icons-nav-credits" className={cx(styles.icon)} />
        <span className={cx(styles.balance)}>{balance.toLocaleString()}</span>
        <Button
          type="link"
          size="small"
          className={cx(styles['top-up-btn'])}
          onClick={handleTopUp}
        >
          {dict('PC.Components.CreditsBalance.topUp')}
        </Button>
      </div>
      <CreditsPurchaseModal
        open={purchaseOpen}
        onCancel={() => setPurchaseOpen(false)}
        onSuccess={handlePurchaseSuccess}
      />
    </>
  );
};

export default CreditsBalance;
