import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  BillBizTypeEnum,
  BillOrderInfo,
  BillOrderItem,
  BillOrderStatusEnum,
  BillPayStatusEnum,
} from '@/types/interfaces/subscription';
import { formatDateTimeYmdHms } from '@/utils/dateUtils';
import type { ParamsType, ProColumns } from '@ant-design/pro-components';
import { Button, Card, Col, Row, Statistic, Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiGetOrderRevenueList,
  apiGetOrderRevenueStats,
} from '../services/order-revenue';
import {
  type BillOrderSearchParams,
  BillRevenueStatsInfo,
} from '../types/order-revenue';
import OrderLineItemsModal from './OrderLineItemsModal';

/** 支付状态展示文案（模块加载时 `dict` 解析一次） */
const PAY_STATUS_LABELS: Record<BillPayStatusEnum, string> = {
  [BillPayStatusEnum.PENDING]: dict(
    'PC.Pages.SystemSubsOrders.payStatusPending',
  ),
  [BillPayStatusEnum.PROCESSING]: dict(
    'PC.Pages.SystemSubsOrders.payStatusProcessing',
  ),
  [BillPayStatusEnum.SUCCESS]: dict(
    'PC.Pages.SystemSubsOrders.payStatusSuccess',
  ),
  [BillPayStatusEnum.FAILED]: dict('PC.Pages.SystemSubsOrders.payStatusFailed'),
  [BillPayStatusEnum.CLOSED]: dict('PC.Pages.SystemSubsOrders.payStatusClosed'),
};

/** ProTable 查询参数（与 BillOrderSearchParams 对齐筛选项；userId→keyword；created 为 dateTimeRange 表单值） */
type BillOrderRevenueTableParams = ParamsType &
  Partial<BillOrderSearchParams> & {
    userId?: string | number;
    /** 创建时间筛选（表单 dateTimeRange，非行内 created 字符串） */
    created?: unknown;
    current?: number;
    pageSize?: number;
  };

/** dateTimeRange 表单值 → YYYY-MM-DD HH:mm:ss 起止 */
function parseDateTimeRangeToApiBounds(range: unknown): {
  start?: string;
  end?: string;
} {
  if (!Array.isArray(range) || range.length < 2) {
    return {};
  }
  const formatParam = (raw: unknown): string | undefined => {
    if (raw === undefined || raw === null || raw === '') return undefined;
    const d = dayjs(raw as string | number | Date);
    return d.isValid() ? d.format('YYYY-MM-DD HH:mm:ss') : undefined;
  };
  const start = formatParam(range[0]);
  const end = formatParam(range[1]);
  return { ...(start ? { start } : {}), ...(end ? { end } : {}) };
}

/**
 * 业务订单查询请求（仅入参 `BillOrderRevenueTableParams`，返回行数据为 BillOrderInfo）
 */
const fetchOrderRevenueTableRequest = async (
  params: BillOrderRevenueTableParams,
): Promise<{ data: BillOrderInfo[]; total: number; success: boolean }> => {
  try {
    const keyword =
      params.userId !== undefined && params.userId !== ''
        ? String(params.userId)
        : undefined;
    const createdRange = parseDateTimeRangeToApiBounds(params.created);
    const payload: BillOrderSearchParams = {
      keyword,
      bizType: params.bizType,
      orderStatus: params.orderStatus,
      payStatus: params.payStatus,
      ...(createdRange.start ? { startTime: createdRange.start } : {}),
      ...(createdRange.end ? { endTime: createdRange.end } : {}),
      pageNum: params.current,
      pageSize: params.pageSize,
    };
    const res = await apiGetOrderRevenueList(payload);
    if (res?.code === SUCCESS_CODE) {
      const list = res.data.records || [];
      return {
        data: list,
        total: res.data.total,
        success: true,
      };
    }
  } catch {}
  return {
    data: [],
    total: 0,
    success: false,
  };
};

/**
 * 业务订单查询
 */
