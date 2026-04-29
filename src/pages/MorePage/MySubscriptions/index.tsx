import SvgIcon from '@/components/base/SvgIcon';
import { TableActions, XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiCancelSubscription,
  apiGetUserCredits,
  apiListMySubscriptions,
} from '@/services/subscriptionService';
import type { UserSubscriptionInfo } from '@/types/interfaces/subscription';
import {
  PricingCycleEnum,
  SubscriptionStatusEnum,
} from '@/types/interfaces/subscription';
import { formatDate } from '@/utils/dateUtils';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Tag, message } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { history, useRequest } from 'umi';

const MySubscriptions: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [balance, setBalance] = useState<number>(0);

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

  const { run: fetchCredits } = useRequest(apiGetUserCredits, {
    manual: true,
    onSuccess: (res) => {
      if (res?.data) setBalance(res.data.balance);
    },
  });

  useEffect(() => {
    fetchCredits();
  }, []);

  const handleCancel = async (id: number) => {
    try {
      await apiCancelSubscription(id);
      message.success(dict('PC.Pages.MorePage.MySubscriptions.cancelSuccess'));
      actionRef.current?.reload();
    } catch {
      message.error(dict('PC.Pages.MorePage.MySubscriptions.cancelFailed'));
    }
  };

  const columns: ProColumns<UserSubscriptionInfo>[] = [
    {
      title: dict('PC.Pages.MorePage.MySubscriptions.colAgent'),
      dataIndex: 'agentName',
      key: 'agentName',
      ellipsis: true,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {record.userAvatar && (
            <img
              src={record.userAvatar}
              alt=""
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          )}
          <span>{record.agentName}</span>
        </div>
      ),
    },
    {
      title: dict('PC.Pages.MorePage.MySubscriptions.colPlan'),
      dataIndex: 'planName',
      key: 'planName',
      ellipsis: true,
      search: false,
    },
    {
      title: dict('PC.Pages.MorePage.MySubscriptions.colPrice'),
      dataIndex: 'price',
      key: 'price',
      search: false,
      render: (_, record) =>
        `${dict('PC.Common.Global.currencySymbol')}${record.price}/${
          cycleLabel[record.cycle]
        }`,
    },
    {
      title: dict('PC.Pages.MorePage.MySubscriptions.colStartAt'),
      dataIndex: 'startAt',
      key: 'startAt',
      search: false,
      render: (val) => formatDate(val),
    },
    {
      title: dict('PC.Pages.MorePage.MySubscriptions.colExpireAt'),
      dataIndex: 'expireAt',
      key: 'expireAt',
      search: false,
      render: (val) => formatDate(val),
    },
    {
      title: dict('PC.Pages.MorePage.MySubscriptions.colStatus'),
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
    {
      title: dict('PC.Pages.MorePage.MySubscriptions.colAction'),
      key: 'action',
      search: false,
      width: 140,
      render: (_, record) =>
        record.status === SubscriptionStatusEnum.Active ? (
          <TableActions
            record={record}
            actions={[
              {
                key: 'cancel',
                label: dict('PC.Pages.MorePage.MySubscriptions.cancelRenewal'),
                danger: true,
                confirm: {
                  title: dict(
                    'PC.Pages.MorePage.MySubscriptions.confirmCancel',
                  ),
                },
                onClick: async (r) => {
                  await handleCancel(r.id);
                },
              },
            ]}
          />
        ) : null,
    },
  ];

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.MorePage.MySubscriptions.pageTitle')}
      rightSlot={
        <Button
          type="primary"
          onClick={() => history.push('/more-page/credit-records')}
        >
          {dict('PC.Pages.MorePage.MySubscriptions.buyCredits')}
        </Button>
      }
    >
      {/* 积分余额横幅 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderRadius: 8,
          marginBottom: 16,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SvgIcon name="icons-nav-credits" style={{ fontSize: 24 }} />
          <div>
            <div style={{ fontSize: 14, opacity: 0.85 }}>
              {dict('PC.Pages.MorePage.MySubscriptions.creditBalance')}
            </div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>
              {balance.toLocaleString()}
            </div>
          </div>
        </div>
        <Button
          type="default"
          ghost
          onClick={() => history.push('/more-page/credit-records')}
        >
          {dict('PC.Pages.MorePage.MySubscriptions.viewDetails')}
        </Button>
      </div>

      <XProTable<UserSubscriptionInfo>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await apiListMySubscriptions({
            keyword: params.agentName,
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

export default MySubscriptions;
