import StatMetricCardList from '@/components/business-component/StatMetricCard';
import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import type {
  ResourceStatDTO,
  StatGroup,
} from '@/types/interfaces/systemManage';
import {
  formatCurrency,
  formatInteger,
  sumBigNumbersToNumber,
} from '@/utils/numberFormat';
import type { ProColumns } from '@ant-design/pro-components';
import { Alert, Button, DatePicker, Empty, Segmented } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'umi';
import styles from './index.less';
import {
  getModelMonitorRecordInputTokens,
  getModelMonitorRecordTotalInputTokens,
  getModelMonitorSummaryInputTokens,
  getModelMonitorSummaryTotalInputTokens,
  getModelMonitorSummaryTotalTokens,
} from './resourceStatTokenMetrics';
import useModelMonitorStats, {
  type ModelMonitorQuery,
} from './useModelMonitorStats';
import UserTokenRanking from './UserTokenRanking';
import UserTokenTrend from './UserTokenTrend';
import UserUsageSelect, { type UsageUser } from './UserUsageSelect';

const { RangePicker } = DatePicker;

const ModelMonitor: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [scope, setScope] = useState<ModelMonitorQuery['scope'] | 'rank'>(
    'platform',
  );
  const [userTab, setUserTab] = useState('detail');
  const [selectedUser, setSelectedUser] = useState<UsageUser>();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('day'),
    dayjs().endOf('day'),
  ]);
  const [query, setQuery] = useState<ModelMonitorQuery | null>(() => ({
    scope: 'platform',
    userId: '-1',
    dtStart: dayjs().format('YYYYMMDD'),
    dtEnd: dayjs().format('YYYYMMDD'),
  }));
  const [page, setPage] = useState({ current: 1, pageSize: 15 });
  const { data, loading, failed } = useModelMonitorStats(
    scope === 'user' && userTab === 'trend' ? null : query,
    page.current,
    page.pageSize,
  );
  const isUserScope = scope === 'user';
  const handleUserChange = useCallback((user?: UsageUser) => {
    setSelectedUser(user);
    setQuery(null);
    setPage((previous) => ({ ...previous, current: 1 }));
  }, []);

  const handleSearch = () => {
    const userId = isUserScope ? selectedUser?.value : '-1';
    if (!userId) return;
    setPage((previous) => ({ ...previous, current: 1 }));
    setQuery({
      scope: isUserScope ? 'user' : 'platform',
      userId,
      dtStart: dateRange[0].format('YYYYMMDD'),
      dtEnd: dateRange[1].format('YYYYMMDD'),
    });
  };

  const handleReset = () => {
    const today = dayjs();
    setScope('platform');
    setUserTab('detail');
    setSelectedUser(undefined);
    setDateRange([today.startOf('day'), today.endOf('day')]);
    setPage((previous) => ({ ...previous, current: 1 }));
    setQuery({
      scope: 'platform',
      userId: '-1',
      dtStart: today.format('YYYYMMDD'),
      dtEnd: today.format('YYYYMMDD'),
    });
  };

  const retry = () => setQuery((current) => (current ? { ...current } : null));
  useEffect(() => {
    if ((location.state as { _t?: unknown } | null)?._t) retry();
  }, [location.state]);

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
        value: formatInteger(getModelMonitorSummaryTotalInputTokens(g)),
      },
      {
        label: dict('PC.Pages.ModelMonitor.cacheInputTokens'),
        value: formatInteger(g.totalCacheInputTokens),
      },
      {
        label: dict('PC.Pages.ModelMonitor.inputTokens'),
        value: formatInteger(getModelMonitorSummaryInputTokens(g)),
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
    const c = data?.summary.consumption;
    const s = data?.summary.sales;
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
  }, [data?.summary]);

  const currentGroup = isUserScope ? data?.summary.consumption : mergedGroup;
  const overviewMetrics = getSummaryMetrics(currentGroup);
  if (isUserScope)
    overviewMetrics.unshift({
      label: dict('PC.Pages.ModelMonitor.totalTokens'),
      value: formatInteger(getModelMonitorSummaryTotalTokens(currentGroup)),
    });

  const columns: ProColumns<ResourceStatDTO>[] = [
    ...(isUserScope
      ? [
          {
            title: dict('PC.Pages.ModelMonitor.user'),
            dataIndex: 'userName',
            width: 180,
            render: (_: unknown, record: ResourceStatDTO) =>
              record.nickName || record.userName || query?.userId || '-',
          },
        ]
      : []),
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
      render: (_, record) =>
        formatInteger(getModelMonitorRecordTotalInputTokens(record)),
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
        formatInteger(getModelMonitorRecordInputTokens(record)),
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
    <WorkspaceLayout
      title={dict(
        scope === 'rank'
          ? 'PC.Pages.ModelMonitor.rankingTitle'
          : isUserScope
          ? 'PC.Pages.ModelMonitor.userStatsTitle'
          : 'PC.Pages.ModelMonitor.pageTitle',
      )}
      hideScroll
    >
      <div className={styles['model-monitor-container']}>
        <Segmented
          className={styles['scope-switch']}
          options={[
            {
              label: dict('PC.Pages.ModelMonitor.platformScope'),
              value: 'platform',
            },
            {
              label: dict('PC.Pages.ModelMonitor.userStatsTitle'),
              value: 'user',
            },
            {
              label: dict('PC.Pages.ModelMonitor.rankingTitle'),
              value: 'rank',
            },
          ]}
          value={scope}
          onChange={(value) => {
            const next = value as typeof scope;
            setScope(next);
            setUserTab('detail');
            setPage((previous) => ({ ...previous, current: 1 }));
            setQuery(
              next === 'platform'
                ? {
                    scope: next,
                    userId: '-1',
                    dtStart: dateRange[0].format('YYYYMMDD'),
                    dtEnd: dateRange[1].format('YYYYMMDD'),
                  }
                : null,
            );
          }}
        />
        {scope === 'rank' ? (
          <UserTokenRanking
            onViewTrend={(next, user) => {
              setScope('user');
              setUserTab('trend');
              setSelectedUser(user);
              setDateRange([dayjs(next.dtStart), dayjs(next.dtEnd)]);
              setPage((previous) => ({ ...previous, current: 1 }));
              setQuery({ scope: 'user', ...next });
            }}
          />
        ) : (
          <>
            <div className={styles['filter-bar']}>
              {isUserScope && (
                <UserUsageSelect
                  value={selectedUser}
                  onChange={handleUserChange}
                />
              )}
              <span className={styles['filter-label']}>
                {dict('PC.Pages.ModelMonitor.timeRange')}
              </span>
              <RangePicker
                value={dateRange}
                allowClear={false}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([
                      dayjs(dates[0].valueOf()),
                      dayjs(dates[1].valueOf()),
                    ]);
                  }
                }}
                format="YYYYMMDD"
              />
              <div className="flex-1" />
              <Button onClick={handleReset}>
                {dict('PC.Common.Global.reset')}
              </Button>
              <Button
                type="primary"
                disabled={isUserScope && !selectedUser}
                onClick={handleSearch}
              >
                {dict('PC.Common.Global.query')}
              </Button>
            </div>

            {isUserScope && query && (
              <div className={styles['query-context']}>
                {dict(
                  'PC.Pages.ModelMonitor.activeUserQuery',
                  `${selectedUser?.label || query.userId} (ID: ${
                    query.userId
                  })`,
                  query.dtStart,
                  query.dtEnd,
                )}
              </div>
            )}
            {isUserScope && query && (
              <Segmented
                className={styles['scope-switch']}
                value={userTab}
                onChange={(value) => setUserTab(String(value))}
                options={[
                  {
                    value: 'detail',
                    label: dict('PC.Pages.ModelMonitor.modelDetailTitle'),
                  },
                  {
                    value: 'trend',
                    label: dict('PC.Pages.ModelMonitor.trendTitle'),
                  },
                ]}
              />
            )}
            {isUserScope && query && userTab === 'trend' ? (
              <UserTokenTrend query={query} />
            ) : !query ? (
              <Empty
                description={dict('PC.Pages.ModelMonitor.selectUserHint')}
              />
            ) : failed ? (
              <Alert
                type="error"
                showIcon
                message={dict('PC.Pages.ModelMonitor.queryFailed')}
                action={
                  <Button onClick={retry}>
                    {dict('PC.Pages.ModelMonitor.retry')}
                  </Button>
                }
              />
            ) : (
              <>
                <StatMetricCardList
                  items={overviewMetrics}
                  loading={loading}
                  className={isUserScope ? styles['user-metrics'] : undefined}
                />
                <div className={styles['detail-section']}>
                  <XProTable<ResourceStatDTO>
                    rowKey="id"
                    columns={columns}
                    dataSource={data?.records ?? []}
                    loading={loading}
                    pagination={{
                      current: page.current,
                      pageSize: page.pageSize,
                      total: data?.total ?? 0,
                      onChange: (current, pageSize) =>
                        setPage({
                          current: pageSize === page.pageSize ? current : 1,
                          pageSize,
                        }),
                    }}
                    locale={{
                      emptyText: dict('PC.Pages.ModelMonitor.noConsumption'),
                    }}
                    search={false}
                    fullHeight={true}
                    showQueryButtons={false}
                    scrollYOffset={30}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </WorkspaceLayout>
  );
};

export default ModelMonitor;
