import { TableActions, XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
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
import { Card, Input, Modal, Tabs, Tag, message } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import { history } from 'umi';
import PendingWithdrawalTable from './components/PendingWithdrawalTable';
import WithdrawalStats from './components/WithdrawalStats';

const MOCK_WITHDRAWALS: WithdrawalInfo[] = [
  {
    id: 1,
    developerId: 1,
    applicationNo: 'WD20260428001',
    developerName: 'Alice Wang',
    amount: 1580,
    accountType: DevPaymentTypeEnum.Alipay,
    accountNo: 'alice@example.com',
    realName: '王丽',
    status: WithdrawalStatusEnum.Pending,
    createdAt: '2026-04-28T10:30:00Z',
  },
  {
    id: 2,
    developerId: 2,
    applicationNo: 'WD20260420001',
    developerName: 'Bob Li',
    amount: 3200,
    accountType: DevPaymentTypeEnum.BankCard,
    accountNo: '6222 **** **** 1234',
    realName: '李明',
    status: WithdrawalStatusEnum.Approved,
    createdAt: '2026-04-20T14:20:00Z',
    processedAt: '2026-04-21T09:00:00Z',
  },
  {
    id: 3,
    developerId: 3,
    applicationNo: 'WD20260415001',
    developerName: 'Carlos Dev',
    amount: 500,
    accountType: DevPaymentTypeEnum.Alipay,
    accountNo: 'carlos@dev.com',
    realName: 'Carlos',
    status: WithdrawalStatusEnum.Rejected,
    rejectReason: '账户信息不匹配',
    createdAt: '2026-04-15T09:00:00Z',
    processedAt: '2026-04-16T10:00:00Z',
  },
  {
    id: 4,
    developerId: 4,
    applicationNo: 'WD20260429001',
    developerName: 'Diana Chen',
    amount: 2100,
    accountType: DevPaymentTypeEnum.Alipay,
    accountNo: 'diana@example.com',
    realName: '陈迪',
    status: WithdrawalStatusEnum.Pending,
    createdAt: '2026-04-29T07:00:00Z',
  },
];

const Withdrawal: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  const pendingCount = MOCK_WITHDRAWALS.filter(
    (w) => w.status === WithdrawalStatusEnum.Pending,
  ).length;
  const totalApproved = MOCK_WITHDRAWALS.filter(
    (w) => w.status === WithdrawalStatusEnum.Approved,
  ).reduce((s, w) => s + w.amount, 0);

  const statusConfig = useMemo(
    () => ({
      [WithdrawalStatusEnum.Pending]: {
        color: 'processing',
        label: dict('PC.Pages.SystemWithdrawal.statusPending'),
      },
      [WithdrawalStatusEnum.Approved]: {
        color: 'success',
        label: dict('PC.Pages.SystemWithdrawal.statusApproved'),
      },
      [WithdrawalStatusEnum.Rejected]: {
        color: 'error',
        label: dict('PC.Pages.SystemWithdrawal.statusRejected'),
      },
    }),
    [],
  );

  const handleApprove = async (id: number) => {
    await apiApproveWithdrawal(id);
    message.success(dict('PC.Pages.SystemWithdrawal.approveSuccess'));
    actionRef.current?.reload();
  };

  const handleReject = async () => {
    if (!rejectId) return;
    await apiRejectWithdrawal(rejectId, rejectReason);
    message.success(dict('PC.Pages.SystemWithdrawal.rejectSuccess'));
    setRejectModalOpen(false);
    setRejectReason('');
    actionRef.current?.reload();
  };

  const pendingColumns: ProColumns<WithdrawalInfo>[] = [
    {
      title: dict('PC.Pages.SystemWithdrawal.colApplicationNo'),
      dataIndex: 'applicationNo',
      key: 'applicationNo',
      ellipsis: true,
      width: 180,
    },
    {
      title: dict('PC.Pages.SystemWithdrawal.colDeveloper'),
      dataIndex: 'developerName',
      key: 'developerName',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.SystemWithdrawal.colAmount'),
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
      title: dict('PC.Pages.SystemWithdrawal.colPayMethod'),
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
      title: dict('PC.Pages.SystemWithdrawal.colCreatedAt'),
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
              label: dict('PC.Pages.SystemWithdrawal.approve'),
              confirm: {
                title: dict('PC.Pages.SystemWithdrawal.confirmApprove'),
              },
              onClick: (r) => handleApprove(r.id),
            },
            {
              key: 'reject',
              label: dict('PC.Pages.SystemWithdrawal.reject'),
              danger: true,
              onClick: (r) => {
                setRejectId(r.id);
                setRejectModalOpen(true);
              },
            },
            {
              key: 'earnings',
              label: dict('PC.Pages.SystemWithdrawal.viewEarnings'),
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

  const processedColumns: ProColumns<WithdrawalInfo>[] = [
    {
      title: dict('PC.Pages.SystemWithdrawal.colApplicationNo'),
      dataIndex: 'applicationNo',
      key: 'applicationNo',
      ellipsis: true,
      width: 180,
    },
    {
      title: dict('PC.Pages.SystemWithdrawal.colDeveloper'),
      dataIndex: 'developerName',
      key: 'developerName',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.SystemWithdrawal.colAmount'),
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
      title: dict('PC.Pages.SystemWithdrawal.colPayMethod'),
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
      title: dict('PC.Pages.SystemWithdrawal.colCreatedAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      search: false,
      render: (val) => formatDateTime(val),
    },
    {
      title: dict('PC.Pages.SystemWithdrawal.colStatus'),
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

  const tabItems = [
    {
      key: 'pending',
      label: `${dict(
        'PC.Pages.SystemWithdrawal.tabPending',
      )} (${pendingCount})`,
      children: (
        <PendingWithdrawalTable
          actionRef={actionRef}
          columns={pendingColumns}
          mockData={MOCK_WITHDRAWALS}
        />
      ),
    },
    {
      key: 'processed',
      label: dict('PC.Pages.SystemWithdrawal.tabProcessed'),
      children: (
        <XProTable<WithdrawalInfo>
          rowKey="id"
          columns={processedColumns}
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
      ),
    },
    {
      key: 'config',
      label: dict('PC.Pages.SystemWithdrawal.tabConfig'),
      children: (
        <Card style={{ maxWidth: 560 }}>
          <p style={{ color: '#999' }}>
            {dict('PC.Pages.SystemWithdrawal.configPlaceholder')}
          </p>
        </Card>
      ),
    },
    {
      key: 'earnings',
      label: dict('PC.Pages.SystemWithdrawal.tabEarnings'),
      children: (
        <Card style={{ maxWidth: 560 }}>
          <p style={{ color: '#999' }}>
            {dict('PC.Pages.SystemWithdrawal.earningsPlaceholder')}
          </p>
        </Card>
      ),
    },
  ];

  return (
    <WorkspaceLayout title={dict('PC.Routes.devWithdrawal')}>
      <WithdrawalStats
        pendingCount={pendingCount}
        totalApproved={totalApproved}
        totalCount={MOCK_WITHDRAWALS.length}
      />

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <Modal
        title={dict('PC.Pages.SystemWithdrawal.rejectModalTitle')}
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectReason('');
        }}
        onOk={handleReject}
        okButtonProps={{ danger: true }}
        okText={dict('PC.Pages.SystemWithdrawal.reject')}
      >
        <p style={{ marginBottom: 12 }}>
          {dict('PC.Pages.SystemWithdrawal.rejectReasonLabel')}
        </p>
        <Input.TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder={dict(
            'PC.Pages.SystemWithdrawal.rejectReasonPlaceholder',
          )}
          maxLength={200}
          showCount
        />
      </Modal>
    </WorkspaceLayout>
  );
};

export default Withdrawal;
