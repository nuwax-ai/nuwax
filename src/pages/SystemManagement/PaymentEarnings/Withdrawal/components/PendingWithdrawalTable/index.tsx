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
import { AlipayCircleFilled, BankFilled } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { message } from 'antd';
import React, { useRef, useState } from 'react';
import RejectModal from './components/RejectModal';
import RevenueDetailModal from './components/RevenueDetailModal';

const PendingWithdrawalTable: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<BillWithdrawRecordInfo | null>(null);
  const [revenueModalVisible, setRevenueModalVisible] = useState(false);
  const [currentRevenues, setCurrentRevenues] = useState<any[]>([]);

  const handleApprove = async (record: BillWithdrawRecordInfo) => {
    const res = await apiProcessWithdrawal({
      tenantId: record.userId,
      applicationId: record.id,
      action: 'APPROVE',
    });
    if (res?.code === SUCCESS_CODE) {
      message.success(
        dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.approveSuccess',
        ),
      );
      actionRef.current?.reload();
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedRecord) return;
    const res = await apiProcessWithdrawal({
      tenantId: selectedRecord.userId,
      applicationId: selectedRecord.id,
      action: 'REJECT',
      rejectReason: reason,
    });
    if (res?.code === SUCCESS_CODE) {
      message.success(
        dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.rejectSuccess',
        ),
      );
      actionRef.current?.reload();
    }
  };

  const columns: ProColumns<BillWithdrawRecordInfo>[] = [
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
        <span style={{ fontWeight: 600, color: '#f5222d' }}>
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
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colPayMethod',
      ),
      key: 'payMethod',
      search: false,
      width: 200,
      render: (_, record) => {
        const extra = record.paymentExtra || {};
        const isAlipay =
          extra.type === 'ALIPAY' || extra.accountType === 'ALIPAY';
        return (
          <span>
            {isAlipay ? (
              <AlipayCircleFilled
                style={{ color: '#1677ff', marginRight: 4 }}
              />
            ) : (
              <BankFilled style={{ color: '#52c41a', marginRight: 4 }} />
            )}
            {extra.bankName ||
              extra.channelName ||
              (isAlipay ? '支付宝' : '银行卡')}{' '}
            · {extra.accountNo || extra.cardNo || '-'}
          </span>
        );
      },
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colCreatedAt',
      ),
      dataIndex: 'created',
      key: 'created',
      search: false,
      valueType: 'dateTime',
      width: 120,
    },
    {
      title: dict('PC.Common.Global.action'),
      key: 'action',
      search: false,
      width: 160,
      render: (_, record) => (
        <TableActions
          record={record}
          actions={[
            {
              key: 'approve',
              label: dict(
                'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.approve',
              ),
              confirm: {
                title: dict(
                  'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.confirmApprove',
                ),
              },
              onClick: (r) => handleApprove(r),
            },
            {
              key: 'reject',
              label: dict(
                'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.reject',
              ),
              danger: true,
              onClick: (r) => {
                setSelectedRecord(r);
                setRejectModalOpen(true);
              },
            },
            {
              key: 'earnings',
              label: dict(
                'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.viewEarnings',
              ),
              onClick: (r) => {
                setCurrentRevenues(r.revenues || []);
                setRevenueModalVisible(true);
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <XProTable<BillWithdrawRecordInfo>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await apiListWithdrawals({
            keyword: params.userName,
            status: BillWithdrawStatusEnum.PENDING_REVIEW,
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
      <RejectModal
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        onConfirm={handleReject}
      />
      <RevenueDetailModal
        open={revenueModalVisible}
        onCancel={() => setRevenueModalVisible(false)}
        data={currentRevenues}
      />
    </>
  );
};

export default PendingWithdrawalTable;
