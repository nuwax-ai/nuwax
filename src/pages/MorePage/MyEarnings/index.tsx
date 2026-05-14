import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import React from 'react';
import { useLocation } from 'umi';
import DailyEarningsList from './components/DailyEarningsList';
import EarningsSummary from './components/EarningsSummary';

const MyEarnings: React.FC = () => {
  const location = useLocation();

  return (
    <WorkspaceLayout title={dict('PC.Pages.MorePage.MyEarnings.pageTitle')}>
      <div
        key={location.key}
        style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
      >
        {/* 收益统计 */}
        <EarningsSummary />

        {/* 收益明细 */}
        <DailyEarningsList />
      </div>
    </WorkspaceLayout>
  );
};

export default MyEarnings;
