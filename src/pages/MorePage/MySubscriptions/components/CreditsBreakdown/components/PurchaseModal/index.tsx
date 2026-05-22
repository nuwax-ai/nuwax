import { XModalForm } from '@/components/ProComponents';
import { apiGetAgentSubscriptionOrderCashier } from '@/pages/EditAgent/services/agent-subscription-plan';
import { dict } from '@/services/i18nRuntime';
import {
  apiCreateCreditOrder,
  apiListCreditPackages,
} from '@/services/subscriptionService';
import { CreditPackageInfo } from '@/types/interfaces/subscription';
import { message, Space, Spin, Statistic } from 'antd';
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
  // 获取积分套餐列表
  const {
    data: packagesData,
    loading,
    run,
  } = useRequest(apiListCreditPackages, {
    manual: true,
  });

  // 当弹窗打开时，自动加载套餐列表
  useEffect(() => {
    if (open) {
      run();
    }
  }, [open, run]);

  // 处理获取到的套餐数据格式，兼容不同后端响应结构
  const packages = useMemo<CreditPackageInfo[]>(() => {
    if (Array.isArray(packagesData)) return packagesData;
    // 兼容可能存在的 data 包裹结构
    if ((packagesData as any)?.data) return (packagesData as any).data;
    return [];
  }, [packagesData]);

  // 获取收银台地址并跳转支付
  const { run: getCashierUrl, loading: fetchingCashier } = useRequest(
    apiGetAgentSubscriptionOrderCashier,
    {
      manual: true,
      onSuccess: (res: any) => {
        // 兼容处理：有些环境下 res 是原始数据，有些则是 RequestResponse 包裹
        const data = res?.data || res;
        if (data && data?.cashierUrl) {
          const returnUrl = encodeURIComponent(window.location.href);
          const separator = data.cashierUrl.includes('?') ? '&' : '?';
          const url = `${data.cashierUrl}${separator}returnUrl=${returnUrl}`;
          window.location.href = url;
        }
      },
    },
  );

  // 创建积分增购订单
  const { run: createOrder, loading: creatingOrder } = useRequest(
    apiCreateCreditOrder,
    {
      manual: true,
      onSuccess: (res: any) => {
        if (res) {
          // 兼容处理获取返回的数据内容
          const data = res?.data || res;
          // 获取创建订单返回的订单ID（用于换取收银台URL）
          const orderId = data?.id;
          if (orderId) {
            // 继续获取支付收银台地址
            getCashierUrl({ orderId });
          } else {
            message.error(
              dict('PC.Pages.MorePage.MySubscriptions.orderIdNotFound'),
            );
          }
        }
      },
    },
  );

  /**
   * 点击积分套餐处理函数
   * @param id 套餐ID
   */
  const handleItemClick = (id: number) => {
    // 防止重复请求
    if (creatingOrder || fetchingCashier) return;
    createOrder({ packageId: id });
  };

  return (
    <XModalForm
      title={dict('PC.Pages.MorePage.MySubscriptions.tabCredits')}
      open={open}
      onOpenChange={(visible) => !visible && onCancel()}
      modalProps={{
        destroyOnHidden: true,
        width: 640,
        centered: true,
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
    </XModalForm>
  );
};

export default PurchaseModal;
