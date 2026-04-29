import SvgIcon from '@/components/base/SvgIcon';
import { dict } from '@/services/i18nRuntime';
import { apiGetUserCredits } from '@/services/subscriptionService';
import { Button } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const CreditsBalance: React.FC = () => {
  const [balance, setBalance] = useState<number | null>(350);

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
    // 顶部/侧边“增购”入口：跳转到我的订阅页，由我的订阅页弹出购买弹框
    history.push('/more-page/my-subscriptions');
  };

  return (
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
  );
};

export default CreditsBalance;
