import SiteFooter from '@/components/SiteFooter';
import PurchaseModal from '@/pages/MorePage/MySubscriptions/components/CreditsBreakdown/components/PurchaseModal';
import { dict } from '@/services/i18nRuntime';
import { apiGetCreditSummary } from '@/services/subscriptionService';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Tooltip, Typography } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useLocation, useModel, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

interface CreditsBalanceProps {
  className?: string;
  showFooter?: boolean;
  onClick?: () => void;
}

const CreditsBalance: React.FC<CreditsBalanceProps> = ({
  className,
  showFooter = true,
  onClick,
}) => {
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const [balance, setBalance] = useState<number | null>(null);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const location = useLocation();

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
      // 增加定时刷新，每 1 分钟刷新一次
      intervalId = setInterval(() => {
        fetchCredits();
      }, 60000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showCredits, fetchCredits]);

  // 当路由切换至“我的订阅”相关页面时，主动刷新积分余额
  useEffect(() => {
    if (showCredits && location.pathname.includes('my-subscriptions')) {
      fetchCredits();
    }
  }, [location, showCredits, fetchCredits]);

  const handleClickBalance = () => {
    if (onClick) {
      onClick();
    } else {
      history.push('/more-page/my-subscriptions');
    }
  };

  const handleTopUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPurchaseModalVisible(true);
  };

  return (
    <div className={cx(styles['credits-balance-wrapper'])}>
      {showCredits && (
        <div
          className={cx(styles.container, className)}
          onClick={handleClickBalance}
        >
          <span className={cx(styles.label)}>
            {dict('PC.Components.CreditsBalance.credits')}:
          </span>
          <span className={cx(styles.balance)}>
            <Typography.Text
              className={cx(styles['balance-text'])}
              ellipsis={{
                tooltip:
                  balance !== null && balance !== undefined
                    ? Math.floor(balance).toLocaleString()
                    : '--',
              }}
            >
              {balance !== null && balance !== undefined
                ? Math.floor(balance).toLocaleString()
                : '--'}
            </Typography.Text>
            {tenantConfigInfo?.creditExchangeDesc && (
              <Tooltip title={tenantConfigInfo.creditExchangeDesc}>
                <InfoCircleOutlined className={cx(styles['info-icon'])} />
              </Tooltip>
            )}
          </span>

          <Button
            className={cx(styles['top-up-btn'])}
            size="small"
            onClick={handleTopUp}
          >
            + {dict('PC.Components.CreditsBalance.topUp')}
          </Button>
        </div>
      )}
      {showFooter && <SiteFooter className={cx(styles.footer)} />}
      <PurchaseModal
        open={purchaseModalVisible}
        onCancel={() => setPurchaseModalVisible(false)}
      />
    </div>
  );
};

export default CreditsBalance;
