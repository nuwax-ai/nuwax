import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import {
  apiCreateWithdrawApply,
  apiGetRevenueStats,
} from '@/services/subscriptionService';
import type { EarningRecordInfo } from '@/types/interfaces/subscription';
import { SettlementStatusEnum } from '@/types/interfaces/subscription';
import { formatDateTime } from '@/utils/dateUtils';
import { CalendarOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  Button,
  DatePicker,
  message,
  Modal,
  Segmented,
  Select,
  Statistic,
  Tag,
} from 'antd';
import classNames from 'classnames';
import type { Dayjs } from 'dayjs';
import React, { useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// Mock 收益明细
const MOCK_EARNINGS: (EarningRecordInfo & {
  source: string;
  type: string;
  platformFee?: number;
})[] = [
  {
    id: 1,
    agentName: '智能文档摘要',
    userName: '',
    planName: '',
    cycle: 'monthly' as any,
    earnings: 19.9,
    settlementStatus: SettlementStatusEnum.Settled,
    createdAt: '2026-04-26 08:30:00',
    source: '智能文档摘要 · 订阅收入',
    type: '订阅收入',
  },
  {
    id: 2,
    agentName: '工具调用',
    userName: '',
    planName: '',
    cycle: 'monthly' as any,
    earnings: 126.5,
    settlementStatus: SettlementStatusEnum.Pending,
    createdAt: '2026-04-25 23:50:00',
    source: '工具调用 · Token消耗分成',
    type: '工具调用',
    platformFee: 12.65,
  },
  {
    id: 3,
    agentName: '合同审查助手',
    userName: '',
    planName: '',
    cycle: 'monthly' as any,
    earnings: 39.9,
    settlementStatus: SettlementStatusEnum.Settled,
    createdAt: '2026-04-24 14:20:00',
    source: '合同审查助手 · 订阅收入',
    type: '订阅收入',
  },
  {
    id: 4,
    agentName: 'Web搜索工具',
    userName: '',
    planName: '',
    cycle: 'monthly' as any,
    earnings: 45.0,
    settlementStatus: SettlementStatusEnum.Settled,
    createdAt: '2026-04-23 16:45:00',
    source: 'Web搜索工具 · 工具调用分成',
    type: '工具调用',
    platformFee: 4.5,
  },
  {
    id: 5,
    agentName: '数据可视化',
    userName: '',
    planName: '',
    cycle: 'monthly' as any,
    earnings: 29.9,
    settlementStatus: SettlementStatusEnum.Settled,
    createdAt: '2026-04-22 10:00:00',
    source: '数据可视化 · 订阅收入',
    type: '订阅收入',
  },
  {
    id: 6,
    agentName: 'AI绘画助手',
    userName: '',
    planName: '',
    cycle: 'monthly' as any,
    earnings: 29.9,
    settlementStatus: SettlementStatusEnum.Settled,
    createdAt: '2026-04-21 09:15:00',
    source: 'AI绘画助手 · 订阅收入',
    type: '订阅收入',
  },
  {
    id: 7,
    agentName: '代码分析',
    userName: '',
    planName: '',
    cycle: 'monthly' as any,
    earnings: 89.2,
    settlementStatus: SettlementStatusEnum.Pending,
    createdAt: '2026-04-20 20:30:00',
    source: '代码分析 · 工具调用分成',
    type: '工具调用',
    platformFee: 8.92,
  },
];

const MyEarnings: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<string>('全部');
  const [statusFilter, setStatusFilter] = useState<string>('全部');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  // 获取收益统计数据
  const {
    data: revenueData,
    loading: statsLoading,
    refresh: refreshStats,
  } = useRequest(apiGetRevenueStats);

  // 提现申请
  const { loading: withdrawLoading, run: runWithdraw } = useRequest(
    apiCreateWithdrawApply,
    {
      manual: true,
      onSuccess: (res) => {
        Modal.success({
          title: dict('PC.Pages.MorePage.MyEarnings.withdrawSuccessTitle'),
          content: (
            <div>
              <div>{dict('PC.Pages.MorePage.MyEarnings.withdrawSuccess')}</div>
              <Statistic
                title={dict('PC.Pages.MorePage.MyEarnings.withdrawableBalance')}
                value={res?.data?.amount || 0}
                precision={2}
                prefix="¥"
                valueStyle={{ fontSize: 18, fontWeight: 600 }}
              />
            </div>
          ),
          okText: dict('PC.Common.ok'),
        });
        refreshStats();
      },
      onError: (err) => {
        message.error(err.message || '提现申请失败');
      },
    },
  );

  const stats = useMemo(() => {
    const data = revenueData?.data;
    const total = data?.totalRevenue || 0;
    const pending = data?.pendingAmount || 0;
    const withdrawn = data?.settledAmount || 0;

    return [
      {
        label: dict('PC.Pages.MorePage.MyEarnings.totalIncome'),
        value: total,
        hint: dict('PC.Pages.MorePage.MyEarnings.totalIncomeDesc'),
        color: 'var(--xagi-blue)',
      },
      {
        label: dict('PC.Pages.MorePage.MyEarnings.pendingSettlement'),
        value: pending,
        hint: dict('PC.Pages.MorePage.MyEarnings.pendingDesc'),
        color: 'var(--xagi-orange)',
      },
      {
        label: dict('PC.Pages.MorePage.MyEarnings.withdrawn'),
        value: withdrawn,
        hint: dict('PC.Pages.MorePage.MyEarnings.withdrawnDesc'),
        color: 'var(--xagi-color-text)',
      },
    ];
  }, [revenueData]);

  const settlementConfig = useMemo(
    () => ({
      [SettlementStatusEnum.Pending]: {
        color: 'processing',
        label: dict('PC.Pages.MorePage.MyEarnings.settlementPending'),
      },
      [SettlementStatusEnum.Settled]: {
        color: 'success',
        label: dict('PC.Pages.MorePage.MyEarnings.settlementSettled'),
      },
    }),
    [],
  );

  const typeConfig: Record<string, string> = {
    订阅收入: dict('PC.Pages.MorePage.MyEarnings.typeSubscription'),
    工具调用: dict('PC.Pages.MorePage.MyEarnings.typeToolCall'),
    推荐奖励: dict('PC.Pages.MorePage.MyEarnings.typeReferral'),
    活动奖励: dict('PC.Pages.MorePage.MyEarnings.typeActivity'),
    平台服务: dict('PC.Pages.MorePage.MyEarnings.typePlatform'),
  };

  const handleReset = () => {
    setTypeFilter('全部');
    setStatusFilter('全部');
    setStartDate(null);
    setEndDate(null);
  };

  const columns: ProColumns<(typeof MOCK_EARNINGS)[0]>[] = [
    {
      title: dict('PC.Pages.MorePage.MyEarnings.colCreatedAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      search: false,
      width: 160,
      render: (val) => formatDateTime(val as string),
    },
    {
      title: dict('PC.Pages.MorePage.MyEarnings.colSource'),
      dataIndex: 'source',
      key: 'source',
      search: false,
      render: (_, record) => (
        <div className={cx(styles['table-source'])}>
          <span className={cx(styles['source-main'])}>{record.source}</span>
        </div>
      ),
    },
    {
      title: dict('PC.Pages.MorePage.MyEarnings.colType'),
      dataIndex: 'type',
      key: 'type',
      search: false,
      width: 100,
      render: (_, record) => typeConfig[record.type] || record.type,
    },
    {
      title: dict('PC.Pages.MorePage.MyEarnings.colEarnings'),
      dataIndex: 'earnings',
      key: 'earnings',
      search: false,
      width: 120,
      render: (_, record) => (
        <span style={{ color: '#52c41a', fontWeight: 600 }}>
          +¥{record.earnings.toFixed(2)}
        </span>
      ),
    },
    {
      title: dict('PC.Pages.MorePage.MyEarnings.colPlatformFee'),
      dataIndex: 'platformFee',
      key: 'platformFee',
      search: false,
      width: 100,
      render: (_, record) =>
        record.platformFee ? (
          <span className={cx(styles['platform-fee'])}>
            ¥{record.platformFee}
          </span>
        ) : (
          <span style={{ color: '#ccc' }}>—</span>
        ),
    },
    {
      title: dict('PC.Pages.MorePage.MyEarnings.colSettlementStatus'),
      dataIndex: 'settlementStatus',
      key: 'settlementStatus',
      search: false,
      width: 100,
      render: (_, record) => {
        const config = settlementConfig[record.settlementStatus];
        return <Tag color={config?.color}>{config?.label}</Tag>;
      },
    },
  ];

  return (
    <WorkspaceLayout title={dict('PC.Pages.MorePage.MyEarnings.pageTitle')}>
      <div className={cx(styles['my-earnings'])}>
        {/* 统计卡片 */}
        <div className={cx(styles['stats-container'])}>
          {stats.map((item, index, arr) => (
            <React.Fragment key={item.label}>
              <div className={cx(styles['stat-card'])}>
                <Statistic
                  title={item.label}
                  value={item.value}
                  precision={2}
                  prefix="¥"
                  loading={statsLoading}
                  valueStyle={{
                    color: item.color,
                    fontSize: '24px',
                    fontWeight: '600',
                  }}
                />
                {item.hint && (
                  <div className={cx(styles['stat-hint'])}>{item.hint}</div>
                )}
              </div>
              {index < arr.length - 1 && <div className={cx(styles.divider)} />}
            </React.Fragment>
          ))}
        </div>

        {/* 提现操作区 */}
        <div className={cx(styles['withdraw-container'])}>
          <div className={cx(styles['balance-info'])}>
            <Statistic
              title={dict('PC.Pages.MorePage.MyEarnings.withdrawableBalance')}
              value={revenueData?.data?.pendingAmount || 0}
              precision={2}
              prefix="¥"
              loading={statsLoading}
            />
          </div>
          <div className={cx(styles['action-buttons'])}>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              className={cx(styles['withdraw-apply-btn'])}
              disabled={(revenueData?.data?.pendingAmount || 0) <= 0}
              loading={withdrawLoading}
              onClick={runWithdraw}
            >
              {dict('PC.Pages.MorePage.MyEarnings.withdrawApply')}
            </Button>
            <Button
              icon={<CalendarOutlined />}
              className={cx(styles['withdraw-record-btn'])}
            >
              {dict('PC.Pages.MorePage.MyEarnings.withdrawRecord')}
            </Button>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className={cx(styles['filter-bar'])}>
          <Segmented
            value={typeFilter}
            onChange={(val) => setTypeFilter(val as string)}
            options={[
              dict('PC.Pages.MorePage.MyEarnings.filterAll'),
              dict('PC.Pages.MorePage.MyEarnings.filterSubscription'),
              dict('PC.Pages.MorePage.MyEarnings.filterToolCall'),
            ]}
          />
          <div className={cx(styles['filter-group'])}>
            <span className={cx(styles['filter-label'])}>
              {dict('PC.Pages.MorePage.MyEarnings.startDate')}
            </span>
            <DatePicker
              value={startDate}
              onChange={(val) => setStartDate(val)}
              size="small"
              style={{ width: 130 }}
            />
          </div>
          <div className={cx(styles['filter-group'])}>
            <span className={cx(styles['filter-label'])}>
              {dict('PC.Pages.MorePage.MyEarnings.endDate')}
            </span>
            <DatePicker
              value={endDate}
              onChange={(val) => setEndDate(val)}
              size="small"
              style={{ width: 130 }}
            />
          </div>
          <div className={cx(styles['filter-group'])}>
            <span className={cx(styles['filter-label'])}>
              {dict('PC.Pages.MorePage.MyEarnings.filterStatus')}
            </span>
            <Select
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              size="small"
              style={{ width: 100 }}
              options={[
                {
                  value: '全部',
                  label: dict('PC.Pages.MorePage.MyEarnings.filterAll'),
                },
                {
                  value: '已结算',
                  label: dict('PC.Pages.MorePage.MyEarnings.settlementSettled'),
                },
                {
                  value: '待结算',
                  label: dict('PC.Pages.MorePage.MyEarnings.settlementPending'),
                },
                {
                  value: '已取消',
                  label: dict('PC.Pages.MorePage.MyEarnings.statusCancelled'),
                },
              ]}
            />
          </div>
          <div className={cx(styles['filter-actions'])}>
            <Button size="small" onClick={handleReset}>
              {dict('PC.Pages.MorePage.MyEarnings.filterReset')}
            </Button>
            <Button type="primary" size="small">
              {dict('PC.Pages.MorePage.MyEarnings.filterSubmit')}
            </Button>
          </div>
        </div>

        {/* 收益明细表格 */}
        <XProTable<(typeof MOCK_EARNINGS)[0]>
          rowKey="id"
          columns={columns}
          search={false}
          toolBarRender={false}
          dataSource={MOCK_EARNINGS}
          pagination={{ pageSize: 10 }}
        />
      </div>
    </WorkspaceLayout>
  );
};

export default MyEarnings;
