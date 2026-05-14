import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import { apiGetMyBillOrders } from '@/services/subscriptionService';
import { BillOrderInfo } from '@/types/interfaces/subscription';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'umi';
import OrderList from './components/OrderList';
import styles from './index.less';

const cx = classNames.bind(styles);

const MyOrders: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<BillOrderInfo[]>([]);
  const location = useLocation();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await apiGetMyBillOrders({
        orderStatus: null,
      });
      if (res.success) {
        setOrders(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [location]);

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.MorePage.MyOrders.pageTitle')}
      leftSlot={
        <div className={cx(styles['total-count'])}>
          <span>共找到</span>
          <span className={cx(styles['count-number'])}>{orders.length}</span>
          <span>个订单</span>
        </div>
      }
    >
      <div className={cx(styles['my-orders-container'])}>
        <OrderList orders={orders} loading={loading} />
      </div>
    </WorkspaceLayout>
  );
};

export default MyOrders;
