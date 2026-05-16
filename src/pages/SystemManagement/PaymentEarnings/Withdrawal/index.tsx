import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';

import { Card, Tabs } from 'antd';
import React, { useState } from 'react';
import { useLocation } from 'umi';
import PendingWithdrawalTable from './components/PendingWithdrawalTable';
import ProcessedWithdrawalTable from './components/ProcessedWithdrawalTable';

const Withdrawal: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('pending');

  const tabItems = [
    {
      key: 'pending',
      label: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.tabPending',
      ),
      children: <PendingWithdrawalTable />,
    },
    {
      key: 'processed',
      label: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.tabProcessed',
      ),
      children: <ProcessedWithdrawalTable />,
    },
    {
      key: 'config',
      label: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.tabConfig',
      ),
      children: (
        <Card style={{ maxWidth: 560 }}>
          <p style={{ color: '#999' }}>
            {dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.configPlaceholder',
            )}
          </p>
        </Card>
      ),
    },
    {
      key: 'earnings',
      label: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.tabEarnings',
      ),
      children: (
        <Card style={{ maxWidth: 560 }}>
          <p style={{ color: '#999' }}>
            {dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.earningsPlaceholder',
            )}
          </p>
        </Card>
      ),
    },
  ];

  return (
    <WorkspaceLayout title={dict('PC.Routes.devWithdrawal')}>
      <div key={location.key}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </div>
    </WorkspaceLayout>
  );
};

export default Withdrawal;
