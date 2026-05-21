import { XProTable } from '@/components/ProComponents';
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
import { ActionType, ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import React, { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'umi';

const Orders: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const location = useLocation();

  useEffect(() => {
    actionRef.current?.reload();
  }, [location]);

  const statusConfig = useMemo(() => getPaymentStatusConfig(), []);
  const paymentStatusValueEnum = useMemo(() => getPaymentStatusValueEnum(), []);
  const payChannelValueEnum = useMemo(() => getPayChannelValueEnum(), []);

  const columns: ProColumns<AdminPaymentOrderRecord>[] = [
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Orders.colOrderNo',
      ),
      dataIndex: 'bizOrderNo',
      key: 'bizOrderNo',
      width: 200,
      search: true,
      fixed: 'left',
    },
    {
      title: dict('PC.Pages.SystemManagement.PaymentEarnings.Orders.colRemark'),
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
      search: false,
      width: 200,
    },
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
      width: 120,
      valueType: 'select',
      valueEnum: payChannelValueEnum,
      render: (val: any) => val || '-',
    },
    {
      title: dict('PC.Pages.SystemManagement.PaymentEarnings.Orders.colAmount'),
      dataIndex: 'orderAmount',
      key: 'orderAmount',
      width: 120,
      search: false,
      render: (_, record) => (
        <span style={{ fontWeight: 600 }}>
          ¥
          {new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2 }).format(
            Number(record.orderAmount) || 0,
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
      width: 120,
      search: false,
      render: (_, record) =>
        `¥${new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2 }).format(
          Number(record.netAmount) || 0,
        )}`,
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Orders.colServiceFee',
      ),
      key: 'serviceFee',
      width: 120,
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
      width: 120,
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
      width: 180,
      search: false,
      valueType: 'dateTime',
    },
    {
      title: dict('PC.Pages.SystemManagement.PaymentEarnings.Orders.colPaidAt'),
      dataIndex: 'modified',
      key: 'paidAt',
      width: 180,
      search: false,
      valueType: 'dateTime',
    },
  ];

  return (
    <WorkspaceLayout title={dict('PC.Routes.paymentOrders')}>
      <XProTable<AdminPaymentOrderRecord>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        scroll={{ x: 1500 }}
        request={async (params) => {
          try {
            const {
              current,
              pageSize,
              paymentStatus,
              payChannel,
              createdStart,
              createdEnd,
              bizOrderNo,
            } = params;
            const res = await apiPageAdminPaymentOrders({
              paymentStatus,
              payChannel,
              createdStart,
              createdEnd,
              bizOrderNo,
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
  );
};

export default Orders;
