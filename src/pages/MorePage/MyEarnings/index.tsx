import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import React from 'react';
import DailyEarningsList from './components/DailyEarningsList';
import EarningsSummary from './components/EarningsSummary';

const MyEarnings: React.FC = () => {
  return (
    <WorkspaceLayout title={dict('PC.Pages.MorePage.MyEarnings.pageTitle')}>
      {/* 收益统计 */}
      <EarningsSummary />

      {/* 收益明细 */}
      <DailyEarningsList />
    </WorkspaceLayout>
  );
};

export default MyEarnings;
