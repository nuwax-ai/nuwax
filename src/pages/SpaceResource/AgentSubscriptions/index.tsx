import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiListUserSubscriptions } from '@/services/subscriptionService';
import type { UserSubscriptionInfo } from '@/types/interfaces/subscription';
import {
  PricingCycleEnum,
  SubscriptionStatusEnum,
} from '@/types/interfaces/subscription';
import { formatDate } from '@/utils/dateUtils';
import type { ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import React, { useMemo } from 'react';
import { useParams } from 'umi';

const SpaceAgentSubscriptions: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);

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

  const columns: ProColumns<UserSubscriptionInfo>[] = [
    {
      title: dict('PC.Pages.SpaceAgentSubscriptions.colUser'),
      dataIndex: 'userName',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.SpaceAgentSubscriptions.colAgent'),
      dataIndex: 'agentName',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.SpaceAgentSubscriptions.colPlan'),
      dataIndex: 'planName',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.SpaceAgentSubscriptions.colPrice'),
      dataIndex: 'price',
      render: (_, record) =>
        `${dict('PC.Common.Global.currencySymbol')}${record.price}/${
          cycleLabel[record.cycle]
        }`,
      search: false,
    },
    {
      title: dict('PC.Pages.SpaceAgentSubscriptions.colStartAt'),
      dataIndex: 'startAt',
      render: (val) => formatDate(val),
      search: false,
    },
    {
      title: dict('PC.Pages.SpaceAgentSubscriptions.colExpireAt'),
      dataIndex: 'expireAt',
      render: (val) => formatDate(val),
      search: false,
    },
    {
      title: dict('PC.Pages.SpaceAgentSubscriptions.colStatus'),
      dataIndex: 'status',
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
    <WorkspaceLayout
      title={dict('PC.Pages.SpaceAgentSubscriptions.pageTitle')}
      hideScroll={true}
    >
      <XProTable<UserSubscriptionInfo>
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await apiListUserSubscriptions({
            spaceId,
            keyword: params.userName,
            status: params.status,
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

export default SpaceAgentSubscriptions;
