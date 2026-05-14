import { dict } from '@/services/i18nRuntime';
import {
  BillOrderInfo,
  BillPayStatusEnum,
} from '@/types/interfaces/subscription';
import { CalendarOutlined } from '@ant-design/icons';
import { Statistic } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface OrderItemProps {
  data: BillOrderInfo;
}

const OrderItem: React.FC<OrderItemProps> = ({ data }) => {
  const getStatusText = () => {
    switch (data.payStatus) {
      case BillPayStatusEnum.PENDING:
      case BillPayStatusEnum.PROCESSING:
        return dict('PC.Pages.MorePage.MyOrders.statusPending');
      case BillPayStatusEnum.SUCCESS:
        return dict('PC.Pages.MorePage.MyOrders.statusPaid');
      case BillPayStatusEnum.CLOSED:
        return dict('PC.Pages.MorePage.MyOrders.statusCancelled');
      case BillPayStatusEnum.FAILED:
      default:
        return null;
    }
  };

  const getStatusClass = () => {
    switch (data.payStatus) {
      case BillPayStatusEnum.SUCCESS:
        return styles['status-settled'];
      case BillPayStatusEnum.PENDING:
      case BillPayStatusEnum.PROCESSING:
        return styles['status-settling'];
      case BillPayStatusEnum.CLOSED:
        return styles['status-cancelled'];
      default:
        return styles['status-unknown'];
    }
  };

  const statusText = getStatusText();

  return (
    <div className={cx(styles['order-item'])}>
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
          {statusText && (
            <div className={cx(styles['status-box'], getStatusClass())}>
              <span className={cx(styles['status-dot'])} />
              {statusText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderItem;
