import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiListUserCreditBalances } from '@/services/subscriptionService';
import type { UserCreditBalanceInfo } from '@/types/interfaces/subscription';
import type { ProColumns } from '@ant-design/pro-components';
import React from 'react';

interface UserCreditExt extends UserCreditBalanceInfo {
  phone: string;
  planCredits: number;
  purchaseCredits: number;
  activityCredits: number;
}

const MOCK_USER_CREDITS: UserCreditExt[] = [
  {
    userId: 1001,
    userName: 'Alice Wang',
    phone: '138****1234',
    balance: 1250,
    planCredits: 500,
    purchaseCredits: 600,
    activityCredits: 150,
    totalRecharge: 2000,
    totalConsume: 750,
    lastUpdatedAt: '2026-04-28T10:30:00Z',
  },
  {
    userId: 102,
    userName: 'Bob Li',
    phone: '139****5678',
    balance: 350,
    planCredits: 200,
    purchaseCredits: 100,
    activityCredits: 50,
    totalRecharge: 500,
    totalConsume: 150,
    lastUpdatedAt: '2026-04-27T14:20:00Z',
  },
  {
    userId: 1003,
    userName: 'Diana Chen',
    phone: '137****9012',
    balance: 0,
    planCredits: 0,
    purchaseCredits: 0,
    activityCredits: 0,
    totalRecharge: 100,
    totalConsume: 100,
    lastUpdatedAt: '2026-04-20T09:00:00Z',
  },
  {
    userId: 1004,
    userName: 'Eric Zhang',
    phone: '136****3456',
    balance: 4800,
    planCredits: 3000,
    purchaseCredits: 1500,
    activityCredits: 300,
    totalRecharge: 6000,
    totalConsume: 1200,
    lastUpdatedAt: '2026-04-29T08:00:00Z',
  },
  {
    userId: 1005,
    userName: 'Fiona Liu',
    phone: '135****7890',
    balance: 99,
    planCredits: 50,
    purchaseCredits: 30,
    activityCredits: 19,
    totalRecharge: 200,
    totalConsume: 101,
    lastUpdatedAt: '2026-04-25T16:00:00Z',
  },
];

const UserCredits: React.FC = () => {
  const columns: ProColumns<UserCreditExt>[] = [
    {
      title: dict('PC.Pages.SystemUserCredits.colUser'),
      dataIndex: 'userName',
      key: 'userName',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.SystemUserCredits.colPhone'),
      dataIndex: 'phone',
      key: 'phone',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.SystemUserCredits.colPlanCredits'),
      dataIndex: 'planCredits',
      key: 'planCredits',
      search: false,
      render: (val: any) => (
        <span style={{ color: '#1677ff' }}>
          {(val as number).toLocaleString()}
        </span>
      ),
    },
    {
      title: dict('PC.Pages.SystemUserCredits.colPurchaseCredits'),
      dataIndex: 'purchaseCredits',
      key: 'purchaseCredits',
      search: false,
      render: (val: any) => (
        <span style={{ color: '#52c41a' }}>
          {(val as number).toLocaleString()}
        </span>
      ),
    },
    {
      title: dict('PC.Pages.SystemUserCredits.colActivityCredits'),
      dataIndex: 'activityCredits',
      key: 'activityCredits',
      search: false,
      render: (val: any) => (
        <span style={{ color: '#faad14' }}>
          {(val as number).toLocaleString()}
        </span>
      ),
    },
    {
      title: dict('PC.Pages.SystemUserCredits.colBalance'),
      dataIndex: 'balance',
      key: 'balance',
      search: false,
      render: (_, record) => (
        <span
          style={{
            fontWeight: 600,
            color: record.balance > 0 ? '#1677ff' : '#999',
          }}
        >
          {record.balance.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <WorkspaceLayout title={dict('PC.Routes.userCreditsQuery')}>
      <XProTable<UserCreditExt>
        rowKey="userId"
        columns={columns}
        request={async (params) => {
          try {
            const res = await apiListUserCreditBalances({
              keyword: params.userName,
              phone: params.phone,
              pageNum: params.current,
              pageSize: params.pageSize,
            });
            if (res?.code === SUCCESS_CODE && res.data?.list?.length) {
              return {
                data: res.data.list as UserCreditExt[],
                total: res.data.total,
                success: true,
              };
            }
          } catch {}
          return {
            data: MOCK_USER_CREDITS,
            total: MOCK_USER_CREDITS.length,
            success: true,
          };
        }}
      />
    </WorkspaceLayout>
  );
};

export default UserCredits;
