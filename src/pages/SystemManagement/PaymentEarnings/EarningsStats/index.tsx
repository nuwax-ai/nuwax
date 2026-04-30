import { TableActions, XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetDevEarningsSummary,
  apiListDevEarnings,
} from '@/services/subscriptionService';
import { formatDateTime } from '@/utils/dateUtils';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { Card, Col, Row, Select, Statistic, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';

interface DevEarningSummary {
  id: number;
  developerName: string;
  totalEarnings: number;
  withdrawn: number;
  available: number;
  lastEarningsAt: string;
}

const MOCK_STATS = {
  totalEarnings: 86400,
  totalEarningsTrend: 12.5,
  monthlyEarnings: 12800,
  monthlyEarningsTrend: -3.2,
  developerCount: 47,
  developerCountTrend: 8.3,
  avgEarnings: 1838,
  avgEarningsTrend: 5.1,
};

const MOCK_DEV_EARNINGS: DevEarningSummary[] = [
  {
    id: 1,
    developerName: 'Alice Wang',
    totalEarnings: 15800,
    withdrawn: 12000,
    available: 3800,
    lastEarningsAt: '2026-04-28T10:30:00Z',
  },
  {
    id: 2,
    developerName: 'Bob Li',
    totalEarnings: 9200,
    withdrawn: 6000,
    available: 3200,
    lastEarningsAt: '2026-04-27T14:20:00Z',
  },
  {
    id: 3,
    developerName: 'Carlos Dev',
    totalEarnings: 23500,
    withdrawn: 20000,
    available: 3500,
    lastEarningsAt: '2026-04-26T09:00:00Z',
  },
  {
    id: 4,
    developerName: 'Diana Chen',
    totalEarnings: 5600,
    withdrawn: 3000,
    available: 2600,
    lastEarningsAt: '2026-04-25T16:00:00Z',
  },
];

const TrendTag: React.FC<{ value: number }> = ({ value }) => {
  if (!value) return null;
  const isUp = value > 0;
  return (
    <Tag color={isUp ? 'green' : 'red'} style={{ marginLeft: 8, fontSize: 12 }}>
      {isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
      {Math.abs(value)}%
    </Tag>
  );
};

const EarningsStats: React.FC = () => {
  const [summary, setSummary] = useState(MOCK_STATS);
  const [month, setMonth] = useState<string>('2026-04');

  const { run: fetchSummary } = useRequest(apiGetDevEarningsSummary, {
    manual: true,
    onSuccess: (res) => setSummary(res?.data ?? MOCK_STATS),
  });

  useEffect(() => {
    fetchSummary();
  }, [month]);

  const columns: ProColumns<DevEarningSummary>[] = [
    {
      title: dict('PC.Pages.SystemPaymentEarnings.colDeveloper'),
      dataIndex: 'developerName',
      key: 'developerName',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.SystemPaymentEarnings.colTotalEarnings'),
      dataIndex: 'totalEarnings',
      key: 'totalEarnings',
      search: false,
      render: (_, record) => (
        <span style={{ fontWeight: 600 }}>
          ¥{(record.totalEarnings ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: dict('PC.Pages.SystemPaymentEarnings.colWithdrawn'),
      dataIndex: 'withdrawn',
      key: 'withdrawn',
      search: false,
      render: (val) => `¥${((val as number) ?? 0).toLocaleString()}`,
    },
    {
      title: dict('PC.Pages.SystemPaymentEarnings.colAvailable'),
      dataIndex: 'available',
      key: 'available',
      search: false,
      render: (val) => (
        <span style={{ color: '#52c41a', fontWeight: 600 }}>
          ¥{((val as number) ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: dict('PC.Pages.SystemPaymentEarnings.colLastEarningsAt'),
      dataIndex: 'lastEarningsAt',
      key: 'lastEarningsAt',
      search: false,
      render: (val) => (val ? formatDateTime(val) : '-'),
    },
    {
      title: dict('PC.Common.Global.action'),
      key: 'action',
      search: false,
      width: 120,
      render: (_, record) => (
        <TableActions
          record={record}
          actions={[
            {
              key: 'detail',
              label: dict('PC.Pages.SystemPaymentEarnings.viewDetail'),
              onClick: () => {},
            },
          ]}
        />
      ),
    },
  ];

  return (
    <WorkspaceLayout
      title={dict('PC.Routes.devEarningsStats')}
      rightSlot={
        <Select
          value={month}
          onChange={setMonth}
          style={{ width: 140 }}
          options={[
            { value: '2026-04', label: '2026 年 4 月' },
            { value: '2026-03', label: '2026 年 3 月' },
            { value: '2026-02', label: '2026 年 2 月' },
            { value: '2026-01', label: '2026 年 1 月' },
          ]}
        />
      }
    >
      {/* 统计卡 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={dict('PC.Pages.SystemPaymentEarnings.totalEarnings')}
              value={summary.totalEarnings}
              prefix="¥"
            />
            <TrendTag value={summary.totalEarningsTrend} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={dict('PC.Pages.SystemPaymentEarnings.monthlyEarnings')}
              value={summary.monthlyEarnings}
              prefix="¥"
            />
            <TrendTag value={summary.monthlyEarningsTrend} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={dict('PC.Pages.SystemPaymentEarnings.developerCount')}
              value={summary.developerCount}
            />
            <TrendTag value={summary.developerCountTrend} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={dict('PC.Pages.SystemPaymentEarnings.avgEarnings')}
              value={summary.avgEarnings}
              prefix="¥"
            />
            <TrendTag value={summary.avgEarningsTrend} />
          </Card>
        </Col>
      </Row>

      <XProTable<DevEarningSummary>
        rowKey="id"
        columns={columns}
        request={async (params) => {
          try {
            const res = await apiListDevEarnings({
              keyword: params.developerName,
              month,
              pageNum: params.current,
              pageSize: params.pageSize,
            } as any);
            if (res?.code === SUCCESS_CODE && res.data?.list?.length) {
              return {
                data: res.data.list as DevEarningSummary[],
                total: res.data.total,
                success: true,
              };
            }
          } catch {}
          return {
            data: MOCK_DEV_EARNINGS,
            total: MOCK_DEV_EARNINGS.length,
            success: true,
          };
        }}
      />
    </WorkspaceLayout>
  );
};

export default EarningsStats;
