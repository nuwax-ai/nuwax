import { dict } from '@/services/i18nRuntime';
import type {
  UserTokenRankDTO,
  UserTokenRankParams,
  UserTokenTrendParams,
} from '@/types/interfaces/systemManage';
import { positiveInt64Id } from '@/utils/int64Id';
import { Alert, Button, DatePicker, Table, Tag } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import styles from './index.less';
import { userTokenColumns } from './userTokenColumns';
import type { UsageUser } from './UserUsageSelect';
import { useUserTokenRank } from './useUserTokenStats';

interface RankingQuery extends UserTokenRankParams {
  dtStart: string;
  dtEnd: string;
}

const monthQuery = (): RankingQuery => ({
  dtStart: dayjs().startOf('month').format('YYYYMMDD'),
  dtEnd: dayjs().format('YYYYMMDD'),
  sortField: 'totalTokens',
  pageNum: 1,
  pageSize: 20,
});

export default function UserTokenRanking({
  onViewTrend,
}: {
  onViewTrend: (query: UserTokenTrendParams, user: UsageUser) => void;
}) {
  const [dates, setDates] = useState<[Dayjs, Dayjs]>(() => [
    dayjs().startOf('month'),
    dayjs(),
  ]);
  const [query, setQuery] = useState(monthQuery);
  const { data, loading, failed, retry } = useUserTokenRank(query);
  return (
    <>
      <div className={styles['filter-bar']}>
        <span className={styles['filter-label']}>
          {dict('PC.Pages.ModelMonitor.timeRange')}
        </span>
        <DatePicker.RangePicker
          value={dates}
          allowClear={false}
          format="YYYYMMDD"
          onChange={(value) => {
            if (value?.[0] && value[1])
              setDates([dayjs(value[0].valueOf()), dayjs(value[1].valueOf())]);
          }}
        />
        <div className="flex-1" />
        <Button
          onClick={() => {
            setDates([dayjs().startOf('month'), dayjs()]);
            setQuery(monthQuery());
          }}
        >
          {dict('PC.Common.Global.reset')}
        </Button>
        <Button
          type="primary"
          onClick={() =>
            setQuery({
              ...query,
              dtStart: dates[0].format('YYYYMMDD'),
              dtEnd: dates[1].format('YYYYMMDD'),
              pageNum: 1,
            })
          }
        >
          {dict('PC.Common.Global.query')}
        </Button>
      </div>
      <div className={styles['query-context']}>
        {dict(
          'PC.Pages.ModelMonitor.rankingContext',
          query.dtStart,
          query.dtEnd,
        )}
      </div>
      {failed ? (
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
        <div className={styles['rank-content']}>
          <Table<UserTokenRankDTO>
            size="small"
            rowKey={(row) => `${row.rank}-${row.userId}`}
            columns={[
              {
                title: dict('PC.Pages.ModelMonitor.rank'),
                dataIndex: 'rank',
                width: 80,
                fixed: 'left',
              },
              {
                title: dict('PC.Pages.ModelMonitor.user'),
                width: 240,
                fixed: 'left',
                render: (_, row) => (
                  <>
                    <div>
                      {row.nickName || row.userName || row.userId}{' '}
                      {row.status === -1 && (
                        <Tag>{dict('PC.Pages.ModelMonitor.inactiveUser')}</Tag>
                      )}
                    </div>
                    <div className={styles['user-id']}>
                      {dict('PC.Pages.ModelMonitor.userId')}: {row.userId}
                    </div>
                  </>
                ),
              },
              ...userTokenColumns<UserTokenRankDTO>(),
              {
                title: dict('PC.Pages.ModelMonitor.trendTitle'),
                key: 'trend',
                width: 120,
                fixed: 'right',
                render: (_, row) => {
                  const userId = positiveInt64Id(row.userId);
                  return (
                    <Button
                      type="link"
                      disabled={!userId}
                      onClick={() => {
                        if (userId)
                          onViewTrend(
                            {
                              userId,
                              dtStart: query.dtStart,
                              dtEnd: query.dtEnd,
                            },
                            {
                              value: userId,
                              label: row.nickName || row.userName || userId,
                            },
                          );
                      }}
                    >
                      {dict('PC.Pages.ModelMonitor.viewTrend')}
                    </Button>
                  );
                },
              },
            ]}
            dataSource={data?.records ?? []}
            loading={loading}
            locale={{ emptyText: dict('PC.Pages.ModelMonitor.noConsumption') }}
            scroll={{ x: 1370 }}
            pagination={{
              current: query.pageNum,
              pageSize: query.pageSize,
              total: data?.total ?? 0,
              showSizeChanger: true,
              pageSizeOptions: [20, 50, 100],
              onChange: (pageNum, pageSize) =>
                setQuery({
                  ...query,
                  pageNum: pageSize === query.pageSize ? pageNum : 1,
                  pageSize,
                }),
            }}
          />
        </div>
      )}
    </>
  );
}
