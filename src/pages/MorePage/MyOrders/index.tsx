import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import React from 'react';
import OrderList from './components/OrderList';

const MyOrders: React.FC = () => {
  const handleViewDetail = (id: string) => {
    console.log('View detail:', id);
  };

  return (
    <WorkspaceLayout title={dict('PC.Pages.MorePage.MyOrders.pageTitle')}>
      <OrderList onViewDetail={handleViewDetail} />
    </WorkspaceLayout>
  );
};

export default MyOrders;
