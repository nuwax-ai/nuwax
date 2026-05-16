import { TableActions, XProTable } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiApproveWithdrawal,
  apiListWithdrawals,
  apiRejectWithdrawal,
} from '@/services/subscriptionService';
import type { WithdrawalInfo } from '@/types/interfaces/subscription';
import {
  DevPaymentTypeEnum,
  WithdrawalStatusEnum,
} from '@/types/interfaces/subscription';
import { formatDateTime } from '@/utils/dateUtils';
import { AlipayCircleFilled, BankFilled } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Input, Modal, message } from 'antd';
import React, { useRef, useState } from 'react';
import { history } from 'umi';
import { MOCK_WITHDRAWALS } from '../../constants';

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
        <span style={{ fontWeight: 600, color: '#1677ff' }}>
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
                    r.developerId ?? r.id
                  }&developerName=${encodeURIComponent(r.developerName)}`,
                ),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <XProTable<WithdrawalInfo>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          try {
            const res = await apiListWithdrawals({
              keyword: params.developerName,
              status: WithdrawalStatusEnum.Pending,
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
          const pending = MOCK_WITHDRAWALS.filter(
            (w) => w.status === WithdrawalStatusEnum.Pending,
          );
          return {
            data: pending,
            total: pending.length,
            success: true,
          };
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
