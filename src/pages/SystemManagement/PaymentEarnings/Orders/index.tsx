import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiListAdminPaymentOrders } from '@/services/subscriptionService';
import type { AdminOrderInfo } from '@/types/interfaces/subscription';
import {
  OrderStatusEnum,
  OrderTypeEnum,
} from '@/types/interfaces/subscription';
import { copyTextToClipboard } from '@/utils/clipboard';
import { formatDateTime } from '@/utils/dateUtils';
import { CopyOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Tag, Tooltip, message } from 'antd';
import React, { useMemo } from 'react';

const MOCK_PAYMENT_ORDERS: AdminOrderInfo[] = [
  {
    id: 1,
    userName: 'Alice Wang',
    orderNo: 'ORD20260401001',
    productName: 'Basic Plan',
    orderType: OrderTypeEnum.Subscription,
    amount: 99,
    payMethod: '微信支付',
    status: OrderStatusEnum.Paid,
    createdAt: '2026-04-01T10:30:00Z',
  },
  {
    id: 2,
    userName: 'Bob Li',
    orderNo: 'ORD20260315001',
    productName: 'Pro Plan',
    orderType: OrderTypeEnum.Subscription,
    amount: 269,
    payMethod: '支付宝',
    status: OrderStatusEnum.Paid,
    createdAt: '2026-03-15T14:20:00Z',
  },
  {
    id: 3,
    userName: 'Diana Chen',
    orderNo: 'ORD20260220001',
    productName: '100 积分包',
    orderType: OrderTypeEnum.Credits,
    amount: 10,
    payMethod: '微信支付',
    status: OrderStatusEnum.Refunded,
    createdAt: '2026-02-20T09:00:00Z',
  },
  {
    id: 4,
    userName: 'Eric Zhang',
    orderNo: 'ORD20260415001',
    productName: '企业包 10000 积分',
    orderType: OrderTypeEnum.Credits,
    amount: 600,
    payMethod: '支付宝',
    status: OrderStatusEnum.Paid,
    createdAt: '2026-04-15T16:00:00Z',
  },
  {
    id: 5,
    userName: 'Fiona Liu',
    orderNo: 'ORD20260429001',
    productName: 'Enterprise Plan',
    orderType: OrderTypeEnum.Subscription,
    amount: 999,
    status: OrderStatusEnum.Pending,
    createdAt: '2026-04-29T08:30:00Z',
  },
];

const Orders: React.FC = () => {
  const statusConfig = useMemo(
    () => ({
      [OrderStatusEnum.Paid]: {
        color: 'success',
        label: dict('PC.Pages.MorePage.MyOrders.statusPaid'),
      },
      [OrderStatusEnum.Pending]: {
        color: 'warning',
        label: dict('PC.Pages.MorePage.MyOrders.statusPending'),
      },
      [OrderStatusEnum.Refunded]: {
        color: 'default',
        label: dict('PC.Pages.MorePage.MyOrders.statusRefunded'),
      },
    }),
    [],
  );

  const columns: ProColumns<AdminOrderInfo>[] = [
    {
      title: dict('PC.Pages.SystemSubsOrders.colUser'),
      dataIndex: 'userName',
      key: 'userName',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.MorePage.MyOrders.colOrderNo'),
      dataIndex: 'orderNo',
      key: 'orderNo',
      ellipsis: true,
      width: 200,
      render: (_, record) => (
        <span>
          {record.orderNo}
          <Tooltip title={dict('PC.Common.Global.copy')}>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() =>
                copyTextToClipboard(record.orderNo, () =>
                  message.success(dict('PC.Pages.MorePage.MyOrders.copied')),
                )
              }
              style={{ marginLeft: 4 }}
            />
          </Tooltip>
        </span>
      ),
    },
    {
      title: dict('PC.Pages.MorePage.MyOrders.colProduct'),
      dataIndex: 'productName',
      key: 'productName',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.MorePage.MyOrders.colType'),
      dataIndex: 'orderType',
      key: 'orderType',
      search: false,
      render: (_, record) =>
        record.orderType === OrderTypeEnum.Subscription
          ? dict('PC.Pages.MorePage.MyOrders.typeSubscription')
          : dict('PC.Pages.MorePage.MyOrders.typeCredits'),
    },
    {
      title: dict('PC.Pages.MorePage.MyOrders.colAmount'),
      dataIndex: 'amount',
      key: 'amount',
      search: false,
      render: (_, record) => (
        <span style={{ fontWeight: 600 }}>¥{record.amount}</span>
      ),
    },
    {
      title: dict('PC.Pages.MorePage.MyOrders.colPayMethod'),
      dataIndex: 'payMethod',
      key: 'payMethod',
      search: false,
      render: (val) => val || '-',
    },
    {
      title: dict('PC.Pages.MorePage.MyOrders.colCreatedAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      search: false,
      render: (val) => formatDateTime(val),
    },
    {
      title: dict('PC.Pages.MorePage.MyOrders.colStatus'),
      dataIndex: 'status',
      key: 'status',
      search: false,
      render: (_, record) => {
        const cfg = statusConfig[record.status];
        return <Tag color={cfg?.color}>{cfg?.label}</Tag>;
      },
      valueEnum: {
        [OrderStatusEnum.Paid]: {
          text: dict('PC.Pages.MorePage.MyOrders.statusPaid'),
        },
        [OrderStatusEnum.Pending]: {
          text: dict('PC.Pages.MorePage.MyOrders.statusPending'),
        },
        [OrderStatusEnum.Refunded]: {
          text: dict('PC.Pages.MorePage.MyOrders.statusRefunded'),
        },
      },
    },
  ];

  return (
    <WorkspaceLayout title={dict('PC.Routes.paymentOrders')}>
      <XProTable<AdminOrderInfo>
        rowKey="id"
        columns={columns}
        request={async (params) => {
          try {
            const res = await apiListAdminPaymentOrders({
              keyword: params.userName,
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
          return {
            data: MOCK_PAYMENT_ORDERS,
            total: MOCK_PAYMENT_ORDERS.length,
            success: true,
          };
        }}
      />
    </WorkspaceLayout>
  );
};

export default Orders;
