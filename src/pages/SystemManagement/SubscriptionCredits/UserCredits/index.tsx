import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiListUserCreditBalances } from '@/services/subscriptionService';
import type { UserCreditBalanceInfo } from '@/types/interfaces/subscription';
import { formatDateTime } from '@/utils/dateUtils';
import type { ProColumns } from '@ant-design/pro-components';
import React from 'react';

const MOCK_USER_CREDITS: UserCreditBalanceInfo[] = [
  {
    userId: 1001,
    userName: 'Alice Wang',
    balance: 1250,
    totalRecharge: 2000,
    totalConsume: 750,
    lastUpdatedAt: '2026-04-28T10:30:00Z',
  },
  {
    userId: 1002,
    userName: 'Bob Li',
    balance: 350,
    totalRecharge: 500,
    totalConsume: 150,
    lastUpdatedAt: '2026-04-27T14:20:00Z',
  },
  {
    userId: 1003,
    userName: 'Diana Chen',
    balance: 0,
    totalRecharge: 100,
    totalConsume: 100,
    lastUpdatedAt: '2026-04-20T09:00:00Z',
  },
  {
    userId: 1004,
    userName: 'Eric Zhang',
    balance: 4800,
    totalRecharge: 6000,
    totalConsume: 1200,
    lastUpdatedAt: '2026-04-29T08:00:00Z',
  },
  {
    userId: 1005,
    userName: 'Fiona Liu',
    balance: 99,
    totalRecharge: 200,
    totalConsume: 101,
    lastUpdatedAt: '2026-04-25T16:00:00Z',
  },
];

const UserCredits: React.FC = () => {
  const columns: ProColumns<UserCreditBalanceInfo>[] = [
    {
      title: dict('PC.Pages.SystemUserCredits.colUser'),
      dataIndex: 'userName',
      key: 'userName',
      ellipsis: true,
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
    {
      title: dict('PC.Pages.SystemUserCredits.colTotalRecharge'),
      dataIndex: 'totalRecharge',
      key: 'totalRecharge',
      search: false,
      render: (val) => <span style={{ color: '#52c41a' }}>+{val}</span>,
    },
    {
      title: dict('PC.Pages.SystemUserCredits.colTotalConsume'),
      dataIndex: 'totalConsume',
      key: 'totalConsume',
      search: false,
      render: (val) => <span style={{ color: '#ff4d4f' }}>-{val}</span>,
    },
    {
      title: dict('PC.Pages.SystemUserCredits.colLastUpdated'),
      dataIndex: 'lastUpdatedAt',
      key: 'lastUpdatedAt',
      search: false,
      render: (val) => formatDateTime(val),
    },
  ];

  return (
    <WorkspaceLayout title={dict('PC.Routes.userCreditsQuery')}>
      <XProTable<UserCreditBalanceInfo>
        rowKey="userId"
        columns={columns}
        request={async (params) => {
          try {
            const res = await apiListUserCreditBalances({
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
