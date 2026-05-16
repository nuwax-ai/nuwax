import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';

import { Tabs } from 'antd';
import React, { useEffect } from 'react';
import { useLocation, useSearchParams } from 'umi';
import PendingWithdrawalTable from './components/PendingWithdrawalTable';
import ProcessedWithdrawalTable from './components/ProcessedWithdrawalTable';
import WithdrawConfigCard from './components/WithdrawConfigCard';

const Withdrawal: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'pending';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // 监听路由变化，点击菜单重新进入时重置到第一个页签
  useEffect(() => {
    if (!searchParams.get('tab')) {
      setActiveTab('pending');
    }
  }, [location.key]);

  const tabItems = [
    {
      key: 'pending',
      label: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.tabPending',
      ),
    },
    {
      key: 'processed',
      label: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.tabProcessed',
      ),
    },
    {
      key: 'config',
      label: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.tabConfig',
      ),
    },
  ];

  return (
    <WorkspaceLayout title={dict('PC.Routes.devWithdrawal')}>
      <div key={location.key}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </div>
      {activeTab === 'pending' && <PendingWithdrawalTable />}
      {activeTab === 'processed' && <ProcessedWithdrawalTable />}
      {activeTab === 'config' && <WithdrawConfigCard />}
    </WorkspaceLayout>
  );
};

export default Withdrawal;
