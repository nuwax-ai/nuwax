import { BillOrderInfo } from '@/types/interfaces/subscription';
import { Empty, Spin } from 'antd';
import classNames from 'classnames';
import React from 'react';
import OrderItem from '../OrderItem';
import styles from './index.less';

const cx = classNames.bind(styles);

interface OrderListProps {
  orders: BillOrderInfo[];
  loading: boolean;
}

const OrderList: React.FC<OrderListProps> = ({ orders, loading }) => {
  return (
    <Spin spinning={loading}>
      <div className={cx(styles['order-list'])}>
        {orders.length > 0
          ? orders.map((order) => <OrderItem key={order.id} data={order} />)
          : !loading && <Empty />}
      </div>
    </Spin>
  );
};

export default OrderList;
