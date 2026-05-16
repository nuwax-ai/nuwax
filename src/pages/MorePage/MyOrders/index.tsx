import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import React from 'react';
import { useLocation } from 'umi';
import OrderList from './components/OrderList';

const MyOrders: React.FC = () => {
  const location = useLocation();

  return (
    <WorkspaceLayout title={dict('PC.Pages.MorePage.MyOrders.pageTitle')}>
      <div key={location.key}>
        <OrderList />
      </div>
    </WorkspaceLayout>
  );
};

export default MyOrders;
