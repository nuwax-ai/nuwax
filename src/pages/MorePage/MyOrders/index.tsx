import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import React from 'react';
import OrderList from './components/OrderList';

const MyOrders: React.FC = () => {
  return (
    <WorkspaceLayout title={dict('PC.Pages.MorePage.MyOrders.pageTitle')}>
      <OrderList />
    </WorkspaceLayout>
  );
};

export default MyOrders;
