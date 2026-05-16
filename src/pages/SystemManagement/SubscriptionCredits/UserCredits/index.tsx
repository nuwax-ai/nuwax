import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import type { ProColumns } from '@ant-design/pro-components';
import React from 'react';
import { apiGetCreditSummaryList } from '../services/credit';
import { UserCreditSummaryInfo } from '../types/credit';

const UserCredits: React.FC = () => {
  const columns: ProColumns<UserCreditSummaryInfo>[] = [
    {
      title: dict('PC.Pages.SystemUserCredits.colUserId'),
      dataIndex: 'userId',
      key: 'userId',
      ellipsis: true,
      render: (_, record) => record.userId || '-',
    },
    {
      title: dict('PC.Pages.SystemUserCredits.colUserName'),
      dataIndex: 'userName',
      key: 'userName',
      ellipsis: true,
      render: (_, record) => record.user?.username || '-',
    },
    {
      title: dict('PC.Pages.SystemUserCredits.colPhone'),
      dataIndex: 'phone',
      key: 'phone',
      ellipsis: true,
      render: (_, record) => record.user?.phone || '-',
    },
    {
      title: dict('PC.Pages.SystemUserCredits.totalCredit'),
      dataIndex: 'totalCredit',
      key: 'totalCredit',
      search: false,
      render: (_, record) => record.totalCredit || '-',
    },
    {
      title: dict('PC.Pages.SystemUserCredits.subscriptionCredit'),
      dataIndex: 'subscriptionCredit',
      key: 'subscriptionCredit',
      search: false,
      render: (_, record) => record.subscriptionCredit || '-',
    },
    {
      title: dict('PC.Pages.SystemUserCredits.purchaseCredit'),
      dataIndex: 'purchaseCredit',
      key: 'purchaseCredit',
      search: false,
      render: (_, record) => record.purchaseCredit || '-',
    },
    {
      title: dict('PC.Pages.SystemUserCredits.activityCredit'),
      dataIndex: 'activityCredit',
      key: 'activityCredit',
      search: false,
      render: (_, record) => record.activityCredit || '-',
    },
    {
      title: dict('PC.Pages.SystemUserCredits.manualCredit'),
      dataIndex: 'manualCredit',
      key: 'manualCredit',
      search: false,
      render: (_, record) => record.manualCredit || '-',
    },
  ];

  return (
    <WorkspaceLayout title={dict('PC.Routes.userCreditsQuery')}>
      <XProTable<UserCreditSummaryInfo>
        rowKey="userId"
        columns={columns}
        request={async (params) => {
          try {
            const keyword = params.userName || params.phone;
            const res = await apiGetCreditSummaryList({
              usernamePhoneOrEmail: keyword,
            });
            if (res?.code === SUCCESS_CODE) {
              const list = res.data || [];
              return {
                data: list,
                total: list.length,
                success: true,
              };
            }
          } catch (error) {}
          return {
            data: [],
            total: 0,
            success: false,
          };
        }}
      />
    </WorkspaceLayout>
  );
};

export default UserCredits;
