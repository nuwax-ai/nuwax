import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import { WithdrawalStatusEnum } from '@/types/interfaces/subscription';
import { Card, Tabs } from 'antd';
import React, { useState } from 'react';
import PendingWithdrawalTable from './components/PendingWithdrawalTable';
import ProcessedWithdrawalTable from './components/ProcessedWithdrawalTable';
import WithdrawalStats from './components/WithdrawalStats';
import { MOCK_WITHDRAWALS } from './constants';

const Withdrawal: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pending');

  const pendingCount = MOCK_WITHDRAWALS.filter(
    (w) => w.status === WithdrawalStatusEnum.Pending,
  ).length;
  const totalApproved = MOCK_WITHDRAWALS.filter(
    (w) => w.status === WithdrawalStatusEnum.Approved,
  ).reduce((s, w) => s + w.amount, 0);

  const tabItems = [
    {
      key: 'pending',
      label: `${dict(
        'PC.Pages.SystemWithdrawal.tabPending',
      )} (${pendingCount})`,
      children: <PendingWithdrawalTable />,
    },
    {
      key: 'processed',
      label: dict('PC.Pages.SystemWithdrawal.tabProcessed'),
      children: <ProcessedWithdrawalTable />,
    },
    {
      key: 'config',
      label: dict('PC.Pages.SystemWithdrawal.tabConfig'),
      children: (
        <Card style={{ maxWidth: 560 }}>
          <p style={{ color: '#999' }}>
            {dict('PC.Pages.SystemWithdrawal.configPlaceholder')}
          </p>
        </Card>
      ),
    },
    {
      key: 'earnings',
      label: dict('PC.Pages.SystemWithdrawal.tabEarnings'),
      children: (
        <Card style={{ maxWidth: 560 }}>
          <p style={{ color: '#999' }}>
            {dict('PC.Pages.SystemWithdrawal.earningsPlaceholder')}
          </p>
        </Card>
      ),
    },
  ];

  return (
    <WorkspaceLayout title={dict('PC.Routes.devWithdrawal')}>
      <WithdrawalStats
        pendingCount={pendingCount}
        totalApproved={totalApproved}
        totalCount={MOCK_WITHDRAWALS.length}
      />

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </WorkspaceLayout>
  );
};

export default Withdrawal;
