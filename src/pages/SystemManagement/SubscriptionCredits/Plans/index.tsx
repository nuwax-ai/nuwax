import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetSubscriptionSummary,
  apiListUserSubscriptions,
} from '@/services/subscriptionService';
import type { UserSubscriptionInfo } from '@/types/interfaces/subscription';
import {
  PricingCycleEnum,
  SubscriptionStatusEnum,
} from '@/types/interfaces/subscription';
import { formatDate } from '@/utils/dateUtils';
import type { ProColumns } from '@ant-design/pro-components';
import { Card, Col, Row, Statistic, Tag } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useRequest } from 'umi';

const MOCK_SUBS_SUMMARY = {
  activeSubscriptions: 128,
  totalUsers: 312,
  monthlyRevenue: 28650,
  totalCredits: 158400,
};

const MOCK_SUBS_LIST: UserSubscriptionInfo[] = [
  {
    id: 1,
    userId: 1001,
    userName: 'Alice Wang',
    agentId: 1,
    agentName: '代码助手',
    planId: 1,
    planName: 'Basic Plan',
    price: 99,
    cycle: PricingCycleEnum.Monthly,
    status: SubscriptionStatusEnum.Active,
    startAt: '2026-04-01T00:00:00Z',
    expireAt: '2026-05-01T00:00:00Z',
    createdAt: '2026-04-01T00:00:00Z',
  },
  {
    id: 2,
    userId: 1002,
    userName: 'Bob Li',
    agentId: 2,
    agentName: '数据分析师',
    planId: 2,
    planName: 'Pro Plan',
    price: 269,
    cycle: PricingCycleEnum.Quarterly,
    status: SubscriptionStatusEnum.Active,
    startAt: '2026-03-01T00:00:00Z',
    expireAt: '2026-06-01T00:00:00Z',
    createdAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 3,
    userId: 1003,
    userName: 'Diana Chen',
    agentId: 1,
    agentName: '代码助手',
    planId: 1,
    planName: 'Basic Plan',
    price: 99,
    cycle: PricingCycleEnum.Monthly,
    status: SubscriptionStatusEnum.Expired,
    startAt: '2026-03-01T00:00:00Z',
    expireAt: '2026-04-01T00:00:00Z',
    createdAt: '2026-03-01T00:00:00Z',
  },
];

const SubscriptionCredits: React.FC = () => {
  const [summary, setSummary] = useState<{
    activeSubscriptions: number;
    totalUsers: number;
    monthlyRevenue: number;
    totalCredits: number;
  } | null>(MOCK_SUBS_SUMMARY);

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

  const statusConfig = useMemo(
    () => ({
      [SubscriptionStatusEnum.Active]: {
        color: 'success',
        label: dict('PC.Pages.SpaceAgentSubscriptions.statusActive'),
      },
      [SubscriptionStatusEnum.Expired]: {
        color: 'default',
        label: dict('PC.Pages.SpaceAgentSubscriptions.statusExpired'),
      },
      [SubscriptionStatusEnum.Cancelled]: {
        color: 'error',
        label: dict('PC.Pages.SpaceAgentSubscriptions.statusCancelled'),
      },
    }),
    [],
  );

  const { run: fetchSummary } = useRequest(apiGetSubscriptionSummary, {
    manual: true,
    onSuccess: (res) => setSummary(res?.data ?? MOCK_SUBS_SUMMARY),
  });

  useEffect(() => {
    fetchSummary();
  }, []);

  const columns: ProColumns<UserSubscriptionInfo>[] = [
    {
      title: dict('PC.Pages.SpaceAgentSubscriptions.colUser'),
      dataIndex: 'userName',
      key: 'userName',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.SpaceAgentSubscriptions.colAgent'),
      dataIndex: 'agentName',
      key: 'agentName',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.SpaceAgentSubscriptions.colPlan'),
      dataIndex: 'planName',
      key: 'planName',
      ellipsis: true,
      search: false,
    },
    {
      title: dict('PC.Pages.SpaceAgentSubscriptions.colPrice'),
      dataIndex: 'price',
      key: 'price',
      search: false,
      render: (_, record) =>
        `${dict('PC.Common.Global.currencySymbol')}${record.price}/${
          cycleLabel[record.cycle]
        }`,
    },
    {
      title: dict('PC.Pages.SpaceAgentSubscriptions.colStartAt'),
      dataIndex: 'startAt',
      key: 'startAt',
      search: false,
      render: (val) => formatDate(val),
    },
    {
      title: dict('PC.Pages.SpaceAgentSubscriptions.colExpireAt'),
      dataIndex: 'expireAt',
      key: 'expireAt',
      search: false,
      render: (val) => formatDate(val),
    },
    {
      title: dict('PC.Pages.SpaceAgentSubscriptions.colStatus'),
      dataIndex: 'status',
      key: 'status',
      search: false,
      render: (_, record) => {
        const config = statusConfig[record.status];
        return <Tag color={config?.color}>{config?.label}</Tag>;
      },
      valueEnum: {
        [SubscriptionStatusEnum.Active]: {
          text: dict('PC.Pages.SpaceAgentSubscriptions.statusActive'),
        },
        [SubscriptionStatusEnum.Expired]: {
          text: dict('PC.Pages.SpaceAgentSubscriptions.statusExpired'),
        },
        [SubscriptionStatusEnum.Cancelled]: {
          text: dict('PC.Pages.SpaceAgentSubscriptions.statusCancelled'),
        },
      },
    },
  ];

  return (
    <WorkspaceLayout title={dict('PC.Routes.subsPlans')}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={dict(
                'PC.Pages.SystemSubscriptionCredits.activeSubscriptions',
              )}
              value={summary?.activeSubscriptions ?? 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={dict('PC.Pages.SystemSubscriptionCredits.totalUsers')}
              value={summary?.totalUsers ?? 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={dict('PC.Pages.SystemSubscriptionCredits.monthlyRevenue')}
              value={summary?.monthlyRevenue ?? 0}
              precision={2}
              prefix={dict('PC.Common.Global.currencySymbol')}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={dict('PC.Pages.SystemSubscriptionCredits.totalCredits')}
              value={summary?.totalCredits ?? 0}
              suffix="credits"
            />
          </Card>
        </Col>
      </Row>

      <XProTable<UserSubscriptionInfo>
        rowKey="id"
        columns={columns}
        request={async (params) => {
          try {
            const res = await apiListUserSubscriptions({
              spaceId: 0,
              keyword: params.userName,
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
            data: MOCK_SUBS_LIST,
            total: MOCK_SUBS_LIST.length,
            success: true,
          };
        }}
      />
    </WorkspaceLayout>
  );
};

export default SubscriptionCredits;
