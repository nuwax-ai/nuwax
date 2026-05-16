import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import EarningsSummary from './components/EarningsSummary';
import EarningsTable from './components/EarningsTable';
import TopEarningsChart from './components/TopEarningsChart';

const EarningsStats: React.FC = () => {
  const [month, setMonth] = useState<string>(dayjs().format('YYYY-MM'));
  const [revenueData, setRevenueData] = useState<any>(null);

  // 格式化卡片数据
  const summaryData = {
    totalEarnings: revenueData?.totalRevenue || 0,
    monthlyEarnings: revenueData?.monthRevenue || 0,
    pendingSettlement: revenueData?.pendingAmount || 0,
    todayEarnings: revenueData?.todayRevenue || 0,
  };

  // 这里的 loading 状态可以通过判断 revenueData 是否存在，或者后续进一步优化
  const statsLoading = !revenueData;

  return (
    <WorkspaceLayout
      title={dict('PC.Routes.devEarningsStats')}
      rightSlot={
        <DatePicker
          picker="month"
          value={month ? dayjs(month) : null}
          onChange={(date) => setMonth(date ? date.format('YYYY-MM') : '')}
          allowClear={false}
          style={{ width: 140 }}
        />
      }
    >
      {/* 统计卡 */}
      <EarningsSummary data={summaryData} loading={statsLoading} />

      {/* 排行榜图表 */}
      <TopEarningsChart
        title="开发者收益 TOP10"
        data={revenueData?.userRankings || []}
        loading={statsLoading}
      />

      {/* 收益详情表格 */}
      <EarningsTable month={month} onStatsChange={setRevenueData} />
    </WorkspaceLayout>
  );
};

export default EarningsStats;
