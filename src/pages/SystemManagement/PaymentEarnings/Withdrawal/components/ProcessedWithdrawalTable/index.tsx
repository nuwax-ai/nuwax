import { XProTable } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiListWithdrawals } from '@/services/subscriptionService';
import type { WithdrawalInfo } from '@/types/interfaces/subscription';
import {
  DevPaymentTypeEnum,
  WithdrawalStatusEnum,
} from '@/types/interfaces/subscription';
import { formatDateTime } from '@/utils/dateUtils';
import { AlipayCircleFilled, BankFilled } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import React, { useMemo } from 'react';
import { MOCK_WITHDRAWALS } from '../../constants';

const ProcessedWithdrawalTable: React.FC = () => {
  const statusConfig = useMemo(
    () => ({
      [WithdrawalStatusEnum.Pending]: {
        color: 'processing',
        label: dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.statusPending',
        ),
      },
      [WithdrawalStatusEnum.Approved]: {
        color: 'success',
        label: dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.statusApproved',
        ),
      },
      [WithdrawalStatusEnum.Rejected]: {
        color: 'error',
        label: dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.statusRejected',
        ),
      },
    }),
    [],
  );

  const columns: ProColumns<WithdrawalInfo>[] = [
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colApplicationNo',
      ),
      dataIndex: 'applicationNo',
      key: 'applicationNo',
      ellipsis: true,
      width: 180,
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colDeveloper',
      ),
      dataIndex: 'developerName',
      key: 'developerName',
      ellipsis: true,
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
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colPayMethod',
      ),
      key: 'payMethod',
      search: false,
      render: (_, record) => (
        <span>
          {record.accountType === DevPaymentTypeEnum.Alipay ? (
            <AlipayCircleFilled style={{ color: '#1677ff', marginRight: 4 }} />
          ) : (
            <BankFilled style={{ color: '#52c41a', marginRight: 4 }} />
          )}
          {record.realName || '-'} · {record.accountNo || '-'}
        </span>
      ),
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colCreatedAt',
      ),
      dataIndex: 'createdAt',
      key: 'createdAt',
      search: false,
      render: (val) => formatDateTime(val),
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
        return (
          <div>
            <Tag color={cfg?.color}>{cfg?.label}</Tag>
            {record.rejectReason && (
              <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 2 }}>
                {record.rejectReason}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <XProTable<WithdrawalInfo>
      rowKey="id"
      columns={columns}
      request={async (params) => {
        try {
          const res = await apiListWithdrawals({
            keyword: params.developerName,
            status: params.status,
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
        const processed = MOCK_WITHDRAWALS.filter(
          (w) => w.status !== WithdrawalStatusEnum.Pending,
        );
        return {
          data: processed,
          total: processed.length,
          success: true,
        };
      }}
    />
  );
};

export default ProcessedWithdrawalTable;
