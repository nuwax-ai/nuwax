import { TableActions, XProTable } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiApproveWithdrawal,
  apiListWithdrawals,
  apiRejectWithdrawal,
} from '@/services/subscriptionService';
import {
  BillWithdrawRecordInfo,
  BillWithdrawStatusEnum,
} from '@/types/interfaces/subscription';
import { AlipayCircleFilled, BankFilled } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Input, Modal, message } from 'antd';
import React, { useRef, useState } from 'react';
import { history } from 'umi';

const PendingWithdrawalTable: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async (id: number) => {
    await apiApproveWithdrawal(id);
    message.success(
      dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.approveSuccess',
      ),
    );
    actionRef.current?.reload();
  };

  const handleReject = async () => {
    if (!rejectId) return;
    await apiRejectWithdrawal(rejectId, rejectReason);
    message.success(
      dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.rejectSuccess',
      ),
    );
    setRejectModalOpen(false);
    setRejectReason('');
    actionRef.current?.reload();
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
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colDeveloper',
      ),
      key: 'keyword',
      ellipsis: true,
      render: (_, record) => {
        const firstRev = record.revenues?.[0];
        return firstRev
          ? `${firstRev.userName || firstRev.nickName || '-'}`
          : '-';
      },
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colAmount',
      ),
      dataIndex: 'amount',
      key: 'amount',
      search: false,
      render: (_, record) => (
        <span style={{ fontWeight: 600, color: '#f5222d' }}>
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
    },
    {
      title: dict('PC.Common.Global.action'),
      key: 'action',
      search: false,
      width: 200,
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
              onClick: (r) => handleApprove(r.id),
            },
            {
              key: 'reject',
              label: dict(
                'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.reject',
              ),
              danger: true,
              onClick: (r) => {
                setRejectId(r.id);
                setRejectModalOpen(true);
              },
            },
            {
              key: 'earnings',
              label: dict(
                'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.viewEarnings',
              ),
              onClick: (r) =>
                history.push(
                  `/system/payment-earnings/earnings-detail?developerId=${
                    r.userId
                  }&developerName=${encodeURIComponent(
                    r.revenues?.[0]?.userName || '',
                  )}`,
                ),
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
            keyword: params.keyword,
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
      <Modal
        title={dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.rejectModalTitle',
        )}
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectReason('');
        }}
        onOk={handleReject}
        okButtonProps={{ danger: true }}
        okText={dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.reject',
        )}
      >
        <p style={{ marginBottom: 12 }}>
          {dict(
            'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.rejectReasonLabel',
          )}
        </p>
        <Input.TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder={dict(
            'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.rejectReasonPlaceholder',
          )}
          maxLength={200}
          showCount
        />
      </Modal>
    </>
  );
};

export default PendingWithdrawalTable;
