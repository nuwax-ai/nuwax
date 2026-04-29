import { TableActions, XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiListMyOrders,
  apiRefundOrder,
} from '@/services/subscriptionService';
import type { OrderInfo } from '@/types/interfaces/subscription';
import {
  OrderStatusEnum,
  OrderTypeEnum,
} from '@/types/interfaces/subscription';
import { copyTextToClipboard } from '@/utils/clipboard';
import { formatDateTime } from '@/utils/dateUtils';
import { CopyOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Tag, Tooltip, message } from 'antd';
import React, { useMemo, useRef } from 'react';

const MyOrders: React.FC = () => {
  const actionRef = useRef<ActionType>();

  const orderTypeLabel = useMemo(
    () => ({
      [OrderTypeEnum.Subscription]: dict(
        'PC.Pages.MorePage.MyOrders.typeSubscription',
      ),
      [OrderTypeEnum.Credits]: dict('PC.Pages.MorePage.MyOrders.typeCredits'),
    }),
    [],
  );

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

  const handleCopyOrderNo = (orderNo: string) => {
    copyTextToClipboard(orderNo, () => {
      message.success(dict('PC.Pages.MorePage.MyOrders.copied'));
    });
  };

  const handleRefund = async (id: number) => {
    try {
      await apiRefundOrder(id);
      message.success(dict('PC.Pages.MorePage.MyOrders.refundSuccess'));
      actionRef.current?.reload();
    } catch {
      message.error(dict('PC.Pages.MorePage.MyOrders.refundFailed'));
    }
  };

  const columns: ProColumns<OrderInfo>[] = [
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
              onClick={() => handleCopyOrderNo(record.orderNo)}
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
        orderTypeLabel[record.orderType] || record.orderType,
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
      title: dict('PC.Pages.MorePage.MyOrders.colAmount'),
      dataIndex: 'amount',
      key: 'amount',
      search: false,
      render: (_, record) =>
        `${dict('PC.Common.Global.currencySymbol')}${record.amount}`,
    },
    {
      title: dict('PC.Pages.MorePage.MyOrders.colPayMethod'),
      dataIndex: 'payMethod',
      key: 'payMethod',
      search: false,
      render: (val) => val || dict('PC.Common.Global.emptyPlaceholder'),
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
        const config = statusConfig[record.status];
        return <Tag color={config?.color}>{config?.label}</Tag>;
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
      title: dict('PC.Pages.MorePage.MyOrders.colAction'),
      key: 'action',
      search: false,
      width: 120,
      render: (_, record) =>
        record.status === OrderStatusEnum.Paid ? (
          <TableActions
            record={record}
            actions={[
              {
                key: 'refund',
                label: dict('PC.Pages.MorePage.MyOrders.applyRefund'),
                danger: true,
                confirm: {
                  title: dict('PC.Pages.MorePage.MyOrders.confirmRefund'),
                },
                onClick: async (r) => {
                  await handleRefund(r.id);
                },
              },
            ]}
          />
        ) : null,
    },
  ];

  return (
    <WorkspaceLayout title={dict('PC.Pages.MorePage.MyOrders.pageTitle')}>
      <XProTable<OrderInfo>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await apiListMyOrders({
            keyword: params.productName,
            orderType: params.orderType,
            status: params.status,
            pageNum: params.current,
            pageSize: params.pageSize,
          });
          if (res?.code === SUCCESS_CODE) {
            return {
              data: res.data?.list ?? [],
              total: res.data?.total ?? 0,
              success: true,
            };
          }
          return { data: [], total: 0, success: false };
        }}
      />
    </WorkspaceLayout>
  );
};

export default MyOrders;
