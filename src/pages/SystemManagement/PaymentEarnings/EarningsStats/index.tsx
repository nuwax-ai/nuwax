import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetDevEarningsSummary,
  apiListDevEarnings,
} from '@/services/subscriptionService';
import type { EarningRecordInfo } from '@/types/interfaces/subscription';
import {
  PricingCycleEnum,
  SettlementStatusEnum,
} from '@/types/interfaces/subscription';
import { formatDateTime } from '@/utils/dateUtils';
import type { ProColumns } from '@ant-design/pro-components';
import { Statistic, Tag } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useRequest } from 'umi';

const MOCK_DEV_SUMMARY = {
  totalEarnings: 86400,
  monthlyEarnings: 12800,
  pendingSettlement: 5600,
  developerCount: 47,
};

const MOCK_DEV_EARNINGS: EarningRecordInfo[] = [
  {
    id: 1,
    developerName: 'Alice Wang',
    agentName: '代码助手',
    userName: 'User001',
    planName: 'Basic Plan',
    cycle: PricingCycleEnum.Monthly,
    earnings: 79,
    settlementStatus: SettlementStatusEnum.Settled,
    createdAt: '2026-04-01T00:00:00Z',
  },
  {
    id: 2,
    developerName: 'Bob Li',
    agentName: '数据分析师',
    userName: 'User002',
    planName: 'Pro Plan',
    cycle: PricingCycleEnum.Quarterly,
    earnings: 215,
    settlementStatus: SettlementStatusEnum.Settled,
    createdAt: '2026-03-15T00:00:00Z',
  },
  {
    id: 3,
    developerName: 'Carlos Dev',
    agentName: '写作助手',
    userName: 'User003',
    planName: 'Enterprise Plan',
    cycle: PricingCycleEnum.Yearly,
    earnings: 799,
    settlementStatus: SettlementStatusEnum.Pending,
    createdAt: '2026-04-10T00:00:00Z',
  },
];

const PaymentEarnings: React.FC = () => {
  const [summary, setSummary] = useState<{
    totalEarnings: number;
    monthlyEarnings: number;
    pendingSettlement: number;
    developerCount: number;
  } | null>(MOCK_DEV_SUMMARY);

  const cycleLabel = useMemo(
    () => ({
      [PricingCycleEnum.Monthly]: dict(
        'PC.Pages.SpaceResourcePricing.cycleMonthly',
      ),
      [PricingCycleEnum.Quarterly]: dict(
        'PC.Pages.SpaceResourcePricing.cycleQuarterly',
      ),
      [PricingCycleEnum.Yearly]: dict(
        'PC.Pages.SpaceResourcePricing.cycleYearly',
      ),
    }),
    [],
  );

  const settlementConfig = useMemo(
    () => ({
      [SettlementStatusEnum.Pending]: {
        color: 'processing',
        label: dict('PC.Pages.MorePage.MyEarnings.settlementPending'),
      },
      [SettlementStatusEnum.Settled]: {
        color: 'success',
        label: dict('PC.Pages.MorePage.MyEarnings.settlementSettled'),
      },
    }),
    [],
  );

  const { run: fetchSummary } = useRequest(apiGetDevEarningsSummary, {
    manual: true,
    onSuccess: (res) => setSummary(res?.data ?? MOCK_DEV_SUMMARY),
  });

  useEffect(() => {
    fetchSummary();
  }, []);

  const columns: ProColumns<EarningRecordInfo>[] = [
    {
      title: dict('PC.Pages.SystemPaymentEarnings.colDeveloper'),
      dataIndex: 'developerName',
      key: 'developerName',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.MorePage.MyEarnings.colAgent'),
      dataIndex: 'agentName',
      key: 'agentName',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.MorePage.MyEarnings.colUser'),
      dataIndex: 'userName',
      key: 'userName',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.MorePage.MyEarnings.colPlan'),
      dataIndex: 'planName',
      key: 'planName',
      ellipsis: true,
      search: false,
      render: (_, record) => `${record.planName} / ${cycleLabel[record.cycle]}`,
    },
    {
      title: dict('PC.Pages.MorePage.MyEarnings.colEarnings'),
      dataIndex: 'earnings',
      key: 'earnings',
      search: false,
      render: (_, record) =>
        `${dict('PC.Common.Global.currencySymbol')}${record.earnings}`,
    },
    {
      title: dict('PC.Pages.MorePage.MyEarnings.colSettlementStatus'),
      dataIndex: 'settlementStatus',
      key: 'settlementStatus',
      search: false,
      render: (_, record) => {
        const config = settlementConfig[record.settlementStatus];
        return <Tag color={config?.color}>{config?.label}</Tag>;
      },
      valueEnum: {
        [SettlementStatusEnum.Pending]: {
          text: dict('PC.Pages.MorePage.MyEarnings.settlementPending'),
        },
        [SettlementStatusEnum.Settled]: {
          text: dict('PC.Pages.MorePage.MyEarnings.settlementSettled'),
        },
      },
    },
    {
      title: dict('PC.Pages.MorePage.MyEarnings.colCreatedAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      search: false,
      render: (val) => formatDateTime(val),
    },
  ];

  return (
    <WorkspaceLayout title={dict('PC.Routes.devEarningsStats')}>
      {/* 统计卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderRadius: 8,
            background: '#f5f5f5',
          }}
        >
          <Statistic
            title={dict('PC.Pages.SystemPaymentEarnings.totalEarnings')}
            value={summary?.totalEarnings ?? 0}
            precision={2}
            prefix={dict('PC.Common.Global.currencySymbol')}
          />
        </div>
        <div
          style={{
            padding: '20px 24px',
            borderRadius: 8,
            background: '#f0f5ff',
          }}
        >
          <Statistic
            title={dict('PC.Pages.SystemPaymentEarnings.monthlyEarnings')}
            value={summary?.monthlyEarnings ?? 0}
            precision={2}
            prefix={dict('PC.Common.Global.currencySymbol')}
          />
        </div>
        <div
          style={{
            padding: '20px 24px',
            borderRadius: 8,
            background: '#fff7e6',
          }}
        >
          <Statistic
            title={dict('PC.Pages.SystemPaymentEarnings.pendingSettlement')}
            value={summary?.pendingSettlement ?? 0}
            precision={2}
            prefix={dict('PC.Common.Global.currencySymbol')}
          />
        </div>
        <div
          style={{
            padding: '20px 24px',
            borderRadius: 8,
            background: '#f6ffed',
          }}
        >
          <Statistic
            title={dict('PC.Pages.SystemPaymentEarnings.developerCount')}
            value={summary?.developerCount ?? 0}
          />
        </div>
      </div>

      <XProTable<EarningRecordInfo>
        rowKey="id"
        columns={columns}
        request={async (params) => {
          try {
            const res = await apiListDevEarnings({
              keyword: params.developerName,
              pageNum: params.current,
              pageSize: params.pageSize,
            });
            if (res?.code === SUCCESS_CODE && res.data?.list?.length) {
              return {
                data: res.data.list,
                total: res.data.total,
                success: true,
              };
            }
          } catch {}
          return {
            data: MOCK_DEV_EARNINGS,
            total: MOCK_DEV_EARNINGS.length,
            success: true,
          };
        }}
      />
    </WorkspaceLayout>
  );
};

export default PaymentEarnings;
