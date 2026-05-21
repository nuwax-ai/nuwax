import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import type {
  ActionType,
  ParamsType,
  ProColumns,
} from '@ant-design/pro-components';
import { Button } from 'antd';
import React, { useEffect, useRef } from 'react';
import { history, useLocation } from 'umi';
import { apiGetCreditSummaryList } from '../services/credit';
import {
  UserCreditSummaryInfo,
  UserCreditSummarySearchParams,
} from '../types/credit';

/** ProTable 分页与筛选项；请求接口使用 UserCreditSummarySearchParams */
type UserCreditSummaryTableParams = ParamsType &
  Pick<UserCreditSummarySearchParams, 'usernamePhoneOrEmail'> & {
    userId?: number | string;
    current?: number;
    pageSize?: number;
  };

const DEFAULT_PAGE_SIZE = 15;

/**
 * 用户积分汇总列表
 */
async function fetchUserCreditSummaryTableRequest(
  params: UserCreditSummaryTableParams,
): Promise<{
  data: UserCreditSummaryInfo[];
  total: number;
  success: boolean;
}> {
  try {
    const userIdRaw = params.userId;
    const userId =
      userIdRaw !== undefined && userIdRaw !== ''
        ? Number(userIdRaw)
        : undefined;
    const res = await apiGetCreditSummaryList({
      userId:
        userId !== undefined && !Number.isNaN(userId) ? userId : undefined,
      usernamePhoneOrEmail: params.usernamePhoneOrEmail?.trim() || undefined,
      pageNum: params.current || 1,
      pageSize: params.pageSize || DEFAULT_PAGE_SIZE,
    });
    if (res?.code === SUCCESS_CODE) {
      const list = res.data.records || [];
      return {
        data: list,
        total: res.data.total,
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

/** 跳转订阅积分「积分明细」页面并携带用户 ID（查询参数 userId） */
function navigateToUserCreditRecords(
  userId: UserCreditSummaryInfo['userId'],
): void {
  if (userId === undefined || userId === null) {
    return;
  }
  history.push(
    `/system/subscription-credits/credit-records?userId=${encodeURIComponent(
      String(userId),
    )}`,
  );
}

const UserCredits: React.FC = () => {
  const location = useLocation();
  const actionRef = useRef<ActionType>();
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
      dataIndex: 'usernamePhoneOrEmail',
      key: 'usernamePhoneOrEmail',
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
      render: (_, record) => record.totalCredit || 0,
    },
    {
      title: dict('PC.Pages.SystemUserCredits.subscriptionCredit'),
      dataIndex: 'subscriptionCredit',
      key: 'subscriptionCredit',
      search: false,
      render: (_, record) => record.subscriptionCredit || 0,
    },
    {
      title: dict('PC.Pages.SystemUserCredits.purchaseCredit'),
      dataIndex: 'purchaseCredit',
      key: 'purchaseCredit',
      search: false,
      render: (_, record) => record.purchaseCredit || 0,
    },
    {
      title: dict('PC.Pages.SystemUserCredits.activityCredit'),
      dataIndex: 'activityCredit',
      key: 'activityCredit',
      search: false,
      width: 150,
      render: (_, record) => record.activityCredit || 0,
    },
    // {
    //   title: dict('PC.Pages.SystemUserCredits.manualCredit'),
    //   dataIndex: 'manualCredit',
    //   key: 'manualCredit',
    //   search: false,
    //   width: 120,
    //   render: (_, record) => record.manualCredit || 0,
    // },
    {
      title: dict('PC.Common.Global.operation'),
      key: 'actions',
      search: false,
      fixed: 'right',
      align: 'center',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => navigateToUserCreditRecords(record.userId)}
        >
          {dict('PC.Pages.SystemUserCredits.viewCreditRecords')}
        </Button>
      ),
    },
  ];

  useEffect(() => {
    actionRef.current?.reload();
  }, [location.state]);

  return (
    <WorkspaceLayout title={dict('PC.Routes.userCreditsQuery')}>
      <XProTable<UserCreditSummaryInfo, UserCreditSummaryTableParams>
        rowKey="userId"
        actionRef={actionRef}
        columns={columns}
        request={fetchUserCreditSummaryTableRequest}
        scroll={{ x: 'max-content' }}
        pagination={{
          showSizeChanger: true,
          pageSizeOptions: [15, 30, 50, 100],
          defaultPageSize: DEFAULT_PAGE_SIZE,
        }}
      />
    </WorkspaceLayout>
  );
};

export default UserCredits;
