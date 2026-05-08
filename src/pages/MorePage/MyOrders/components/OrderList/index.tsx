import React from 'react';
import { MOCK_ORDERS } from '../../data';
import OrderItem from '../OrderItem';
import styles from './index.less';

interface OrderListProps {
  onViewDetail?: (id: string) => void;
}

const OrderList: React.FC<OrderListProps> = ({ onViewDetail }) => {
  return (
    <div className={styles['order-list-container']}>
      <div className={styles['order-list']}>
        {MOCK_ORDERS.map((order) => (
          <OrderItem key={order.id} data={order} onViewDetail={onViewDetail} />
        ))}
      </div>
    </div>
  );
};

export default OrderList;
