import { dict } from '@/services/i18nRuntime';
import { apiListDailyRevenue } from '@/services/subscriptionService';
import { DailyRevenueStatusEnum } from '@/types/interfaces/subscription';
import { RightOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Empty, Spin } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import DailyEarningsFilter from '../DailyEarningsFilter';
import styles from './index.less';

const cx = classNames.bind(styles);

const DailyEarningsList: React.FC = () => {
  const [filterValues, setFilterValues] = useState<{
    date?: string;
  }>({});

  const { data: revenueData, loading } = useRequest(
    () =>
      apiListDailyRevenue({
        dt: filterValues.date
          ? dayjs(filterValues.date).format('YYYYMMDD')
          : undefined,
      }),
    {
      refreshDeps: [filterValues],
    },
  );

  const statusMap: Record<
    DailyRevenueStatusEnum,
    { label: string; className: string }
  > = {
    [DailyRevenueStatusEnum.Pending]: {
      label: dict('PC.Pages.MorePage.MyEarnings.settlementPending'),
      className: styles['status-pending'],
    },
    [DailyRevenueStatusEnum.WithdrawApplying]: {
      label: dict('PC.Pages.MorePage.MyEarnings.settlementWithdrawing'),
      className: styles['status-applying'],
    },
    [DailyRevenueStatusEnum.Paying]: {
      label: dict('PC.Pages.MorePage.MyEarnings.settlementPaying'),
      className: styles['status-paying'],
    },
    [DailyRevenueStatusEnum.Settled]: {
      label: dict('PC.Pages.MorePage.MyEarnings.settlementSettled'),
      className: styles['status-settled'],
    },
  };

  const listData = useMemo(() => revenueData?.data || [], [revenueData]);

  // 解析日期字符串 20260507 -> { day: '07', month: '4月' }
  const parseDate = (dtStr: string) => {
    const d = dayjs(dtStr, 'YYYYMMDD');
    if (!d.isValid()) return { day: '--', month: '--' };
    return {
      day: d.format('DD'),
      month: d.format(dict('PC.Pages.MorePage.MyEarnings.monthFormat')),
      full: d.format('YYYY-MM-DD'),
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 独立封装的筛选组件 */}
      <DailyEarningsFilter
        onSearch={(values) => setFilterValues({ date: values.date })}
        onReset={() => setFilterValues({})}
      />

      <Spin spinning={loading}>
        <div className={cx(styles['earnings-items'])}>
          {listData.length > 0
            ? listData.map((item) => {
                const dateInfo = parseDate(item.dt);
                const statusInfo = statusMap[item.status] || {
                  label: item.status,
                  className: '',
                };

                return (
                  <div
                    key={item.id}
                    className={cx(styles['earning-item'])}
                    onClick={() => {
                      // 暂时不做处理，后续弹出模态框
                    }}
                  >
                    <div className={cx(styles['date-badge'])}>
                      <span className={cx(styles.day)}>{dateInfo.day}</span>
                      <span className={cx(styles.month)}>{dateInfo.month}</span>
                    </div>
                    <div className={cx(styles.info)}>
                      <span className={cx(styles['date-str'])}>
                        {dateInfo.full}
                      </span>
                      <span
                        className={cx(
                          styles['status-tag'],
                          statusInfo.className,
                        )}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className={cx(styles['amount-section'])}>
                      <span className={cx(styles.amount)}>
                        +¥{item.amount.toFixed(2)}
                      </span>
                      <RightOutlined className={cx(styles.arrow)} />
                    </div>
                  </div>
                );
              })
            : !loading && (
                <div className={cx(styles['empty-state'])}>
                  <Empty />
                </div>
              )}
        </div>
      </Spin>
    </div>
  );
};

export default DailyEarningsList;
