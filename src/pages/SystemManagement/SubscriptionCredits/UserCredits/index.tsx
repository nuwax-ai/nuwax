import {
  ActionItem,
  TableActions,
  XProTable,
} from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import type {
  ActionType,
  ParamsType,
  ProColumns,
} from '@ant-design/pro-components';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { history, useLocation } from 'umi';
import { apiGetCreditSummaryList } from '../services/credit';
import {
  UserCreditSummaryInfo,
  UserCreditSummarySearchParams,
} from '../types/credit';
import DeductCreditModal from './DeductCreditModal';
import GrantCreditModal from './GrantCreditModal';

/**
 * 用户积分查询页
 * - 列表：apiGetCreditSummaryList
 * - 操作列：查看流水、发放积分、扣减积分（弹窗提交 apiSystemAddCredit / apiSystemDeductCredit）
 */

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

/**
 * 用户积分查询
 */
const UserCredits: React.FC = () => {
  const location = useLocation();
  const actionRef = useRef<ActionType>();
  /** 发放积分弹窗开关 */
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  /** 扣减积分弹窗开关 */
  const [deductModalOpen, setDeductModalOpen] = useState(false);
  /** 当前操作行用户汇总，供 Grant/Deduct 弹窗展示与提交 userId */
  const [activeUserRecord, setActiveUserRecord] =
    useState<UserCreditSummaryInfo | null>(null);

  /** 打开发放弹窗并绑定表格行 */
  const handleOpenGrantModal = useCallback((record: UserCreditSummaryInfo) => {
    setActiveUserRecord(record);
    setGrantModalOpen(true);
  }, []);

  /** 打开扣减弹窗并绑定表格行 */
  const handleOpenDeductModal = useCallback((record: UserCreditSummaryInfo) => {
    setActiveUserRecord(record);
    setDeductModalOpen(true);
  }, []);

  /** 发放/扣减成功后刷新列表 */
  const handleCreditModalSuccess = useCallback(() => {
    actionRef.current?.reload();
  }, []);

  /** 操作列配置 */
  const getActions = useCallback((): ActionItem<UserCreditSummaryInfo>[] => {
    return [
      {
        key: 'viewCreditRecords',
        label: dict('PC.Pages.SystemUserCredits.viewCreditRecords'),
        onClick: (r) => navigateToUserCreditRecords(r.userId),
      },
      {
        key: 'grantCredit',
        label: dict('PC.Pages.SystemUserCredits.grantCredit'),
        onClick: handleOpenGrantModal,
      },
      {
        key: 'deductCredit',
        label: dict('PC.Pages.SystemUserCredits.deductCredit'),
        onClick: handleOpenDeductModal,
      },
    ];
  }, [handleOpenGrantModal, handleOpenDeductModal]);

  // 列配置
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
      dataIndex: 'username',
      key: 'username',
      ellipsis: true,
      search: false,
      render: (_, record) => record.user?.username || '-',
    },
    {
      title: dict('PC.Pages.SystemUserCredits.colUserNamePhoneOrEmail'),
      dataIndex: 'usernamePhoneOrEmail',
      key: 'usernamePhoneOrEmail',
      fieldProps: {
        placeholder: `${dict('PC.Common.Global.pleaseInput')}${dict(
          'PC.Pages.SystemUserCredits.colUserNamePhoneOrEmail',
        )}`,
      },
      hideInTable: true,
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
      width: 150,
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
    {
      title: dict('PC.Pages.SystemUserCredits.manualCredit'),
      dataIndex: 'manualCredit',
      key: 'manualCredit',
      search: false,
      width: 120,
      render: (_, record) => record.manualCredit || 0,
    },
    {
      // 操作列：积分流水、发放、扣减
      title: dict('PC.Common.Global.operation'),
      key: 'actions',
      search: false,
      fixed: 'right',
      align: 'center',
      width: 240,
      render: (_, record) => (
        <TableActions<UserCreditSummaryInfo>
          record={record}
          actions={getActions()}
        />
      ),
    },
  ];

  // 路由 state 变化时刷新列表（如从菜单切回）
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
      {/* 发放弹窗：tenantId 取自 tenantConfigInfo model */}
      <GrantCreditModal
        open={grantModalOpen}
        userRecord={activeUserRecord}
        onClose={() => setGrantModalOpen(false)}
        onSuccess={handleCreditModalSuccess}
      />
      {/* 扣减弹窗：与发放共用 activeUserRecord */}
      <DeductCreditModal
        open={deductModalOpen}
        userRecord={activeUserRecord}
        onClose={() => setDeductModalOpen(false)}
        onSuccess={handleCreditModalSuccess}
      />
    </WorkspaceLayout>
  );
};

export default UserCredits;
