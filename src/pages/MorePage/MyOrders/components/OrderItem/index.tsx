import { CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React from 'react';
import { OrderItemData, OrderStatus } from '../../data';
import styles from './index.less';

interface OrderItemProps {
  data: OrderItemData;
  onViewDetail?: (id: string) => void;
}

const OrderItem: React.FC<OrderItemProps> = ({ data, onViewDetail }) => {
  const isSettled = data.status === OrderStatus.SETTLED;

  return (
    <div className={styles['order-item']}>
      <div className={styles['item-header']}>
        <div className={styles['header-left']}>
          <div className={styles['title-box']}>
            <div className={styles['title']}>{data.title}</div>
            <div className={styles['order-no-row']}>
              <span className={styles['order-no']}>{data.orderNo}</span>
              <span className={styles['dot']}>·</span>
              <span className={styles['income-label']}>
                实收 ¥{data.income}
              </span>
            </div>
          </div>
        </div>
        <div className={styles['amount']}>
          <span className={styles['currency']}>¥</span>
          {data.amount}
        </div>
      </div>

      <div className={styles['item-meta']}>
        <div className={styles['meta-item']}>
          <CalendarOutlined />
          <span>{data.createdAt}</span>
        </div>
        <div className={styles['meta-item']}>
          <UserOutlined />
          <span>{data.user}</span>
        </div>
        {data.commission && (
          <div className={styles['commission']}>
            平台佣金 ¥{data.commission}
          </div>
        )}
      </div>

      <div className={styles['item-footer']}>
        <div
          className={`${styles['status-box']} ${
            isSettled ? styles['status-settled'] : styles['status-settling']
          }`}
        >
          <span className={styles['status-dot']} />
          {isSettled ? '已结算' : '结算中'}
        </div>
        <Button
          className={styles['detail-btn']}
          type="default"
          size="small"
          onClick={() => onViewDetail?.(data.id)}
        >
          查看详情
        </Button>
      </div>
    </div>
  );
};

export default OrderItem;
