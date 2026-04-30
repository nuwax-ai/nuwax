import { TableActions, XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiListAdminOrders } from '@/services/subscriptionService';
import type { AdminOrderInfo } from '@/types/interfaces/subscription';
import {
  OrderStatusEnum,
  OrderTypeEnum,
} from '@/types/interfaces/subscription';
import { formatDate } from '@/utils/dateUtils';
import type { ProColumns } from '@ant-design/pro-components';
import { Card, Col, Row, Statistic, Tag } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import OrderDetailDrawer from './OrderDetailDrawer';

interface SubsOrderExt extends AdminOrderInfo {
  startAt?: string;
  expireAt?: string;
}

const MOCK_ADMIN_ORDERS: SubsOrderExt[] = [
  {
    id: 1,
    userName: 'Alice Wang',
    orderNo: 'REC20260401001',
    productName: 'Basic Plan',
    orderType: OrderTypeEnum.Subscription,
    amount: 99,
    status: OrderStatusEnum.Paid,
    startAt: '2026-04-01T00:00:00Z',
    expireAt: '2026-05-01T00:00:00Z',
    createdAt: '2026-04-01T10:30:00Z',
  },
  {
    id: 2,
    userName: 'Bob Li',
    orderNo: 'REC20260315001',
    productName: 'Pro Plan',
    orderType: OrderTypeEnum.Subscription,
    amount: 269,
    status: OrderStatusEnum.Paid,
    startAt: '2026-03-15T00:00:00Z',
    expireAt: '2026-06-15T00:00:00Z',
    createdAt: '2026-03-15T14:20:00Z',
  },
  {
    id: 3,
    userName: 'Diana Chen',
    orderNo: 'REC20260220001',
    productName: '100 积分包',
    orderType: OrderTypeEnum.Credits,
    amount: 10,
    status: OrderStatusEnum.Refunded,
    createdAt: '2026-02-20T09:00:00Z',
  },
  {
    id: 4,
    userName: 'Eric Zhang',
    orderNo: 'REC20260415001',
    productName: '企业包 10000 积分',
    orderType: OrderTypeEnum.Credits,
    amount: 600,
    status: OrderStatusEnum.Paid,
    createdAt: '2026-04-15T16:00:00Z',
  },
  {
    id: 5,
    userName: 'Fiona Liu',
    orderNo: 'REC20260429001',
    productName: 'Enterprise Plan',
    orderType: OrderTypeEnum.Subscription,
    amount: 999,
    status: OrderStatusEnum.Pending,
    startAt: '2026-04-29T00:00:00Z',
    expireAt: '2027-04-29T00:00:00Z',
    createdAt: '2026-04-29T08:30:00Z',
  },
];

const MOCK_STATS = {
  totalRecords: 528,
  subscriptionCount: 312,
  creditsCount: 216,
  totalAmount: 86500,
};

const SubsOrders: React.FC = () => {
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

  const columns: ProColumns<SubsOrderExt>[] = [
    {
      title: dict('PC.Pages.SystemSubsOrders.colRecordNo'),
      dataIndex: 'orderNo',
      key: 'orderNo',
      ellipsis: true,
      width: 180,
    },
    {
      title: dict('PC.Pages.SystemSubsOrders.colDeveloper'),
      dataIndex: 'userName',
      key: 'userName',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.SystemSubsOrders.colSubscriptionType'),
      dataIndex: 'orderType',
      key: 'orderType',
      search: false,
      render: (_, record) =>
        record.orderType === OrderTypeEnum.Subscription
          ? dict('PC.Pages.MorePage.MyOrders.typeSubscription')
          : dict('PC.Pages.MorePage.MyOrders.typeCredits'),
      valueEnum: {
        [OrderTypeEnum.Subscription]: {
          text: dict('PC.Pages.MorePage.MyOrders.typeSubscription'),
        },
        [OrderTypeEnum.Credits]: {
          text: dict('PC.Pages.MorePage.MyOrders.typeCredits'),
        },
      },
    },
    {
      title: dict('PC.Pages.SystemSubsOrders.colPlanName'),
      dataIndex: 'productName',
      key: 'productName',
      ellipsis: true,
      search: false,
    },
    {
      title: dict('PC.Pages.MorePage.MyOrders.colAmount'),
      dataIndex: 'amount',
      key: 'amount',
      search: false,
      render: (_, record) => (
        <span style={{ fontWeight: 600 }}>
          {dict('PC.Common.Global.currencySymbol')}
          {record.amount ?? 0}
        </span>
      ),
    },
    {
      title: dict('PC.Pages.SystemSubsOrders.colStartAt'),
      dataIndex: 'startAt',
      key: 'startAt',
      search: false,
      render: (val) => (val ? formatDate(val) : '-'),
    },
    {
      title: dict('PC.Pages.SystemSubsOrders.colExpireAt'),
      dataIndex: 'expireAt',
      key: 'expireAt',
      search: false,
      render: (val) => (val ? formatDate(val) : '-'),
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
              label: dict('PC.Pages.SystemSubsOrders.viewDetail'),
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
      <WorkspaceLayout title={dict('PC.Routes.subsOrders')}>
        {/* 统计卡 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title={dict('PC.Pages.SystemSubsOrders.statTotalRecords')}
                value={MOCK_STATS.totalRecords}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={dict('PC.Pages.SystemSubsOrders.statSubscriptionCount')}
                value={MOCK_STATS.subscriptionCount}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={dict('PC.Pages.SystemSubsOrders.statCreditsCount')}
                value={MOCK_STATS.creditsCount}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={dict('PC.Pages.SystemSubsOrders.statTotalAmount')}
                value={MOCK_STATS.totalAmount}
                precision={0}
                prefix={dict('PC.Common.Global.currencySymbol')}
              />
            </Card>
          </Col>
        </Row>

        <XProTable<SubsOrderExt>
          rowKey="id"
          columns={columns}
          request={async (params) => {
            try {
              const res = await apiListAdminOrders({
                keyword: params.userName,
                orderType: params.orderType,
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
              data: MOCK_ADMIN_ORDERS,
              total: MOCK_ADMIN_ORDERS.length,
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

export default SubsOrders;
