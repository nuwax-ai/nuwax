import { TableActions, XProTable } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiGetSystemRevenueStats } from '@/services/subscriptionService';
import type { ProColumns } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import React, { useEffect, useRef } from 'react';
import { history } from 'umi';

export interface DailyRevenueItem {
  id: number | null;
  userId: number;
  nickName: string | null;
  userName: string | null;
  phone: string | null;
  email: string | null;
  dt: string; // YYYYMMDD
  amount: number;
  status: string;
}

const MOCK_DATA: DailyRevenueItem[] = [
  {
    id: null,
    userId: 1,
    nickName: '测试用户',
    userName: 'test_user',
    phone: '13800138000',
    email: 'test@example.com',
    dt: '20260516',
    amount: 125.5,
    status: 'PENDING',
  },
];

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
    actionRef.current?.reload();
  }, [month]);

  const columns: ProColumns<DailyRevenueItem>[] = [
    {
      title: dict('PC.Pages.SystemPaymentEarnings.colDeveloper'),
      dataIndex: 'userName',
      key: 'userName',
      search: false,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.userName || record.nickName || '未知'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
            {record.phone || record.email || '-'}
          </div>
        </div>
      ),
    },
    {
      title: '收益日期',
      dataIndex: 'dt',
      key: 'dt',
      search: false,
      render: (val) => {
        const dateStr = val as string;
        if (dateStr?.length === 8) {
          return `${dateStr.substring(0, 4)}-${dateStr.substring(
            4,
            6,
          )}-${dateStr.substring(6, 8)}`;
        }
        return val;
      },
    },
    {
      title: '收益金额',
      dataIndex: 'amount',
      key: 'amount',
      search: false,
      render: (val) => (
        <span style={{ fontWeight: 600, color: '#f5222d' }}>
          ¥{((val as number) ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      search: false,
      valueEnum: {
        PENDING: { text: '待结算', status: 'Default' },
        WITHDRAW_APPLYING: { text: '提现中', status: 'Processing' },
        PAYING: { text: '支付中', status: 'Warning' },
        SETTLED: { text: '已结算', status: 'Success' },
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
              label: dict('PC.Pages.SystemPaymentEarnings.viewDetail'),
              onClick: (r) =>
                history.push(
                  `/system/payment-earnings/earnings-detail?developerId=${
                    r.userId
                  }&developerName=${encodeURIComponent(
                    r.userName || r.nickName || '',
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
              total: res.data?.total || 0,
              success: true,
            };
          }
        } catch (e) {
          console.error('Fetch earnings error:', e);
        }
        return {
          data: MOCK_DATA,
          total: MOCK_DATA.length,
          success: true,
        };
      }}
    />
  );
};

export default EarningsTable;
