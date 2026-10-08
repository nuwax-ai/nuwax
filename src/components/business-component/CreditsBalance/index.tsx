import SiteFooter from '@/components/SiteFooter';
import PurchaseModal from '@/components/business-component/PurchaseModal';
import { getHostVisibility } from '@/services/hostVisibility';
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
  /** 弹层打开时刷新；关闭时暂停请求。常驻余额栏默认启用。 */
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
    // 每次展开用户菜单以及进入订阅页都取最新余额，合并触发避免首开重复请求。
    fetchCredits();
    const intervalId = setInterval(() => {
      // 不可见（浏览器 tab 切走 / 客户端休眠控制）跳过本轮。
      if (document.hidden || !getHostVisibility()) return;
      fetchCredits();
    }, 60000);
    return () => clearInterval(intervalId);
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
