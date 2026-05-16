import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetResourceStatDetail,
  apiGetResourceStatSummary,
} from '@/services/systemManage';
import type {
  ResourceStatDTO,
  ResourceStatSummaryDTO,
  StatGroup,
} from '@/types/interfaces/systemManage';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, DatePicker, Skeleton, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'umi';
import styles from './index.less';

const { RangePicker } = DatePicker;

const formatNumber = (num: number | undefined): string => {
  if (num === null || num === undefined) return '0';
  if (num >= 100000000) return `${(num / 100000000).toFixed(1)}亿`;
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  return num.toLocaleString();
};

const formatAmount = (num: number | undefined): string => {
  if (num === null || num === undefined) return '¥0.00';
  return `¥${num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

const ModelMonitor: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
        const res = await apiGetResourceStatSummary({
          userId: -1,
          type: 'SALES',
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

  const handleRefresh = useCallback(() => {
    fetchSummary();
    actionRef.current?.reload();
  }, [fetchSummary]);

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
    const res = await apiGetResourceStatDetail({
      userId: -1,
      type: 'SALES',
      dtStart: dateRange[0].format('YYYYMMDD'),
      dtEnd: dateRange[1].format('YYYYMMDD'),
      pageNum: current,
      pageSize,
    });

    if (res.code !== SUCCESS_CODE) {
      message.error(
        res.message || dict('PC.Pages.GlobalModelManage.fetchDataFailed'),
      );
      return { data: [], total: 0, success: false };
    }

    const data = res.data;
    return {
      data: data?.records || [],
      total: data?.total || 0,
      success: true,
    };
  };

  const getSummaryMetrics = useCallback((group: StatGroup | undefined) => {
    const g =
      group ||
      ({
        modelCallCount: 0,
        failedModelCallCount: 0,
        totalInputTokens: 0,
        totalCacheInputTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalAmount: 0,
      } as StatGroup);
    return [
      {
        label: dict('PC.Pages.ModelMonitor.modelCallCount'),
        value: formatNumber(g.modelCallCount),
      },
      {
        label: dict('PC.Pages.ModelMonitor.failedModelCallCount'),
        value: formatNumber(g.failedModelCallCount),
      },
      {
        label: dict('PC.Pages.ModelMonitor.totalInputTokens'),
        value: formatNumber(g.totalInputTokens),
      },
      {
        label: dict('PC.Pages.ModelMonitor.cacheInputTokens'),
        value: formatNumber(g.totalCacheInputTokens),
      },
      {
        label: dict('PC.Pages.ModelMonitor.inputTokens'),
        value: formatNumber(g.inputTokens ?? 0),
      },
      {
        label: dict('PC.Pages.ModelMonitor.outputTokens'),
        value: formatNumber(g.totalOutputTokens),
      },
      {
        label: dict('PC.Pages.ModelMonitor.totalAmount'),
        value: formatAmount(g.totalAmount),
        highlight: true,
      },
    ];
  }, []);

  const mergedGroup: StatGroup | undefined = React.useMemo(() => {
    const c = summaryData?.consumption;
    const s = summaryData?.sales;
    if (!c && !s) return undefined;
    const keys: (keyof StatGroup)[] = [
      'totalInputTokens',
      'totalOutputTokens',
      'totalCacheInputTokens',
      'toolCount',
      'toolCallCount',
      'agentCount',
      'agentCallCount',
      'modelCallCount',
      'failedModelCallCount',
      'failedToolCallCount',
      'failedAgentCallCount',
      'totalCreditAmount',
      'totalAmount',
    ];
    const result = {} as StatGroup;
    for (const k of keys) {
      result[k] = (c?.[k] ?? 0) + (s?.[k] ?? 0);
    }
    return result;
  }, [summaryData]);

  const overviewMetrics = getSummaryMetrics(mergedGroup);

  const columns: ProColumns<ResourceStatDTO>[] = [
    {
      title: dict('PC.Pages.ModelMonitor.colModelName'),
      dataIndex: 'targetName',
      width: 160,
      fixed: 'left',
      hideInSearch: true,
    },
    {
      title: dict('PC.Pages.ModelMonitor.colCallCount'),
      dataIndex: 'callCount',
      width: 100,
      hideInSearch: true,
      render: (_, record) => formatNumber(record.callCount),
    },
    {
      title: dict('PC.Pages.ModelMonitor.colCallFailedCount'),
      dataIndex: 'callFailedCount',
      width: 100,
      hideInSearch: true,
      render: (_, record) => formatNumber(record.callFailedCount),
    },
    {
      title: dict('PC.Pages.ModelMonitor.colTotalInputTokens'),
      dataIndex: 'inputTokens',
      width: 130,
      hideInSearch: true,
      render: (_, record) => formatNumber(record.inputTokens),
    },
    {
      title: dict('PC.Pages.ModelMonitor.colCacheInputTokens'),
      dataIndex: 'cacheInputTokens',
      width: 140,
      hideInSearch: true,
      render: (_, record) => formatNumber(record.cacheInputTokens),
    },
    {
      title: dict('PC.Pages.ModelMonitor.colInputTokens'),
      width: 120,
      hideInSearch: true,
      render: (_, record) =>
        formatNumber(
          (record.inputTokens ?? 0) - (record.cacheInputTokens ?? 0),
        ),
    },
    {
      title: dict('PC.Pages.ModelMonitor.colOutputTokens'),
      dataIndex: 'outputTokens',
      width: 120,
      hideInSearch: true,
      render: (_, record) => formatNumber(record.outputTokens),
    },
    {
      title: dict('PC.Pages.ModelMonitor.colFeeAmount'),
      dataIndex: 'feeAmount',
      width: 130,
      hideInSearch: true,
      render: (_, record) => formatAmount(record.feeAmount),
    },
    {
      title: dict('PC.Pages.ModelMonitor.colDt'),
      dataIndex: 'dt',
      width: 120,
      hideInSearch: true,
    },
    {
      title: dict('PC.Pages.ModelMonitor.colLog'),
      valueType: 'option',
      width: 80,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <a
          onClick={() => {
            navigate(
              `/system/log-query/running-log?targetId=${record.targetId}&targetType=${record.targetType}`,
            );
          }}
        >
          {dict('PC.Pages.ModelMonitor.viewLog')}
        </a>
      ),
    },
  ];

  return (
    <WorkspaceLayout title={dict('PC.Pages.ModelMonitor.pageTitle')} hideScroll>
      <div className={styles['model-monitor-container']}>
        {/* 筛选栏 */}
        <div className={styles['filter-bar']}>
          <span className={styles['filter-label']}>
            {dict('PC.Pages.ModelMonitor.timeRange')}
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
            {dict('PC.Pages.ModelMonitor.search')}
          </Button>
          <Button onClick={handleReset}>
            {dict('PC.Pages.ModelMonitor.reset')}
          </Button>
          <div style={{ flex: 1 }} />
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            {dict('PC.Pages.ModelMonitor.refreshData')}
          </Button>
        </div>

        {/* 统计卡片 */}
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

export default ModelMonitor;
