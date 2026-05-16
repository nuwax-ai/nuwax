import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetMyResourceStatDetail,
  apiGetMyResourceStatSummary,
} from '@/services/systemManage';
import type {
  ResourceStatDTO,
  ResourceStatSummaryDTO,
} from '@/types/interfaces/systemManage';
import { SearchOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, DatePicker, Skeleton, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'umi';
import styles from './index.less';

const { RangePicker } = DatePicker;

const formatNumber = (num: number | undefined): string => {
  if (num === null || num === undefined) return '0';
  if (num >= 100000000) return `${(num / 100000000).toFixed(1)}亿`;
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  return num.toLocaleString();
};

const SummaryCard: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
  loading?: boolean;
}> = ({ label, value, highlight, loading }) => {
  if (loading) {
    return (
      <div className={styles['stat-item-card']}>
        <Skeleton
          active
          paragraph={{ rows: 1, width: '50%' }}
          title={{ width: '70%' }}
        />
      </div>
    );
  }
  return (
    <div className={styles['stat-item-card']}>
      <span className={styles['stat-label']}>{label}</span>
      <span
        className={`${styles['stat-value']} ${
          highlight ? styles['highlight'] : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
};

const UsageStats: React.FC = () => {
  const location = useLocation();
  const actionRef = useRef<ActionType>();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('day'),
    dayjs().endOf('day'),
  ]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<ResourceStatSummaryDTO | null>(
    null,
  );

  const fetchSummary = useCallback(
    async (start?: string, end?: string) => {
      setSummaryLoading(true);
      try {
        const res = await apiGetMyResourceStatSummary({
          dtStart: start || dateRange[0].format('YYYYMMDD'),
          dtEnd: end || dateRange[1].format('YYYYMMDD'),
        });
        if (res.code === SUCCESS_CODE && res.data) {
          setSummaryData(res.data);
        }
      } catch {
        // ignore
      } finally {
        setSummaryLoading(false);
      }
    },
    [dateRange],
  );

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    const state = location.state as any;
    if (state?._t) {
      fetchSummary();
      actionRef.current?.reload();
    }
  }, [location.state, fetchSummary]);

  const handleSearch = useCallback(() => {
    const start = dateRange[0].format('YYYYMMDD');
    const end = dateRange[1].format('YYYYMMDD');
    fetchSummary(start, end);
    actionRef.current?.reload();
  }, [dateRange, fetchSummary]);

  const handleReset = useCallback(() => {
    const today = dayjs().startOf('day');
    const todayEnd = dayjs().endOf('day');
    setDateRange([today, todayEnd]);
    fetchSummary(today.format('YYYYMMDD'), todayEnd.format('YYYYMMDD'));
    actionRef.current?.reset?.();
    actionRef.current?.reload();
  }, [fetchSummary]);

  const request = async (params: any) => {
    const { current, pageSize } = params;
    const res = await apiGetMyResourceStatDetail({
      dtStart: dateRange[0].format('YYYYMMDD'),
      dtEnd: dateRange[1].format('YYYYMMDD'),
      pageNum: current,
      pageSize,
    });

    if (res.code !== SUCCESS_CODE) {
      message.error(res.message || dict('PC.Pages.UsageStats.fetchDataFailed'));
      return { data: [], total: 0, success: false };
    }

    const data = res.data;
    return {
      data: data?.records || [],
      total: data?.total || 0,
      success: true,
    };
  };

  const overviewMetrics = React.useMemo(() => {
    const c = summaryData?.consumption;
    return [
      {
        label: dict('PC.Pages.UsageStats.callCount'),
        value: formatNumber(
          (c?.modelCallCount ?? 0) +
            (c?.agentCallCount ?? 0) +
            (c?.toolCallCount ?? 0),
        ),
      },
      {
        label: dict('PC.Pages.UsageStats.totalInputTokens'),
        value: formatNumber(
          (c?.totalInputTokens ?? 0) + (c?.totalCacheInputTokens ?? 0),
        ),
      },
      {
        label: dict('PC.Pages.UsageStats.cacheInputTokens'),
        value: formatNumber(c?.totalCacheInputTokens),
      },
      {
        label: dict('PC.Pages.UsageStats.inputTokens'),
        value: formatNumber(c?.inputTokens ?? 0),
      },
      {
        label: dict('PC.Pages.UsageStats.outputTokens'),
        value: formatNumber(c?.totalOutputTokens),
      },
      {
        label: dict('PC.Pages.UsageStats.creditAmount'),
        value: formatNumber(c?.totalCreditAmount),
        highlight: true,
      },
    ];
  }, [summaryData]);

  const columns: ProColumns<ResourceStatDTO>[] = [
    {
      title: dict('PC.Pages.UsageStats.colModelName'),
      dataIndex: 'targetName',
      width: 160,
      fixed: 'left',
      hideInSearch: true,
    },
    {
      title: dict('PC.Pages.UsageStats.colType'),
      dataIndex: 'type',
      width: 100,
      hideInSearch: true,
    },
    {
      title: dict('PC.Pages.UsageStats.colCallCount'),
      dataIndex: 'callCount',
      width: 100,
      hideInSearch: true,
      render: (_, record) => formatNumber(record.callCount),
    },
    {
      title: dict('PC.Pages.UsageStats.colTotalInputTokens'),
      dataIndex: 'inputTokens',
      width: 130,
      hideInSearch: true,
      render: (_, record) => formatNumber(record.inputTokens),
    },
    {
      title: dict('PC.Pages.UsageStats.colCacheInputTokens'),
      dataIndex: 'cacheInputTokens',
      width: 140,
      hideInSearch: true,
      render: (_, record) => formatNumber(record.cacheInputTokens),
    },
    {
      title: dict('PC.Pages.UsageStats.colInputTokens'),
      width: 120,
      hideInSearch: true,
      render: (_, record) =>
        formatNumber(
          (record.inputTokens ?? 0) - (record.cacheInputTokens ?? 0),
        ),
    },
    {
      title: dict('PC.Pages.UsageStats.colOutputTokens'),
      dataIndex: 'outputTokens',
      width: 120,
      hideInSearch: true,
      render: (_, record) => formatNumber(record.outputTokens),
    },
    {
      title: dict('PC.Pages.UsageStats.colCreditAmount'),
      dataIndex: 'creditAmount',
      width: 120,
      hideInSearch: true,
      render: (_, record) => formatNumber(record.creditAmount),
    },
    {
      title: dict('PC.Pages.UsageStats.colDt'),
      dataIndex: 'dt',
      width: 120,
      hideInSearch: true,
    },
  ];

  return (
    <WorkspaceLayout title={dict('PC.Pages.UsageStats.pageTitle')} hideScroll>
      <div className={styles['usage-stats-container']}>
        {/* 筛选栏 */}
        <div className={styles['filter-bar']}>
          <span className={styles['filter-label']}>
            {dict('PC.Pages.UsageStats.timeRange')}
          </span>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0], dates[1]]);
              }
            }}
            format="YYYYMMDD"
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
          >
            {dict('PC.Pages.UsageStats.search')}
          </Button>
          <Button onClick={handleReset}>
            {dict('PC.Pages.UsageStats.reset')}
          </Button>
          <div style={{ flex: 1 }} />
        </div>

        {/* 综合统计卡片 */}
        <div className={styles['summary-section']}>
          <div className={styles['section-title']}>
            {dict('PC.Pages.UsageStats.summaryTitle')}
          </div>
          <div className={styles['stat-cards-row']}>
            {overviewMetrics.map((metric, index) => (
              <SummaryCard
                key={index}
                label={metric.label}
                value={metric.value}
                highlight={metric.highlight}
                loading={summaryLoading}
              />
            ))}
          </div>
        </div>

        {/* 明细表格 */}
        <div className={styles['detail-section']}>
          <XProTable<ResourceStatDTO>
            actionRef={actionRef}
            rowKey="id"
            columns={columns}
            request={request}
            onReset={handleReset}
            fullHeight={true}
            showQueryButtons={false}
          />
        </div>
      </div>
    </WorkspaceLayout>
  );
};

export default UsageStats;
