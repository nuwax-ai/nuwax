import SiteFooter from '@/components/SiteFooter';
import PurchaseModal from '@/components/business-component/PurchaseModal';
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
  /** 展示时拉取一次余额；弹层收起即停（不发请求）。常驻余额栏默认启用。 */
  active?: boolean;
  onClick?: () => void;
}

const CreditsBalance: React.FC<CreditsBalanceProps> = ({
  className,
  showFooter = true,
  active = true,
  onClick,
}) => {
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const [balance, setBalance] = useState<number | null>(null);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const location = useLocation();

  const showCredits = tenantConfigInfo?.enableSubscription !== 0;
  const subscriptionRoute = location.pathname.includes('my-subscriptions')
    ? location.pathname
    : null;

  const { run: fetchCredits } = useRequest(apiGetCreditSummary, {
    manual: true,
    onSuccess: (data: any) => {
      setBalance(data.totalCredit);
    },
  });

  useEffect(() => {
    if (!showCredits || !active) return;
    // 展示即拉一次（用户弹层展开 / 进入订阅页 / 常驻栏首次挂载）；不做轮询，
    // 余额变化靠重新展示触发（如支付后重开弹层）。
    fetchCredits();
  }, [showCredits, active, subscriptionRoute, fetchCredits]);

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
