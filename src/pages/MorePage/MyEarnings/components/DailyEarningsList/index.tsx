import { XProTable } from '@/components/ProComponents';
import { dict } from '@/services/i18nRuntime';
import { apiListDailyRevenue } from '@/services/subscriptionService';
import {
  DailyRevenueStatusEnum,
  type DailyRevenueRecord,
} from '@/types/interfaces/subscription';
import type {
  ActionType,
  FormInstance,
  ProColumns,
} from '@ant-design/pro-components';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import DailyEarningsDetailModal from './components/DailyEarningsDetailModal';
import styles from './index.less';

const cx = classNames.bind(styles);

const DailyEarningsList: React.FC = () => {
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDt, setSelectedDt] = useState<string>();
  const formRef = useRef<FormInstance>();
  const actionRef = useRef<ActionType>();

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

  // 解析日期字符串 20260507 -> { day: '07', month: '4月', full: '2026-05-07' }
  const parseDate = (dtStr: string) => {
    const d = dayjs(dtStr, 'YYYYMMDD');
    if (!d.isValid()) return { day: '--', month: '--', full: '--' };
    return {
      day: d.format('DD'),
      month: d.format(dict('PC.Pages.MorePage.MyEarnings.monthFormat')),
      full: d.format('YYYY-MM-DD'),
    };
  };

  const columns: ProColumns<DailyRevenueRecord>[] = [
    {
      title: dict('PC.Pages.MorePage.MyEarnings.date'),
      dataIndex: 'dt',
      key: 'dt',
      valueType: 'date',
      render: (_, record) => parseDate(record.dt).full,
    },
    {
      title: dict('PC.Pages.MorePage.MyEarnings.colSettlementStatus'),
      dataIndex: 'status',
      key: 'status',
      search: false,
      render: (_, record) => {
        const statusInfo = statusMap[record.status] || {
          label: record.status,
          className: '',
        };

        return (
          <span className={cx(styles['status-tag'], statusInfo.className)}>
            {statusInfo.label}
          </span>
        );
      },
    },
    {
      title: dict('PC.Pages.MorePage.MyEarnings.colEarnings'),
      dataIndex: 'amount',
      key: 'amount',
      search: false,
      render: (_, record) => (
        <span className={cx(styles.amount)}>+¥{record.amount.toFixed(2)}</span>
      ),
    },
    {
      title: dict('PC.Common.Global.operation'),
      valueType: 'option',
      width: 100,
      render: (_, record) => (
        <a
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDt(record.dt);
            setDetailModalVisible(true);
          }}
        >
          {dict('PC.Pages.MorePage.MyEarnings.Detail.modalTitle')}
        </a>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <XProTable<DailyRevenueRecord>
        rowKey="id"
        actionRef={actionRef}
        formRef={formRef}
        columns={columns}
        request={async (params) => {
          const { dt } = params;
          const formattedDt = dt ? dayjs(dt).format('YYYYMMDD') : undefined;
          const res = await apiListDailyRevenue({ dt: formattedDt });
          if (res.success) {
            return {
              data: Array.isArray(res.data) ? res.data : [],
              success: true,
            };
          }
          return { data: [], success: false };
        }}
        search={{
          filterType: 'light',
        }}
        toolBarRender={false}
        // pagination={false}
        onRow={(record) => ({
          onClick: () => {
            setSelectedDt(record.dt);
            setDetailModalVisible(true);
          },
          style: { cursor: 'pointer' },
        })}
      />

      <DailyEarningsDetailModal
        visible={detailModalVisible}
        dt={selectedDt}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedDt(undefined);
        }}
      />
    </div>
  );
};

export default DailyEarningsList;
