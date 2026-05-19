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
import {
  formatCurrency,
  formatInteger,
  subtractNumbers,
  sumBigNumbersToNumber,
} from '@/utils/numberFormat';
import {
  getStatGroupInputTokens,
  getStatGroupTotalInputTokens,
} from '@/utils/resourceStatMetrics';
import { SearchOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, DatePicker, Skeleton, Tooltip, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'umi';
import styles from './index.less';

const { RangePicker } = DatePicker;

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
      <Tooltip title={value}>
        <span className={styles['stat-value-trigger']}>
          <span
            className={`${styles['stat-value']} ${
              highlight ? styles['highlight'] : ''
            }`}
          >
            {value}
          </span>
        </span>
      </Tooltip>
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
          // type: 'SALES',
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
        totalAmount: 0,
        totalOutputTokens: 0,
        toolCount: 0,
        toolCallCount: 0,
        agentCount: 0,
        agentCallCount: 0,
        totalCreditAmount: 0,
        failedToolCallCount: 0,
        failedAgentCallCount: 0,
      } as StatGroup);
    return [
      {
        label: dict('PC.Pages.ModelMonitor.modelCallCount'),
        value: formatInteger(g.modelCallCount),
      },
      {
        label: dict('PC.Pages.ModelMonitor.failedModelCallCount'),
        value: formatInteger(g.failedModelCallCount),
      },
      {
        label: dict('PC.Pages.ModelMonitor.totalInputTokens'),
        value: formatInteger(
          getStatGroupTotalInputTokens(g, 'totalIsInputOnly'),
        ),
      },
      {
        label: dict('PC.Pages.ModelMonitor.cacheInputTokens'),
        value: formatInteger(g.totalCacheInputTokens),
      },
      {
        label: dict('PC.Pages.ModelMonitor.inputTokens'),
        value: formatInteger(getStatGroupInputTokens(g, 'totalIsInputOnly')),
      },
      {
        label: dict('PC.Pages.ModelMonitor.outputTokens'),
        value: formatInteger(g.totalOutputTokens),
      },
      {
        label: dict('PC.Pages.ModelMonitor.totalAmount'),
        value: formatCurrency(g.totalAmount),
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
      'inputTokens',
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
      result[k] = sumBigNumbersToNumber(c?.[k], s?.[k]);
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
      render: (_, record) => formatInteger(record.callCount),
    },
    {
      title: dict('PC.Pages.ModelMonitor.colCallFailedCount'),
      dataIndex: 'callFailedCount',
      width: 100,
      hideInSearch: true,
      render: (_, record) => formatInteger(record.callFailedCount),
    },
    {
      title: dict('PC.Pages.ModelMonitor.colTotalInputTokens'),
      dataIndex: 'inputTokens',
      width: 130,
      hideInSearch: true,
      render: (_, record) => formatInteger(record.inputTokens),
    },
    {
      title: dict('PC.Pages.ModelMonitor.colCacheInputTokens'),
      dataIndex: 'cacheInputTokens',
      width: 140,
      hideInSearch: true,
      render: (_, record) => formatInteger(record.cacheInputTokens),
    },
    {
      title: dict('PC.Pages.ModelMonitor.colInputTokens'),
      width: 120,
      hideInSearch: true,
      render: (_, record) =>
        subtractNumbers(record.inputTokens, record.cacheInputTokens),
    },
    {
      title: dict('PC.Pages.ModelMonitor.colOutputTokens'),
      dataIndex: 'outputTokens',
      width: 120,
      hideInSearch: true,
      render: (_, record) => formatInteger(record.outputTokens),
    },
    {
      title: dict('PC.Pages.ModelMonitor.colFeeAmount'),
      dataIndex: 'feeAmount',
      width: 130,
      hideInSearch: true,
      render: (_, record) => formatCurrency(record.feeAmount),
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
          <div className="flex-1" />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
          >
            {dict('PC.Pages.ModelMonitor.search')}
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

export default ModelMonitor;
