import { TableActions, XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  getPayChannelValueEnum,
  getPaymentStatusConfig,
  getPaymentStatusValueEnum,
} from '@/constants/subscription.constants';
import { dict } from '@/services/i18nRuntime';
import { apiPageAdminPaymentOrders } from '@/services/subscriptionService';
import type { AdminPaymentOrderRecord } from '@/types/interfaces/subscription';
import type { ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import React, { useMemo, useState } from 'react';
import OrderDetail from './components/OrderDetail';

const Orders: React.FC = () => {
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<AdminPaymentOrderRecord>();

  const statusConfig = useMemo(() => getPaymentStatusConfig(), []);
  const paymentStatusValueEnum = useMemo(() => getPaymentStatusValueEnum(), []);
  const payChannelValueEnum = useMemo(() => getPayChannelValueEnum(), []);

  const columns: ProColumns<AdminPaymentOrderRecord>[] = [
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Orders.colStartTime',
      ),
      dataIndex: 'createdStart',
      key: 'createdStart',
      valueType: 'date',
      hideInTable: true,
      search: true,
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Orders.colEndTime',
      ),
      dataIndex: 'createdEnd',
      key: 'createdEnd',
      valueType: 'date',
      hideInTable: true,
      search: true,
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Orders.colPayMethod',
      ),
      dataIndex: 'payChannel',
      key: 'payChannel',
      valueType: 'select',
      valueEnum: payChannelValueEnum,
      render: (val: any) => val || '-',
    },
    {
      title: dict('PC.Pages.SystemManagement.PaymentEarnings.Orders.colAmount'),
      dataIndex: 'orderAmount',
      key: 'orderAmount',
      search: false,
      render: (val: any) => (
        <span style={{ fontWeight: 600 }}>
          ¥
          {new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2 }).format(
            Number(val) || 0,
          )}
        </span>
      ),
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Orders.colNetAmount',
      ),
      dataIndex: 'netAmount',
      key: 'netAmount',
      search: false,
      render: (val: any) =>
        `¥${new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2 }).format(
          Number(val) || 0,
        )}`,
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Orders.colServiceFee',
      ),
      key: 'serviceFee',
      search: false,
      render: (_, record) => (
        <span style={{ color: '#ff4d4f' }}>
          ¥
          {new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2 }).format(
            Number(record.platformFee) + Number(record.providerFee) || 0,
          )}
        </span>
      ),
    },
    {
      title: dict('PC.Pages.SystemManagement.PaymentEarnings.Orders.colStatus'),
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      valueType: 'select',
      valueEnum: paymentStatusValueEnum,
      render: (_, record) => {
        const config = (statusConfig as any)[record.paymentStatus];
        return config ? (
          <Tag color={config.color}>{config.label}</Tag>
        ) : (
          record.paymentStatus
        );
      },
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Orders.colCreateTime',
      ),
      dataIndex: 'created',
      key: 'createTime',
      search: false,
      valueType: 'dateTime',
    },
    {
      title: dict('PC.Pages.SystemManagement.PaymentEarnings.Orders.colPaidAt'),
      dataIndex: 'modified',
      key: 'paidAt',
      search: false,
      valueType: 'dateTime',
    },
    {
      title: dict('PC.Common.Global.action'),
      key: 'action',
      search: false,
      width: 100,
      render: (_, record) => (
        <TableActions
          record={record}
          actions={[
            {
              key: 'detail',
              label: dict(
                'PC.Pages.SystemManagement.PaymentEarnings.Orders.viewDetail',
              ),
              onClick: () => {
                setCurrentRow(record);
                setDetailOpen(true);
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <WorkspaceLayout title={dict('PC.Routes.paymentOrders')}>
        <XProTable<AdminPaymentOrderRecord>
          rowKey="id"
          columns={columns}
          request={async (params) => {
            try {
              const {
                current,
                pageSize,
                paymentStatus,
                payChannel,
                createdStart,
                createdEnd,
              } = params;
              const res = await apiPageAdminPaymentOrders({
                paymentStatus,
                payChannel,
                createdStart,
                createdEnd,
                page: current || 1,
                pageSize: pageSize || 10,
              });
              if (res?.code === SUCCESS_CODE && res.data) {
                return {
                  data: res.data.records || [],
                  total: res.data.total || 0,
                  success: true,
                };
              }
            } catch (err) {
              console.error('Failed to fetch payment orders:', err);
            }
            return {
              data: [],
              total: 0,
              success: true,
            };
          }}
        />
      </WorkspaceLayout>

      <OrderDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        data={currentRow}
      />
    </>
  );
};

export default Orders;
