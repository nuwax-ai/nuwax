import { XProTable } from '@/components/ProComponents';
import { useSubscriptionPurchase } from '@/pages/MorePage/MySubscriptions/hooks/useSubscriptionPurchase';
import { dict } from '@/services/i18nRuntime';
import { apiGetMyBillOrders } from '@/services/subscriptionService';
import {
  BillBizTypeEnum,
  BillOrderInfo,
  BillPayStatusEnum,
} from '@/types/interfaces/subscription';
import type { ActionType, FormInstance } from '@ant-design/pro-components';
import { ProColumns } from '@ant-design/pro-components';
import { Button, Descriptions, Modal, Tag } from 'antd';
import React, { useMemo, useRef, useState } from 'react';

const BIZ_TYPE_MAP: Record<string, string> = {
  [BillBizTypeEnum.CREDIT_PURCHASE]: dict(
    'PC.Pages.MorePage.MyOrders.bizTypeCreditPurchase',
  ),
  [BillBizTypeEnum.SUBSCRIPTION]: dict(
    'PC.Pages.MorePage.MyOrders.bizTypeSubscription',
  ),
  [BillBizTypeEnum.DESK_BUDDY]: dict(
    'PC.Pages.MorePage.MyOrders.bizTypeDeskBuddy',
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

const parseExtra = (extra: any) => {
  if (!extra) return null;
  if (typeof extra === 'string') {
    try {
      return JSON.parse(extra);
    } catch {
      return null;
    }
  }
  if (typeof extra === 'object') {
    return extra;
  }
  return null;
};

const OrderList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();

  const [shippingModalData, setShippingModalData] = useState<{
    name?: string;
    phone?: string;
    address?: string;
  } | null>(null);

  const { processingId, handlePayExistingOrder } = useSubscriptionPurchase();

  const columns: ProColumns<BillOrderInfo>[] = useMemo(
    () => [
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
        render: (_, record) => {
          const extraObj = parseExtra(record.extra);
          const hasShippingInfo =
            extraObj && (extraObj.name || extraObj.phone || extraObj.address);
          const label = BIZ_TYPE_MAP[record.bizType] || record.bizType;

          return (
            <div
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <span>{label}</span>
              {hasShippingInfo && (
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShippingModalData(extraObj);
                  }}
                >
                  {dict('PC.Pages.MorePage.MyOrders.shippingInfo')}
                </Button>
              )}
            </div>
          );
        },
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
          const isPendingPay =
            record.payStatus === BillPayStatusEnum.PENDING ||
            record.payStatus === BillPayStatusEnum.PROCESSING;

          return (
            <div
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {info ? <Tag color={info.color}>{info.text}</Tag> : '-'}
              {isPendingPay && (
                <Button
                  type="link"
                  size="small"
                  loading={processingId === record.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePayExistingOrder(record.id);
                  }}
                >
                  {dict('PC.Pages.MorePage.MyOrders.goPay')}
                </Button>
              )}
            </div>
          );
        },
      },
      {
        title: dict('PC.Pages.MorePage.MyOrders.colCreated'),
        dataIndex: 'created',
        search: false,
        width: 170,
        valueType: 'dateTime',
      },
    ],
    [processingId, handlePayExistingOrder],
  );

  return (
    <>
      <XProTable<BillOrderInfo>
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        columns={columns}
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

      <Modal
        title={dict('PC.Pages.MorePage.MyOrders.shippingInfo')}
        open={!!shippingModalData}
        onCancel={() => setShippingModalData(null)}
        footer={null}
        destroyOnClose
      >
        <Descriptions
          column={1}
          bordered
          size="small"
          style={{ marginTop: 16 }}
        >
          <Descriptions.Item
            label={dict('PC.Pages.MorePage.MyOrders.receiverName')}
          >
            {shippingModalData?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item
            label={dict('PC.Pages.MorePage.MyOrders.receiverPhone')}
          >
            {shippingModalData?.phone || '-'}
          </Descriptions.Item>
          <Descriptions.Item
            label={dict('PC.Pages.MorePage.MyOrders.receiverAddress')}
          >
            {shippingModalData?.address || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </>
  );
};

export default OrderList;
