import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import type { ParamsType, ProColumns } from '@ant-design/pro-components';
import React from 'react';
import { apiGetCreditSummaryList } from '../services/credit';
import { UserCreditSummaryInfo } from '../types/credit';

/** ProTable 查询参数（筛选项与表单字段：仅 userId、userName） */
type UserCreditSummaryTableParams = ParamsType & {
  userId?: number | string;
  userName?: string;
  current?: number;
  pageSize?: number;
};

function parseUserIdParam(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * 用户积分汇总列表（ProTable request）：userId、用户名称 → 接口 userId / usernamePhoneOrEmail。
 */
async function fetchUserCreditSummaryTableRequest(
  params: UserCreditSummaryTableParams,
): Promise<{
  data: UserCreditSummaryInfo[];
  total: number;
  success: boolean;
}> {
  try {
    const res = await apiGetCreditSummaryList({
      userId: parseUserIdParam(params.userId),
      usernamePhoneOrEmail: params.userName?.trim() || undefined,
    });
    if (res?.code === SUCCESS_CODE) {
      const list = res.data || [];
      return {
        data: list,
        total: list.length,
        success: true,
      };
    }
  } catch {}
  return {
    data: [],
    total: 0,
    success: false,
  };
}

const UserCredits: React.FC = () => {
  const columns: ProColumns<UserCreditSummaryInfo>[] = [
    {
      title: dict('PC.Pages.SystemUserCredits.colUserId'),
      dataIndex: 'userId',
      key: 'userId',
      ellipsis: true,
      fieldProps: {
        placeholder: `${dict('PC.Common.Global.pleaseInput')}${dict(
          'PC.Pages.SystemUserCredits.colUserId',
        )}`,
      },
      render: (_, record) => record.userId || '-',
    },
    {
      title: dict('PC.Pages.SystemUserCredits.colUserName'),
      dataIndex: 'userName',
      key: 'userName',
      ellipsis: true,
      fieldProps: {
        placeholder: `${dict('PC.Common.Global.pleaseInput')}${dict(
          'PC.Pages.SystemUserCredits.colUserName',
        )}`,
      },
      render: (_, record) => record.user?.username || '-',
    },
    {
      title: dict('PC.Pages.SystemUserCredits.colPhone'),
      dataIndex: 'phone',
      key: 'phone',
      ellipsis: true,
      search: false,
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
      <XProTable<UserCreditSummaryInfo, UserCreditSummaryTableParams>
        rowKey="userId"
        columns={columns}
        request={fetchUserCreditSummaryTableRequest}
      />
    </WorkspaceLayout>
  );
};

export default UserCredits;
