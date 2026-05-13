import { XModalForm } from '@/components/ProComponents';
import {
  getPayChannelValueEnum,
  getPaymentStatusConfig,
} from '@/constants/subscription.constants';
import { dict } from '@/services/i18nRuntime';
import {
  AdminPaymentOrderRecord,
  PaymentStatusEnum,
} from '@/types/interfaces/subscription';
import { formatDateTime } from '@/utils/dateUtils';
import { Descriptions } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface OrderDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: AdminPaymentOrderRecord;
}

const OrderDetail: React.FC<OrderDetailProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  if (!data) return null;

  const statusConfig = getPaymentStatusConfig();
  const payChannelEnum = getPayChannelValueEnum();

  const formatAmount = (amount: number | string) => {
    return `¥${new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
    }).format(Number(amount) || 0)}`;
  };

  return (
    <XModalForm
      title={dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Orders.detailTitle',
      )}
      open={open}
      onOpenChange={onOpenChange}
      width={720}
      submitter={false}
      modalProps={{
        destroyOnClose: true,
        centered: true,
      }}
    >
      <div className={cx(styles.detailContent)}>
        {/* 开发者信息 */}
        <Descriptions
          title={dict(
            'PC.Pages.SystemManagement.PaymentEarnings.Orders.devInfo',
          )}
          column={2}
          bordered={false}
        >
          <Descriptions.Item
            label={dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Orders.colOrderNo',
            )}
          >
            {data.bizOrderNo}
          </Descriptions.Item>
          <Descriptions.Item
            label={dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Orders.colPayMethod',
            )}
          >
            {(payChannelEnum as any)[data.payChannel]?.text || '-'}
          </Descriptions.Item>
          <Descriptions.Item
            label={dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Orders.colAmount',
            )}
          >
            {formatAmount(data.orderAmount)}
          </Descriptions.Item>
          <Descriptions.Item
            label={dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Orders.colNetAmount',
            )}
          >
            {formatAmount(data.netAmount)}
          </Descriptions.Item>
          <Descriptions.Item
            label={dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Orders.colServiceFee',
            )}
          >
            {formatAmount(Number(data.platformFee) + Number(data.providerFee))}
          </Descriptions.Item>
          <Descriptions.Item
            label={dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Orders.colStatus',
            )}
          >
            {(statusConfig as any)[data.paymentStatus]?.label || '-'}
          </Descriptions.Item>
          <Descriptions.Item
            label={dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Orders.colCreateTime',
            )}
          >
            {formatDateTime(data.created)}
          </Descriptions.Item>
          <Descriptions.Item
            label={dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Orders.colPaidAt',
            )}
          >
            {data.paymentStatus === PaymentStatusEnum.PAID
              ? formatDateTime(data.modified)
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item
            label={dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Orders.colRemark',
            )}
            span={2}
          >
            {data.subject || '-'}
          </Descriptions.Item>
        </Descriptions>

        {/* 收款账户 */}
        <Descriptions
          title={dict(
            'PC.Pages.SystemManagement.PaymentEarnings.Orders.payAccount',
          )}
          column={2}
          bordered={false}
          style={{ marginTop: 24 }}
        >
          {/* 设计图中收款账户下暂无具体字段 */}
        </Descriptions>
      </div>
    </XModalForm>
  );
};

export default OrderDetail;
