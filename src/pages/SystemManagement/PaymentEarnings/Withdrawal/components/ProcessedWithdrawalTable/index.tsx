import { XProTable } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiListWithdrawals } from '@/services/subscriptionService';
import {
  BillWithdrawRecordInfo,
  BillWithdrawStatusEnum,
} from '@/types/interfaces/subscription';
import type { ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import React, { useMemo } from 'react';

const ProcessedWithdrawalTable: React.FC = () => {
  const statusConfig = useMemo(
    () => ({
      [BillWithdrawStatusEnum.PENDING_REVIEW]: {
        color: 'processing',
        label: dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.statusPending',
        ),
      },
      [BillWithdrawStatusEnum.APPROVED]: {
        color: 'success',
        label: dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.statusApproved',
        ),
      },
      [BillWithdrawStatusEnum.REJECTED]: {
        color: 'error',
        label: dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.statusRejected',
        ),
      },
      [BillWithdrawStatusEnum.PAID]: {
        color: 'success',
        label: dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.statusPaid',
        ),
      },
    }),
    [],
  );

  const columns: ProColumns<BillWithdrawRecordInfo>[] = [
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colApplicationNo',
      ),
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
      search: false,
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colDeveloper',
      ),
      dataIndex: 'userName',
      key: 'userName',
      width: 120,
      ellipsis: true,
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colPhone',
      ),
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      search: false,
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colEmail',
      ),
      dataIndex: 'email',
      key: 'email',
      width: 180,
      ellipsis: true,
      search: false,
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colAmount',
      ),
      dataIndex: 'amount',
      key: 'amount',
      search: false,
      render: (_, record) => (
        <span style={{ fontWeight: 600 }}>
          ¥{(record.amount ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colStatus',
      ),
      dataIndex: 'status',
      key: 'status',
      search: false,
      render: (_, record) => {
        const cfg = statusConfig[record.status];
        return <Tag color={cfg?.color}>{cfg?.label}</Tag>;
      },
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colRejectReason',
      ),
      dataIndex: 'rejectReason',
      key: 'rejectReason',
      search: false,
      render: (val) => val || '-',
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colProcessedAt',
      ),
      dataIndex: 'modified',
      key: 'modified',
      search: false,
    },
  ];

  return (
    <XProTable<BillWithdrawRecordInfo>
      rowKey="id"
      columns={columns}
      request={async (params) => {
        const res = await apiListWithdrawals({
          keyword: params.userName,
          status: BillWithdrawStatusEnum.APPROVED,
          pageNum: params.current,
          pageSize: params.pageSize,
        });
        if (res?.code === SUCCESS_CODE) {
          return {
            data: Array.isArray(res.data?.records) ? res.data.records : [],
            total: res.data?.total || 0,
            success: true,
          };
        }
        return { data: [], total: 0, success: false };
      }}
    />
  );
};

export default ProcessedWithdrawalTable;
