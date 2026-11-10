import { dict } from '@/services/i18nRuntime';
import type {
  UserTokenTrendDTO,
  UserTokenTrendParams,
} from '@/types/interfaces/systemManage';
import { formatInteger } from '@/utils/numberFormat';
import { Line } from '@ant-design/plots';
import { useSize } from 'ahooks';
import { Alert, Button, Empty, Segmented, Skeleton, Table } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useRef, useState } from 'react';
import styles from './index.less';
import { userTokenColumns } from './userTokenColumns';
import { useUserTokenTrend } from './useUserTokenStats';

const metrics = [
  ['totalTokens', 'totalTokens'],
  ['inputTokens', 'nonCacheInputTokens'],
  ['cacheInputTokens', 'cacheInputTokens'],
  ['outputTokens', 'outputTokens'],
] as const;

export default function UserTokenTrend({
  query,
}: {
  query: UserTokenTrendParams;
}) {
  // 模型明细翻页不应重拉趋势；请求只接收用户和已提交的日期范围。
  const params = useMemo(
    () => ({
      userId: query.userId,
      dtStart: query.dtStart,
      dtEnd: query.dtEnd,
    }),
    [query],
  );
  const { data, loading, failed, retry } = useUserTokenTrend(params);
  const [metric, setMetric] =
    useState<(typeof metrics)[number][0]>('totalTokens');
  const container = useRef<HTMLDivElement>(null);
  const size = useSize(container);
  const label = dict(
    `PC.Pages.ModelMonitor.${metrics.find(([key]) => key === metric)![1]}`,
  );
  // 未返回的日期不补零，避免将数据缺失误记为零消耗。
  const points = useMemo(
    () =>
      (data ?? []).map((row) => ({
        date: dayjs(row.dt).format('YYYY-MM-DD'),
        value: Number(row[metric]),
        exact: row[metric],
      })),
    [data, metric],
  );

  return (
    <div className={styles['trend-content']} ref={container}>
      {failed ? (
        <Alert
          type="error"
          showIcon
          message={dict('PC.Pages.ModelMonitor.trendFailed')}
          action={
            <Button onClick={retry}>
              {dict('PC.Pages.ModelMonitor.retry')}
            </Button>
          }
        />
      ) : loading ? (
        <Skeleton active />
      ) : !data?.length ? (
        <Empty description={dict('PC.Pages.ModelMonitor.noConsumption')} />
      ) : (
        <>
          <Segmented
            value={metric}
            options={metrics.map(([value, key]) => ({
              value,
              label: dict(`PC.Pages.ModelMonitor.${key}`),
            }))}
            onChange={(value) => setMetric(value as typeof metric)}
          />
          <div
            role="img"
            aria-label={dict(
              'PC.Pages.ModelMonitor.trendChartLabel',
              query.userId,
              label,
            )}
          >
            <Line
              data={points}
              xField="date"
              yField="value"
              height={260}
              width={size?.width}
              autoFit={false}
              scale={{ y: { domainMin: 0 } }}
              point={{}}
              animate={false}
              tooltip={(point: { exact: number | string }) => ({
                name: label,
                value: formatInteger(point.exact),
              })}
            />
          </div>
          <Table<UserTokenTrendDTO>
            size="small"
            rowKey="dt"
            dataSource={data}
            columns={[
              {
                title: dict('PC.Pages.ModelMonitor.colDt'),
                dataIndex: 'dt',
                width: 130,
                fixed: 'left',
                render: (dt: string) => dayjs(dt).format('YYYY-MM-DD'),
              },
              ...userTokenColumns<UserTokenTrendDTO>(),
            ]}
            scroll={{ x: 1060 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              hideOnSinglePage: true,
            }}
          />
        </>
      )}
    </div>
  );
}
