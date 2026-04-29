import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetEarningsSummary,
  apiListMyEarnings,
} from '@/services/subscriptionService';
import type {
  EarningRecordInfo,
  EarningsSummaryInfo,
} from '@/types/interfaces/subscription';
import {
  PricingCycleEnum,
  SettlementStatusEnum,
} from '@/types/interfaces/subscription';
import { formatDateTime } from '@/utils/dateUtils';
import type { ProColumns } from '@ant-design/pro-components';
import { Statistic, Tag } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useRequest } from 'umi';

const MyEarnings: React.FC = () => {
  const [summary, setSummary] = useState<EarningsSummaryInfo | null>(null);

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

  const { run: fetchSummary } = useRequest(apiGetEarningsSummary, {
    manual: true,
    onSuccess: (res) => setSummary(res?.data ?? null),
  });

  useEffect(() => {
    fetchSummary();
  }, []);

  const columns: ProColumns<EarningRecordInfo>[] = [
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
    <WorkspaceLayout title={dict('PC.Pages.MorePage.MyEarnings.pageTitle')}>
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
            title={dict('PC.Pages.MorePage.MyEarnings.totalEarnings')}
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
            title={dict('PC.Pages.MorePage.MyEarnings.monthlyEarnings')}
            value={summary?.monthlyEarnings ?? 0}
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
            title={dict('PC.Pages.MorePage.MyEarnings.subscriberCount')}
            value={summary?.subscriberCount ?? 0}
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
            title={dict('PC.Pages.MorePage.MyEarnings.pendingSettlement')}
            value={summary?.pendingSettlement ?? 0}
            precision={2}
            prefix={dict('PC.Common.Global.currencySymbol')}
          />
        </div>
      </div>

      <XProTable<EarningRecordInfo>
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await apiListMyEarnings({
            pageNum: params.current,
            pageSize: params.pageSize,
          });
          if (res?.code === SUCCESS_CODE) {
            return {
              data: res.data?.list ?? [],
              total: res.data?.total ?? 0,
              success: true,
            };
          }
          return { data: [], total: 0, success: false };
        }}
      />
    </WorkspaceLayout>
  );
};

export default MyEarnings;
