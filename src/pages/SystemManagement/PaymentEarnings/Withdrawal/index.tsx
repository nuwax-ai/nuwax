import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import { BillWithdrawStatusEnum } from '@/types/interfaces/subscription';

import { Tabs } from 'antd';
import React, { useEffect } from 'react';
import { useLocation, useSearchParams } from 'umi';
import PendingWithdrawalTable from './components/PendingWithdrawalTable';
import ProcessedWithdrawalTable from './components/ProcessedWithdrawalTable';
import WithdrawConfigCard from './components/WithdrawConfigCard';

const Withdrawal: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get('tab') || 'pending';
  // 保持与旧版 'processed' 的兼容重定向至 'approved'（待打款）
  const activeTab = rawTab === 'processed' ? 'approved' : rawTab;

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
      key: 'approved',
      label: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.tabApproved',
      ),
    },
    {
      key: 'paid',
      label: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.tabPaid',
      ),
    },
    {
      key: 'rejected',
      label: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.tabRejected',
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
      {activeTab === 'approved' && (
        <ProcessedWithdrawalTable status={BillWithdrawStatusEnum.APPROVED} />
      )}
      {activeTab === 'paid' && (
        <ProcessedWithdrawalTable status={BillWithdrawStatusEnum.PAID} />
      )}
      {activeTab === 'rejected' && (
        <ProcessedWithdrawalTable status={BillWithdrawStatusEnum.REJECTED} />
      )}
      {activeTab === 'config' && <WithdrawConfigCard />}
    </WorkspaceLayout>
  );
};

export default Withdrawal;
