import { TableActions, XProTable } from '@/components/ProComponents';
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
import { Button, Card, Col, Row, Statistic, Tag, Tooltip, message } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import OrderDetailDrawer from './OrderDetailDrawer';

interface PaymentOrderExt extends AdminOrderInfo {
  netAmount: number;
  serviceFee: number;
  paidAt: string;
}

const MOCK_PAYMENT_ORDERS: PaymentOrderExt[] = [
  {
    id: 1,
    userName: 'Alice Wang',
    orderNo: 'ORD20260401001',
    productName: 'Basic Plan',
    orderType: OrderTypeEnum.Subscription,
    amount: 99,
    netAmount: 97.02,
    serviceFee: 1.98,
    payMethod: '微信支付',
    status: OrderStatusEnum.Paid,
    createdAt: '2026-04-01T10:30:00Z',
    paidAt: '2026-04-01T10:31:22Z',
  },
  {
    id: 2,
    userName: 'Bob Li',
    orderNo: 'ORD20260315001',
    productName: 'Pro Plan',
    orderType: OrderTypeEnum.Subscription,
    amount: 269,
    netAmount: 263.62,
    serviceFee: 5.38,
    payMethod: '支付宝',
    status: OrderStatusEnum.Paid,
    createdAt: '2026-03-15T14:20:00Z',
    paidAt: '2026-03-15T14:21:05Z',
  },
  {
    id: 3,
    userName: 'Diana Chen',
    orderNo: 'ORD20260220001',
    productName: '100 积分包',
    orderType: OrderTypeEnum.Credits,
    amount: 10,
    netAmount: 9.8,
    serviceFee: 0.2,
    payMethod: '微信支付',
    status: OrderStatusEnum.Refunded,
    createdAt: '2026-02-20T09:00:00Z',
    paidAt: '2026-02-20T09:01:30Z',
  },
  {
    id: 4,
    userName: 'Eric Zhang',
    orderNo: 'ORD20260415001',
    productName: '企业包 10000 积分',
    orderType: OrderTypeEnum.Credits,
    amount: 600,
    netAmount: 588.0,
    serviceFee: 12.0,
    payMethod: '支付宝',
    status: OrderStatusEnum.Paid,
    createdAt: '2026-04-15T16:00:00Z',
    paidAt: '2026-04-15T16:02:10Z',
  },
  {
    id: 5,
    userName: 'Fiona Liu',
    orderNo: 'ORD20260429001',
    productName: 'Enterprise Plan',
    orderType: OrderTypeEnum.Subscription,
    amount: 999,
    netAmount: 0,
    serviceFee: 0,
    status: OrderStatusEnum.Pending,
    createdAt: '2026-04-29T08:30:00Z',
    paidAt: '',
  },
];

const MOCK_STATS = {
  totalOrders: 1286,
  totalAmount: 286500,
  netAmount: 280770,
  serviceFee: 5730,
};

const Orders: React.FC = () => {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>();
  const handleCloseDetails = useCallback(() => {
    setDetailsVisible(false);
    setCurrentRecord(undefined);
  }, []);

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

  const columns: ProColumns<PaymentOrderExt>[] = [
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
        <span style={{ fontWeight: 600 }}>¥{record.amount ?? 0}</span>
      ),
    },
    {
      title: dict('PC.Pages.SystemPaymentOrders.colNetAmount'),
      dataIndex: 'netAmount',
      key: 'netAmount',
      search: false,
      render: (val: any) => `¥${(Number(val) || 0).toFixed(2)}`,
    },
    {
      title: dict('PC.Pages.SystemPaymentOrders.colServiceFee'),
      dataIndex: 'serviceFee',
      key: 'serviceFee',
      search: false,
      render: (val: any) => (
        <span style={{ color: '#ff4d4f' }}>
          ¥{(Number(val) || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: dict('PC.Pages.MorePage.MyOrders.colPayMethod'),
      dataIndex: 'payMethod',
      key: 'payMethod',
      search: false,
      valueType: 'select',
      valueEnum: {
        '': { text: dict('PC.Common.Global.all') },
        wechat: { text: dict('PC.Pages.SystemPaymentOrders.payMethodWechat') },
        alipay: { text: dict('PC.Pages.SystemPaymentOrders.payMethodAlipay') },
        bank: { text: dict('PC.Pages.SystemPaymentOrders.payMethodBank') },
      },
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
      title: dict('PC.Pages.SystemPaymentOrders.colPaidAt'),
      dataIndex: 'paidAt',
      key: 'paidAt',
      search: false,
      render: (val) => (val ? formatDateTime(val) : '-'),
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
              label: dict('PC.Pages.SystemPaymentOrders.viewDetail'),
              onClick: (r) => {
                setCurrentRecord(r);
                setDetailsVisible(true);
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
        {/* 统计卡 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title={dict('PC.Pages.SystemPaymentOrders.statTotalOrders')}
                value={MOCK_STATS.totalOrders}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={dict('PC.Pages.SystemPaymentOrders.statTotalAmount')}
                value={MOCK_STATS.totalAmount}
                precision={0}
                prefix="¥"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={dict('PC.Pages.SystemPaymentOrders.statNetAmount')}
                value={MOCK_STATS.netAmount}
                precision={0}
                prefix="¥"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={dict('PC.Pages.SystemPaymentOrders.statServiceFee')}
                value={MOCK_STATS.serviceFee}
                precision={0}
                prefix="¥"
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        <XProTable<PaymentOrderExt>
          rowKey="id"
          columns={columns}
          request={async (params) => {
            try {
              const res = await apiListAdminPaymentOrders({
                keyword: params.userName,
                status: params.status,
                orderType: params.orderType,
                payMethod: params.payMethod,
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
      <OrderDetailDrawer
        open={detailsVisible}
        record={currentRecord}
        onClose={handleCloseDetails}
      />
    </>
  );
};

export default Orders;
