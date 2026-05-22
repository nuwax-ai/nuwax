import { XProTable } from '@/components/ProComponents';
import { apiGetAgentSubscriptionOrderCashier } from '@/pages/EditAgent/services/agent-subscription-plan';
import { dict } from '@/services/i18nRuntime';
import { apiGetMyBillOrders } from '@/services/subscriptionService';
import {
  BillBizTypeEnum,
  BillOrderInfo,
  BillPayStatusEnum,
} from '@/types/interfaces/subscription';
import type { ActionType, FormInstance } from '@ant-design/pro-components';
import { ProColumns } from '@ant-design/pro-components';
import { Button, Tag } from 'antd';
import React, { useRef, useState } from 'react';

const BIZ_TYPE_MAP: Record<string, string> = {
  [BillBizTypeEnum.CREDIT_PURCHASE]: dict(
    'PC.Pages.MorePage.MyOrders.bizTypeCreditPurchase',
  ),
  [BillBizTypeEnum.SUBSCRIPTION]: dict(
    'PC.Pages.MorePage.MyOrders.bizTypeSubscription',
  ),
};

const ORDER_STATUS_MAP: Record<string, { text: string; color: string }> = {
  PENDING: {
    text: dict('PC.Pages.MorePage.MyOrders.orderStatusPending'),
    color: 'warning',
  },
  PAID: {
    text: dict('PC.Pages.MorePage.MyOrders.orderStatusPaid'),
    color: 'success',
  },
  CANCELLED: {
    text: dict('PC.Pages.MorePage.MyOrders.orderStatusCancelled'),
    color: 'default',
  },
};

const columns: ProColumns<BillOrderInfo>[] = [
  {
    title: dict('PC.Pages.MorePage.MyOrders.colOrderId'),
    dataIndex: 'id',
    search: false,
  },
  {
    title: dict('PC.Pages.MorePage.MyOrders.colDescription'),
    dataIndex: 'description',
    search: false,
    ellipsis: true,
  },
  {
    title: dict('PC.Pages.MorePage.MyOrders.colBizType'),
    dataIndex: 'bizType',
    search: false,
    render: (_, record) => BIZ_TYPE_MAP[record.bizType] || record.bizType,
  },
  {
    title: dict('PC.Pages.MorePage.MyOrders.colAmount'),
    dataIndex: 'amount',
    search: false,
    render: (_, record) => `¥${Number(record.amount).toFixed(2)}`,
  },
  {
    title: dict('PC.Pages.MorePage.MyOrders.colOrderStatus'),
    dataIndex: 'orderStatus',
    valueType: 'select',
    valueEnum: Object.entries(ORDER_STATUS_MAP).reduce(
      (acc, [key, val]) => ({ ...acc, [key]: { text: val.text } }),
      {},
    ),
    render: (_, record) => {
      const info = ORDER_STATUS_MAP[record.orderStatus];
      return info ? <Tag color={info.color}>{info.text}</Tag> : '-';
    },
  },
  {
    title: dict('PC.Pages.MorePage.MyOrders.colCreated'),
    dataIndex: 'created',
    search: false,
    valueType: 'dateTime',
  },
];

const OrderList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();

  const [payingId, setPayingId] = useState<string | number | null>(null);

  const handleGoPay = async (id: string | number) => {
    setPayingId(id);
    try {
      const res = await apiGetAgentSubscriptionOrderCashier({ orderId: id });
      const d = res?.data || res;
      if (d?.cashierUrl) {
        window.open(d.cashierUrl, '_blank');
      }
    } catch (err: any) {
    } finally {
      setPayingId(null);
    }
  };

  const actionColumn: ProColumns<BillOrderInfo> = {
    title: dict('PC.Pages.MorePage.MyOrders.colAction'),
    valueType: 'option',
    fixed: 'right',
    render: (_, record) => {
      const isPendingPay =
        record.payStatus === BillPayStatusEnum.PENDING ||
        record.payStatus === BillPayStatusEnum.PROCESSING;
      if (!isPendingPay) return null;
      return (
        <Button
          type="link"
          size="small"
          loading={payingId === record.id}
          onClick={(e) => {
            e.stopPropagation();
            handleGoPay(record.id);
          }}
        >
          {dict('PC.Pages.MorePage.MyOrders.goPay')}
        </Button>
      );
    },
  };

  const allColumns = [...columns, actionColumn];

  return (
    <XProTable<BillOrderInfo>
      actionRef={actionRef}
      formRef={formRef}
      rowKey="id"
      columns={allColumns}
      request={async (params) => {
        const { current, pageSize, orderStatus } = params;
        const res = await apiGetMyBillOrders({
          orderStatus: orderStatus || null,
          pageNum: current,
          pageSize,
        });
        if (res.success) {
          return {
            data: Array.isArray(res.data?.records) ? res.data.records : [],
            success: true,
            total: res.data?.total || 0,
          };
        }
        return { data: [], success: false, total: 0 };
      }}
    />
  );
};

export default OrderList;
