import StatMetricCardList from '@/components/business-component/StatMetricCard';
import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetMyResourceStatDetail,
  apiGetMyResourceStatSummary,
} from '@/services/systemManage';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type {
  ResourceStatDTO,
  ResourceStatSummaryDTO,
} from '@/types/interfaces/systemManage';
import { formatDecimal, formatInteger, sumNumbers } from '@/utils/numberFormat';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, DatePicker, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'umi';
import styles from './index.less';
import {
  ResourceStatTargetTypeTag,
  USAGE_STAT_TOKEN_EMPTY,
  renderUsageStatTokenCell,
} from './ResourceStatTargetTypeTag';
import {
  getUsageRecordInputTokens,
  getUsageRecordTotalInputTokens,
  getUsageSummaryInputTokens,
  getUsageSummaryTotalInputTokens,
} from './resourceStatTokenMetrics';

const { RangePicker } = DatePicker;

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
        value: sumNumbers(
          c?.modelCallCount,
          c?.agentCallCount,
          c?.toolCallCount,
        ),
      },
      {
        label: dict('PC.Pages.UsageStats.failedCallCount'),
        value: sumNumbers(
          c?.failedModelCallCount,
          c?.failedAgentCallCount,
          c?.failedToolCallCount,
        ),
      },
      {
        label: dict('PC.Pages.UsageStats.totalInputTokens'),
        value: formatInteger(getUsageSummaryTotalInputTokens(c)),
      },
      {
        label: dict('PC.Pages.UsageStats.cacheInputTokens'),
        value: formatInteger(c?.totalCacheInputTokens),
      },
      {
        label: dict('PC.Pages.UsageStats.inputTokens'),
        value: formatInteger(getUsageSummaryInputTokens(c)),
      },
      {
        label: dict('PC.Pages.UsageStats.outputTokens'),
        value: formatInteger(c?.totalOutputTokens),
      },
      {
        label: dict('PC.Pages.UsageStats.creditAmount'),
        value: formatDecimal(c?.totalCreditAmount),
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
      dataIndex: 'targetType',
      width: 100,
      hideInSearch: true,
      render: (_, record) => (
        <ResourceStatTargetTypeTag targetType={record.targetType} />
      ),
    },
    {
      title: dict('PC.Pages.UsageStats.colCallCount'),
      dataIndex: 'callCount',
      width: 100,
      hideInSearch: true,
      render: (_, record) => formatInteger(record.callCount),
    },
    {
      title: dict('PC.Pages.UsageStats.colCallFailedCount'),
      dataIndex: 'callFailedCount',
      width: 100,
      hideInSearch: true,
      render: (_, record) => formatInteger(record.callFailedCount),
    },
    {
      title: dict('PC.Pages.UsageStats.colTotalInputTokens'),
      dataIndex: 'inputTokens',
      width: 130,
      hideInSearch: true,
      render: (_, record) =>
        renderUsageStatTokenCell(record, () =>
          formatInteger(getUsageRecordTotalInputTokens(record)),
        ),
    },
    {
      title: dict('PC.Pages.UsageStats.colCacheInputTokens'),
      dataIndex: 'cacheInputTokens',
      width: 140,
      hideInSearch: true,
      render: (_, record) =>
        renderUsageStatTokenCell(record, () =>
          formatInteger(record.cacheInputTokens),
        ),
    },
    {
      title: dict('PC.Pages.UsageStats.colInputTokens'),
      width: 120,
      hideInSearch: true,
      render: (_, record) =>
        renderUsageStatTokenCell(record, () =>
          formatInteger(getUsageRecordInputTokens(record)),
        ),
    },
    {
      title: dict('PC.Pages.UsageStats.colOutputTokens'),
      dataIndex: 'outputTokens',
      width: 120,
      hideInSearch: true,
      render: (_, record) =>
        renderUsageStatTokenCell(record, () =>
          formatInteger(record.outputTokens),
        ),
    },
    {
      title: dict('PC.Pages.UsageStats.colCreditAmount'),
      dataIndex: 'creditAmount',
      width: 120,
      hideInSearch: true,
      render: (_, record) =>
        record.targetType === AgentComponentTypeEnum.Agent
          ? USAGE_STAT_TOKEN_EMPTY
          : formatDecimal(record.creditAmount),
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
          <div style={{ flex: 1 }} />
          <Button onClick={handleReset}>
            {dict('PC.Pages.UsageStats.reset')}
          </Button>
          <Button type="primary" onClick={handleSearch}>
            {dict('PC.Pages.UsageStats.search')}
          </Button>
        </div>

        {/* 统计卡片 */}
        <StatMetricCardList items={overviewMetrics} loading={summaryLoading} />

        {/* 明细表格 */}
        <div className={styles['detail-section']}>
          <XProTable<ResourceStatDTO>
            actionRef={actionRef}
            rowKey="id"
            columns={columns}
            request={request}
            search={false}
            onReset={handleReset}
            fullHeight={true}
            showQueryButtons={false}
            scrollYOffset={30}
          />
        </div>
      </div>
    </WorkspaceLayout>
  );
};

export default UsageStats;
