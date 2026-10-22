import { useSubscriptionPurchase } from '@/hooks/useSubscriptionPurchase';
import { dict } from '@/services/i18nRuntime';
import { apiListCreditPackages } from '@/services/subscriptionService';
import { CreditPackageInfo } from '@/types/interfaces/subscription';
import { Space, Spin, Statistic } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

interface CreditPackageListProps {
  /** 为 false 时不请求。默认挂载后请求 /api/credit/package/list */
  active?: boolean;
}

/**
 * 积分增购卡片列表。点击卡片沿用增购支付。
 * 单独成文件，升级套餐弹窗按需加载，避免会话页静态依赖 umi useRequest。
 */
const CreditPackageList: React.FC<CreditPackageListProps> = ({
  active = true,
}) => {
  const {
    data: packagesData,
    loading,
    run,
  } = useRequest(apiListCreditPackages, {
    manual: true,
  });

  useEffect(() => {
    if (active) {
      run();
    }
  }, [active, run]);

  const packages = useMemo<CreditPackageInfo[]>(() => {
    if (Array.isArray(packagesData)) return packagesData;
    if ((packagesData as { data?: CreditPackageInfo[] } | undefined)?.data) {
      return (packagesData as { data: CreditPackageInfo[] }).data;
    }
    return [];
  }, [packagesData]);

  const { loading: paying, handlePayCredits } = useSubscriptionPurchase();

  const handleItemClick = (id: number) => {
    if (paying) return;
    handlePayCredits(id);
  };

  return (
    <div className={cx(styles['purchase-container'])}>
      <div className={cx(styles['package-list'])}>
        {loading ? (
          <div className={cx(styles['loading-wrapper'])}>
            <Spin />
          </div>
        ) : (
          <Space
            direction="vertical"
            size={12}
            className={cx(styles['full-width'])}
          >
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={cx(styles['package-item'])}
                onClick={() => handleItemClick(pkg.id)}
              >
                <div className={cx(styles['package-info'])}>
                  <div className={cx(styles['package-name-row'])}>
                    <span className={cx(styles['package-name'])}>
                      {pkg.packageName}
                    </span>
                  </div>
                  {pkg.remark && (
                    <div className={cx(styles['package-remark'])}>
                      {pkg.remark}
                    </div>
                  )}
                  <div className={cx(styles['package-amount'])}>
                    <Statistic
                      value={pkg.creditAmount}
                      suffix={dict(
                        'PC.Pages.MorePage.MySubscriptions.creditUnit',
                      )}
                      valueStyle={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#1a6bff',
                      }}
                    />
                  </div>
                </div>
                <div className={cx(styles['package-price'])}>
                  <Statistic
                    value={pkg.price}
                    prefix="¥"
                    valueStyle={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#f59e0b',
                    }}
                  />
                </div>
              </div>
            ))}
          </Space>
        )}
      </div>
    </div>
  );
};

export default CreditPackageList;
