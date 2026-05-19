import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  BillBizTypeEnum,
  BillOrderInfo,
  BillOrderStatusEnum,
} from '@/types/interfaces/subscription';
import { formatDateTimeYmdHms } from '@/utils/dateUtils';
import type {
  ActionType,
  ParamsType,
  ProColumns,
} from '@ant-design/pro-components';
import { DatePicker, Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'umi';
import { apiGetOrderRevenueList } from '../services/order-revenue';
import { type BillOrderSearchParams } from '../types/order-revenue';

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
  const location = useLocation();
  const actionRef = useRef<ActionType>();

  useEffect(() => {
    actionRef.current?.reload();
  }, [location.state]);

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
        valueType: 'select',
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
        fieldProps: {
          allowClear: true,
          placeholder: dict('PC.Common.Global.pleaseSelect'),
        },
        render: (_, record) => {
          const cfg = statusConfig[record.orderStatus];
          return <Tag color={cfg?.color}>{cfg?.label}</Tag>;
        },
      },
      // 开始时间（LightFilter 默认 dateTimeRange 会先出一层再点开 RangePicker；自定义表单项一次即可展开面板）
      {
        title: dict('PC.Pages.SystemSubsOrders.created'),
        dataIndex: 'created',
        key: 'created',
        valueType: 'dateTimeRange',
        renderFormItem: () => (
          <DatePicker.RangePicker
            showTime
            allowClear
            style={{ width: '100%', minWidth: 360 }}
            placeholder={[
              dict('PC.Pages.SystemSubsOrders.createdTimeRangeStart'),
              dict('PC.Pages.SystemSubsOrders.createdTimeRangeEnd'),
            ]}
          />
        ),
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
    ],
    [bizTypeLabelMap, statusConfig],
  );

  return (
    <WorkspaceLayout title={dict('PC.Routes.subsOrders')}>
      <XProTable<BillOrderInfo, BillOrderRevenueTableParams>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={fetchOrderRevenueTableRequest}
        scroll={{ x: 'max-content' }}
      />
    </WorkspaceLayout>
  );
};

export default SubsOrders;
