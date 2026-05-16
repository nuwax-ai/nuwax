import { TableActions, XProTable } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetSystemRevenueStats,
  type DailyRevenueItem,
} from '@/services/subscriptionService';
import type { ProColumns } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import React, { useEffect, useRef } from 'react';
import { history } from 'umi';

interface EarningsTableProps {
  month: string;
  onStatsChange?: (data: any) => void;
}

const EarningsTable: React.FC<EarningsTableProps> = ({
  month,
  onStatsChange,
}) => {
  const actionRef = useRef<any>();
  const isFirstRender = useRef(true);

  // 仅在月份变化（且非首次渲染）时刷新表格
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // 月份切换时，先清空父组件数据，以触发统计卡片和图表的 loading 状态
    onStatsChange?.(null);
    actionRef.current?.reload();
  }, [month]);

  const columns: ProColumns<DailyRevenueItem>[] = [
    {
      title: dict('PC.Pages.SystemPaymentEarnings.colDeveloper'),
      dataIndex: 'userName',
      key: 'userName',
      search: false,
      render: (_, record) => (
        <span style={{ fontWeight: 500 }}>
          {record.nickName || record.userName || '-'}
        </span>
      ),
    },
    {
      title: dict('PC.Pages.SystemPaymentEarnings.colTotalEarnings'),
      dataIndex: 'amount',
      key: 'amount',
      search: false,
      render: (_, record) => (
        <span style={{ fontWeight: 600, color: '#52c41a' }}>
          ¥
          {(record.amount ?? 0).toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      title: dict('PC.Pages.SystemPaymentEarnings.colLastEarningsAt'),
      dataIndex: 'dt',
      key: 'dt',
      search: false,
    },
    {
      title: dict('PC.Common.Global.action'),
      key: 'action',
      search: false,
      width: 200,
      align: 'center',
      render: (_, record) => (
        <TableActions
          record={record}
          actions={[
            {
              key: 'detail',
              label: dict('PC.Pages.SystemPaymentEarnings.viewDetail'),
              onClick: (r) =>
                history.push(
                  `/system/payment-earnings/earnings-detail?developerId=${
                    r.userId
                  }&developerName=${encodeURIComponent(
                    r.nickName || r.userName || '',
                  )}`,
                ),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <XProTable<DailyRevenueItem>
      actionRef={actionRef}
      rowKey={(record) => `${record.userId}-${record.dt}`}
      columns={columns}
      showQueryButtons={false}
      fullHeight={false}
      request={async (params) => {
        try {
          const date = dayjs(month);
          const monthStart = date.startOf('month').format('YYYYMMDD');
          const monthEnd = date.endOf('month').format('YYYYMMDD');

          const res = await apiGetSystemRevenueStats({
            monthStart,
            monthEnd,
            pageNum: params.current,
            pageSize: params.pageSize,
          });

          if (res?.code === SUCCESS_CODE) {
            onStatsChange?.(res.data);
            return {
              data: res.data?.dailyRevenues || [],
              total: res.data?.total ?? 0,
              success: true,
            };
          }
        } catch (e) {
          console.error('Fetch earnings error:', e);
        }
        return { data: [], total: 0, success: false };
      }}
    />
  );
};

export default EarningsTable;
