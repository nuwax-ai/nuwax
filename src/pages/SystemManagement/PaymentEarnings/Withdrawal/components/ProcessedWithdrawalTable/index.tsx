import { TableActions, XProTable } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiListWithdrawals,
  apiProcessWithdrawal,
} from '@/services/subscriptionService';
import {
  BillWithdrawRecordInfo,
  BillWithdrawStatusEnum,
} from '@/types/interfaces/subscription';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Tag, message } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import PayModal from './components/PayModal';
import PaymentRemarkModal from './components/PaymentRemarkModal';

interface ProcessedWithdrawalTableProps {
  status?: BillWithdrawStatusEnum;
}

const ProcessedWithdrawalTable: React.FC<ProcessedWithdrawalTableProps> = ({
  status = BillWithdrawStatusEnum.APPROVED,
}) => {
  const actionRef = useRef<ActionType>();
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<BillWithdrawRecordInfo | null>(null);
  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [currentPaymentExtra, setCurrentPaymentExtra] = useState<{
    images: string[];
    remark: string;
  } | null>(null);

  const handleConfirmPay = async (values: {
    remark: string;
    images: string[];
  }) => {
    if (!selectedRecord) return;
    const res = await apiProcessWithdrawal({
      tenantId: selectedRecord.userId,
      applicationId: selectedRecord.id,
      action: 'COMPLETE_PAYMENT',
      paymentExtra: {
        remark: values.remark,
        images: values.images,
      },
    });
    if (res?.success) {
      message.success(
        dict('PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.paySuccess'),
      );
      actionRef.current?.reload();
    }
  };

  const statusConfig = useMemo(
    () => ({
      [BillWithdrawStatusEnum.PENDING_REVIEW]: {
        color: 'processing',
        label: dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.statusPending',
        ),
      },
      [BillWithdrawStatusEnum.APPROVED]: {
        color: 'warning',
        label: dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.tabApproved',
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

  const columns = useMemo<ProColumns<BillWithdrawRecordInfo>[]>(() => {
    const cols: ProColumns<BillWithdrawRecordInfo>[] = [
      {
        title: dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colApplicationNo',
        ),
        dataIndex: 'id',
        key: 'id',
        ellipsis: true,
        search: false,
        width: 200,
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
        width: 120,
        render: (_, record) => (
          <span style={{ fontWeight: 600 }}>
            ¥
            {(record.amount ?? 0).toLocaleString('zh-CN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        ),
      },
      {
        title: dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colPlatformServiceFee',
        ),
        dataIndex: 'fee',
        key: 'fee',
        search: false,
        width: 130,
        render: (_, record) => {
          const serviceFee = record.fee ?? 0;
          return (
            <span style={{ color: '#8c8c8c' }}>
              ¥
              {serviceFee.toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          );
        },
      },
      {
        title: dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colActualTransferAmount',
        ),
        dataIndex: 'actualAmount',
        key: 'actualAmount',
        search: false,
        width: 130,
        render: (_, record) => {
          return (
            <span style={{ fontWeight: 600, color: '#52c41a' }}>
              ¥
              {(record.actualAmount ?? 0).toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          );
        },
      },
      {
        title: dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colStatus',
        ),
        dataIndex: 'status',
        key: 'status',
        search: false,
        width: 120,
        render: (_, record) => {
          const cfg = statusConfig[record.status];
          return <Tag color={cfg?.color}>{cfg?.label}</Tag>;
        },
      },
      {
        title: dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colPaymentRemark',
        ),
        key: 'paymentRemark',
        search: false,
        width: 120,
        hideInTable: status !== BillWithdrawStatusEnum.PAID,
        align: 'center',
        render: (_, record) => {
          if (!record.paymentExtra) return '-';
          return (
            <a
              onClick={() => {
                setCurrentPaymentExtra(record.paymentExtra);
                setRemarkModalOpen(true);
              }}
            >
              {dict(
                'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.viewBtn',
              )}
            </a>
          );
        },
      },
      {
        title: dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colRejectReason',
        ),
        dataIndex: 'rejectReason',
        key: 'rejectReason',
        search: false,
        width: 200,
        hideInTable: status !== BillWithdrawStatusEnum.REJECTED,
      },
      {
        title: dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colProcessedAt',
        ),
        dataIndex: 'modified',
        key: 'modified',
        search: false,
        valueType: 'dateTime',
        width: 200,
      },
      {
        title: dict('PC.Common.Global.action'),
        key: 'action',
        search: false,
        width: 120,
        hideInTable: status !== BillWithdrawStatusEnum.APPROVED,
        render: (_, record) => (
          <TableActions
            record={record}
            actions={[
              {
                key: 'pay',
                label: dict(
                  'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.pay',
                ),
                visible: record.status === BillWithdrawStatusEnum.APPROVED,
                onClick: (r) => {
                  setSelectedRecord(r);
                  setPayModalOpen(true);
                },
              },
            ]}
          />
        ),
      },
    ];
    return cols;
  }, [status, statusConfig]);

  return (
    <>
      <XProTable<BillWithdrawRecordInfo>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await apiListWithdrawals({
            keyword: params.userName,
            status: status,
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
      <PayModal
        open={payModalOpen}
        onCancel={() => {
          setPayModalOpen(false);
          setSelectedRecord(null);
        }}
        onConfirm={handleConfirmPay}
        record={selectedRecord}
      />
      <PaymentRemarkModal
        open={remarkModalOpen}
        onCancel={() => {
          setRemarkModalOpen(false);
          setCurrentPaymentExtra(null);
        }}
        paymentExtra={currentPaymentExtra}
      />
    </>
  );
};

export default ProcessedWithdrawalTable;
