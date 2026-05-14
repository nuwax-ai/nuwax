import { apiGetAgentSubscriptionOrderCashier } from '@/pages/EditAgent/services/agent-subscription-plan';
import { dict } from '@/services/i18nRuntime';
import {
  BillOrderInfo,
  BillPayStatusEnum,
} from '@/types/interfaces/subscription';
import { CalendarOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { message, Statistic } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface OrderItemProps {
  data: BillOrderInfo;
}

const OrderItem: React.FC<OrderItemProps> = ({ data }) => {
  const isPendingPay =
    data.payStatus === BillPayStatusEnum.PENDING ||
    data.payStatus === BillPayStatusEnum.PROCESSING;

  const { run: goPay, loading: paying } = useRequest(
    apiGetAgentSubscriptionOrderCashier,
    {
      manual: true,
      onSuccess: (res: any) => {
        const d = res?.data || res;
        if (d?.cashierUrl) {
          window.open(d.cashierUrl, '_blank');
        }
      },
      onError: (err) => {
        message.error(err.message);
      },
    },
  );

  const handleClick = () => {
    if (isPendingPay && !paying) {
      goPay(data.id);
    }
  };

  // 根据支付状态映射文案与样式类名
  const statusInfo = React.useMemo(() => {
    switch (data.payStatus) {
      case BillPayStatusEnum.PENDING:
      case BillPayStatusEnum.PROCESSING:
        return {
          text: dict('PC.Pages.MorePage.MyOrders.statusPending'),
          className: styles['status-settling'],
        };
      case BillPayStatusEnum.SUCCESS:
        return {
          text: dict('PC.Pages.MorePage.MyOrders.statusPaid'),
          className: styles['status-settled'],
        };
      case BillPayStatusEnum.FAILED:
        return {
          text: dict('PC.Pages.MorePage.MyOrders.statusFailed'),
          className: styles['status-expired'],
        };
      case BillPayStatusEnum.CLOSED:
        return {
          text: dict('PC.Pages.MorePage.MyOrders.statusCancelled'),
          className: styles['status-cancelled'],
        };
      default:
        return { text: null, className: styles['status-unknown'] };
    }
  }, [data.payStatus]);

  return (
    <div
      className={cx(
        styles['order-item'],
        isPendingPay && styles['order-item-clickable'],
      )}
      onClick={handleClick}
    >
      <div className={cx(styles['item-header'])}>
        <div className={cx(styles['header-left'])}>
          <div className={cx(styles['title'])}>{data.description}</div>
          <div className={cx(styles['meta-info'])}>
            <span className={cx(styles['order-id'])}>
              {dict('PC.Pages.MorePage.MyOrders.orderIdLabel')}
              {data.id}
            </span>
            <div className={cx(styles['date-wrapper'])}>
              <CalendarOutlined className={cx(styles['date-icon'])} />
              <span className={cx(styles['date-text'])}>
                {data.created
                  ? dayjs(data.created).format('YYYY-MM-DD HH:mm')
                  : '-'}
              </span>
            </div>
          </div>
        </div>
        <div className={cx(styles['header-right'])}>
          <Statistic
            className={cx(styles['amount'])}
            prefix="¥"
            value={data.amount}
            precision={2}
          />
          {statusInfo.text && (
            <div className={cx(styles['status-box'], statusInfo.className)}>
              <span className={cx(styles['status-dot'])} />
              {statusInfo.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderItem;
