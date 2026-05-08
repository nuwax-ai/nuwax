import { XModalForm } from '@/components/ProComponents';
import { dict } from '@/services/i18nRuntime';
import { apiListCreditPackages } from '@/services/subscriptionService';
import { CreditPackageInfo } from '@/types/interfaces/subscription';
import { message, Space, Spin, Statistic, Tag } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

interface PurchaseModalProps {
  open: boolean;
  onCancel: () => void;
}

/**
 * 增购积分弹窗
 */
const PurchaseModal: React.FC<PurchaseModalProps> = ({ open, onCancel }) => {
  const {
    data: packagesData,
    loading,
    run,
  } = useRequest(apiListCreditPackages, {
    manual: true,
  });

  useEffect(() => {
    if (open) {
      run();
    }
  }, [open, run]);

  const packages = useMemo(() => {
    if (Array.isArray(packagesData)) return packagesData;
    if ((packagesData as any)?.data) return (packagesData as any).data;
    return [];
  }, [packagesData]);

  const handleItemClick = () => {
    message.info('功能正在紧急开发中...');
  };

  return (
    <XModalForm
      title={dict('PC.Pages.MorePage.MySubscriptions.tabCredits')}
      open={open}
      onOpenChange={(visible) => !visible && onCancel()}
      modalProps={{
        destroyOnClose: true,
        width: 640,
      }}
      submitter={{ render: () => null }} // 隐藏底部按钮区域
    >
      <div className={cx(styles['purchase-container'])}>
        <div className={cx(styles['modal-subtitle'])}>
          {dict('PC.Pages.MorePage.MySubscriptions.purchaseCreditsSubtitle')}
        </div>

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
              {packages?.map((pkg: CreditPackageInfo) => (
                <div
                  key={pkg.id}
                  className={cx(styles['package-item'])}
                  onClick={() => handleItemClick()}
                >
                  <div className={cx(styles['package-info'])}>
                    <div className={cx(styles['package-name-row'])}>
                      <span className={cx(styles['package-name'])}>
                        {pkg.packageName}
                      </span>
                      {pkg.remark && (
                        <Tag
                          color="orange"
                          className={cx(styles['package-tag'])}
                        >
                          {pkg.remark}
                        </Tag>
                      )}
                    </div>
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
    </XModalForm>
  );
};

export default PurchaseModal;
