import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import { Button, DatePicker } from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { useLocation } from 'umi';
import EarningsSummary from './components/EarningsSummary';
import EarningsTable from './components/EarningsTable';
import TopEarningsChart from './components/TopEarningsChart';

const EarningsStats: React.FC = () => {
  const location = useLocation();
  const [month, setMonth] = useState<string>(dayjs().format('YYYY-MM'));
  const [selectedMonth, setSelectedMonth] = useState<string>(month);
  const [searchTrigger, setSearchTrigger] = useState<number>(0);
  const [revenueData, setRevenueData] = useState<any>(null);

  // 格式化卡片数据
  const summaryData = {
    totalEarnings: revenueData?.totalRevenue || 0,
    monthlyEarnings: revenueData?.monthRevenue || 0,
    pendingSettlement: revenueData?.pendingAmount || 0,
    todayEarnings: revenueData?.todayRevenue || 0,
  };

  const handleSearch = () => {
    setMonth(selectedMonth);
    setSearchTrigger((prev) => prev + 1);
  };

  // 这里的 loading 状态可以通过判断 revenueData 是否存在，或者后续进一步优化
  const statsLoading = !revenueData;

  return (
    <WorkspaceLayout
      title={dict('PC.Routes.devEarningsStats')}
      rightSlot={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DatePicker
            picker="month"
            value={selectedMonth ? dayjs(selectedMonth) : null}
            onChange={(date) => {
              const formatted = date ? date.format('YYYY-MM') : '';
              setSelectedMonth(formatted);
              setMonth(formatted); // 切换日期自动触发查询
            }}
            allowClear={false}
            style={{ width: 140 }}
          />
          <Button type="primary" onClick={handleSearch}>
            {dict('PC.Components.XProTable.query')}
          </Button>
        </div>
      }
    >
      <div key={location.key}>
        {/* 统计卡 */}
        <EarningsSummary data={summaryData} loading={statsLoading} />

        {/* 排行榜图表 */}
        <TopEarningsChart
          title={dict(
            'PC.Pages.SystemManagement.PaymentEarnings.Stats.chartTopRankings',
          )}
          data={revenueData?.userRankings || []}
          loading={statsLoading}
        />

        {/* 收益详情表格 */}
        <EarningsTable
          month={month}
          searchTrigger={searchTrigger}
          onStatsChange={setRevenueData}
        />
      </div>
    </WorkspaceLayout>
  );
};

export default EarningsStats;