const SubsOrders: React.FC = () => {
  const [orderItemsModal, setOrderItemsModal] = useState<{
    open: boolean;
    items: BillOrderItem[];
  }>({ open: false, items: [] });

  const openOrderItemsModal = useCallback((record: BillOrderInfo) => {
    setOrderItemsModal({
      open: true,
      items: record.items ?? [],
    });
  }, []);

  const closeOrderItemsModal = useCallback(() => {
    setOrderItemsModal((s) => ({ ...s, open: false }));
  }, []);

  // 统计信息
  const [statsInfo, setStatsInfo] = useState<BillRevenueStatsInfo>();

  // 收益统计（按月过滤，按用户排行）
  const { run: fetchStatsInfo, loading: statsLoading } = useRequest(
    apiGetOrderRevenueStats,
    {
      manual: true,
      onSuccess: (res: BillRevenueStatsInfo) => {
        setStatsInfo(res);
      },
    },
  );

  useEffect(() => {
    fetchStatsInfo();
  }, []);

  // 订单状态配置
  const statusConfig = useMemo(
    () => ({
      [BillOrderStatusEnum.PAID]: {
        color: 'success',
        label: dict('PC.Pages.SystemSubsOrders.orderStatusPaid'),
      },
      [BillOrderStatusEnum.PENDING]: {
        color: 'warning',
        label: dict('PC.Pages.SystemSubsOrders.orderStatusPending'),
      },
      [BillOrderStatusEnum.CANCELLED]: {
        color: 'default',
        label: dict('PC.Pages.SystemSubsOrders.orderStatusCancelled'),
      },
    }),
    [],
  );

  const bizTypeLabelMap = useMemo(
    (): Record<BillBizTypeEnum, string> => ({
      [BillBizTypeEnum.CREDIT_PURCHASE]: dict(
        'PC.Pages.MorePage.MyOrders.bizTypeCreditPurchase',
      ),
      [BillBizTypeEnum.SUBSCRIPTION]: dict(
        'PC.Pages.MorePage.MyOrders.bizTypeSubscription',
      ),
    }),
    [],
  );

  // 订单列表列配置
  const columns: ProColumns<BillOrderInfo>[] = useMemo(
    () => [
      {
        title: dict('PC.Pages.SystemSubsOrders.orderId'),
        dataIndex: 'id',
        key: 'id',
        ellipsis: true,
        search: false,
        width: 150,
        fixed: 'left',
        render: (_, record) => String(record.id ?? '-'),
      },
      {
        title: dict('PC.Pages.SystemSubsOrders.userId'),
        dataIndex: 'userId',
        key: 'userId',
        ellipsis: true,
        search: false,
        render: (_, record) => String(record.userId ?? '-'),
      },
      // 业务类型
      {
        title: dict('PC.Pages.SystemSubsOrders.bizType'),
        dataIndex: 'bizType',
        key: 'bizType',
        valueType: 'select',
        valueEnum: {
          [BillBizTypeEnum.CREDIT_PURCHASE]: {
            text: bizTypeLabelMap[BillBizTypeEnum.CREDIT_PURCHASE],
          },
          [BillBizTypeEnum.SUBSCRIPTION]: {
            text: bizTypeLabelMap[BillBizTypeEnum.SUBSCRIPTION],
          },
        },
        fieldProps: {
          allowClear: true,
          placeholder: dict('PC.Common.Global.pleaseSelect'),
        },
        render: (_, record) =>
          bizTypeLabelMap[record.bizType] ?? String(record.bizType),
      },
      // 描述
      {
        title: dict('PC.Pages.SystemSubsOrders.description'),
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
        search: false,
        render: (_, record) => record.description || '-',
      },
      // 金额
      {
        title: dict('PC.Pages.SystemSubsOrders.amount'),
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
      // 订单状态
      {
        title: dict('PC.Pages.SystemSubsOrders.orderStatus'),
        dataIndex: 'orderStatus',
        key: 'orderStatus',
        render: (_, record) => {
          const cfg = statusConfig[record.orderStatus];
          return <Tag color={cfg?.color}>{cfg?.label}</Tag>;
        },
        valueEnum: {
          [BillOrderStatusEnum.PAID]: {
            text: dict('PC.Pages.SystemSubsOrders.orderStatusPaid'),
          },
          [BillOrderStatusEnum.PENDING]: {
            text: dict('PC.Pages.SystemSubsOrders.orderStatusPending'),
          },
          [BillOrderStatusEnum.CANCELLED]: {
            text: dict('PC.Pages.SystemSubsOrders.orderStatusCancelled'),
          },
        },
      },
      // 支付状态
      {
        title: dict('PC.Pages.SystemSubsOrders.payStatus'),
        dataIndex: 'payStatus',
        key: 'payStatus',
        valueType: 'select',
        valueEnum: Object.fromEntries(
          Object.values(BillPayStatusEnum).map((status) => [
            status,
            { text: PAY_STATUS_LABELS[status] },
          ]),
        ) as Record<BillPayStatusEnum, { text: string }>,
        fieldProps: {
          allowClear: true,
          placeholder: dict('PC.Common.Global.pleaseSelect'),
        },
        render: (_, record) =>
          PAY_STATUS_LABELS[record.payStatus] ?? String(record.payStatus),
      },
      // 开始时间
      {
        title: dict('PC.Pages.SystemSubsOrders.created'),
        dataIndex: 'created',
        key: 'created',
        valueType: 'dateTimeRange',
        fieldProps: {
          placeholder: [
            dict('PC.Pages.SystemSubsOrders.createdTimeRangeStart'),
            dict('PC.Pages.SystemSubsOrders.createdTimeRangeEnd'),
          ],
        },
        width: 170,
        render: (_, record) => formatDateTimeYmdHms(record.created),
      },
      // 修改时间
      {
        title: dict('PC.Pages.SystemSubsOrders.modified'),
        dataIndex: 'modified',
        key: 'modified',
        search: false,
        width: 170,
        render: (_, record) => formatDateTimeYmdHms(record.modified),
      },
      {
        title: dict('PC.Pages.SystemSubsOrders.operationColumn'),
        key: 'operation',
        search: false,
        width: 100,
        fixed: 'right',
        align: 'left',
        render: (_, record) => (
          <Button
            type="link"
            style={{ padding: 0 }}
            onClick={() => openOrderItemsModal(record)}
          >
            {dict('PC.Pages.SystemSubsOrders.orderLineItems')}
          </Button>
        ),
      },
    ],
    [bizTypeLabelMap, openOrderItemsModal, statusConfig],
  );

  return (
    <WorkspaceLayout title={dict('PC.Routes.subsOrders')}>
      {/* 统计卡 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16, flexShrink: 0 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={dict('PC.Pages.SystemSubsOrders.totalRevenue')}
              value={statsLoading ? '-' : statsInfo?.totalRevenue || 0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={dict('PC.Pages.SystemSubsOrders.monthRevenue')}
              value={statsLoading ? '-' : statsInfo?.monthRevenue || 0}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={dict('PC.Pages.SystemSubsOrders.todayRevenue')}
              value={statsLoading ? '-' : statsInfo?.todayRevenue || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={dict('PC.Pages.SystemSubsOrders.pendingAmount')}
              value={statsLoading ? '-' : statsInfo?.pendingAmount || 0}
              precision={0}
              prefix={dict('PC.Common.Global.currencySymbol')}
            />
          </Card>
        </Col>
      </Row>

      {/* 订单列表：flex + min-height:0 + 高度的父边界，分页才能留在区内；滚动由表格 body（scroll.y）承担 */}
      <XProTable<BillOrderInfo, BillOrderRevenueTableParams>
        rowKey="id"
        columns={columns}
        request={fetchOrderRevenueTableRequest}
        scroll={{ x: 'max-content' }}
        scrollYOffset={80}
        showQueryButtons={false}
        search={{
          filterType: 'query',
          defaultCollapsed: false,
        }}
      />

      {/* 订单明显 */}
      <OrderLineItemsModal
        open={orderItemsModal.open}
        onCancel={closeOrderItemsModal}
        items={orderItemsModal.items}
      />
    </WorkspaceLayout>
  );
};

export default SubsOrders;
