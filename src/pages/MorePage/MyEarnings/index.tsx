import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import type { EarningRecordInfo } from '@/types/interfaces/subscription';
import { SettlementStatusEnum } from '@/types/interfaces/subscription';
import { formatDateTime } from '@/utils/dateUtils';
import type { ProColumns } from '@ant-design/pro-components';
import {
  Button,
  DatePicker,
  Drawer,
  Input,
  Segmented,
  Select,
  Tag,
  message,
} from 'antd';
import type { Dayjs } from 'dayjs';
import React, { useMemo, useState } from 'react';
import styles from './index.less';

// Mock 收益汇总
const MOCK_SUMMARY = {
  totalEarnings: 1174.95,
  pendingSettlement: 443.03,
  settled: 731.92,
  withdrawn: 1350.0,
  withdrawableBalance: 0.0,
};

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

// Mock 提现记录
const MOCK_WITHDRAW_RECORDS = [
  {
    id: 1,
    amount: 500,
    time: '2026-04-20 10:00',
    status: '已到账',
    account: '支付宝 ***8888',
  },
  {
    id: 2,
    amount: 350,
    time: '2026-04-10 14:30',
    status: '已到账',
    account: '银行卡 ***6666',
  },
  {
    id: 3,
    amount: 500,
    time: '2026-03-28 09:00',
    status: '已到账',
    account: '支付宝 ***8888',
  },
];

const MyEarnings: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<string>('全部');
  const [statusFilter, setStatusFilter] = useState<string>('全部');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [withdrawApplyOpen, setWithdrawApplyOpen] = useState(false);
  const [withdrawRecordOpen, setWithdrawRecordOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

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

  const handleWithdrawSubmit = () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
    message.success(
      dict('PC.Pages.MorePage.MyEarnings.withdrawSuccess') || '提现申请已提交',
    );
    setWithdrawApplyOpen(false);
    setWithdrawAmount('');
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
        <div className={styles.tableSource}>
          <span className={styles.sourceMain}>{record.source}</span>
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
          <span className={styles.platformFee}>¥{record.platformFee}</span>
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
      {/* 统计卡片 */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            {dict('PC.Pages.MorePage.MyEarnings.totalIncome')}
          </div>
          <div className={styles.statValue}>
            ¥{MOCK_SUMMARY.totalEarnings.toFixed(2)}
          </div>
          <div className={styles.statHint}>
            {dict('PC.Pages.MorePage.MyEarnings.totalIncomeDesc')}
          </div>
        </div>
        <div className={styles.statCard} style={{ background: '#fff7e6' }}>
          <div className={styles.statLabel}>
            {dict('PC.Pages.MorePage.MyEarnings.pendingSettlement')}
          </div>
          <div className={styles.statValue}>
            ¥{MOCK_SUMMARY.pendingSettlement.toFixed(2)}
          </div>
          <div className={styles.statHint}>
            {dict('PC.Pages.MorePage.MyEarnings.pendingDesc')}
          </div>
        </div>
        <div className={styles.statCard} style={{ background: '#f6ffed' }}>
          <div className={styles.statLabel}>
            {dict('PC.Pages.MorePage.MyEarnings.settled')}
          </div>
          <div className={styles.statValue}>
            ¥{MOCK_SUMMARY.settled.toFixed(2)}
          </div>
          <div className={styles.statHint}>
            {dict('PC.Pages.MorePage.MyEarnings.settledDesc')}
          </div>
        </div>
        <div className={styles.statCard} style={{ background: '#f0f5ff' }}>
          <div className={styles.statLabel}>
            {dict('PC.Pages.MorePage.MyEarnings.withdrawn')}
          </div>
          <div className={styles.statValue}>
            ¥{MOCK_SUMMARY.withdrawn.toFixed(2)}
          </div>
          <div className={styles.statHint}>
            {dict('PC.Pages.MorePage.MyEarnings.withdrawnDesc')}
          </div>
        </div>
        <div className={styles.statCard} style={{ background: '#fff0f6' }}>
          <div className={styles.statLabel}>
            {dict('PC.Pages.MorePage.MyEarnings.withdrawableBalance')}
          </div>
          <div className={styles.statValue}>
            ¥{MOCK_SUMMARY.withdrawableBalance.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 提现按钮 */}
      <div className={styles.withdrawButtons}>
        <Button type="primary" onClick={() => setWithdrawApplyOpen(true)}>
          {dict('PC.Pages.MorePage.MyEarnings.withdrawApply')}
        </Button>
        <Button onClick={() => setWithdrawRecordOpen(true)}>
          {dict('PC.Pages.MorePage.MyEarnings.withdrawRecord')}
        </Button>
      </div>

      {/* 筛选栏 */}
      <div className={styles.filterBar}>
        <Segmented
          value={typeFilter}
          onChange={(val) => setTypeFilter(val as string)}
          options={[
            dict('PC.Pages.MorePage.MyEarnings.filterAll'),
            dict('PC.Pages.MorePage.MyEarnings.filterSubscription'),
            dict('PC.Pages.MorePage.MyEarnings.filterToolCall'),
          ]}
        />
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>
            {dict('PC.Pages.MorePage.MyEarnings.startDate')}
          </span>
          <DatePicker
            value={startDate}
            onChange={(val) => setStartDate(val)}
            size="small"
            style={{ width: 130 }}
          />
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>
            {dict('PC.Pages.MorePage.MyEarnings.endDate')}
          </span>
          <DatePicker
            value={endDate}
            onChange={(val) => setEndDate(val)}
            size="small"
            style={{ width: 130 }}
          />
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>
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
        <div className={styles.filterActions}>
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

      {/* 提现申请 Drawer */}
      <Drawer
        title={
          dict('PC.Pages.MorePage.MyEarnings.withdrawApplyTitle') || '提现申请'
        }
        open={withdrawApplyOpen}
        onClose={() => setWithdrawApplyOpen(false)}
        width={400}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setWithdrawApplyOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleWithdrawSubmit}>
              {dict('PC.Pages.MorePage.MyEarnings.withdrawSubmit')}
            </Button>
          </div>
        }
      >
        <div className={styles.withdrawDrawerContent}>
          <div>
            <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>
              {dict('PC.Pages.MorePage.MyEarnings.withdrawAmount')}
            </div>
            <Input
              type="number"
              placeholder={dict(
                'PC.Pages.MorePage.MyEarnings.withdrawAmountPlaceholder',
              )}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              prefix="¥"
            />
          </div>
          <div>
            <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>
              {dict('PC.Pages.MorePage.MyEarnings.withdrawAccount')}
            </div>
            <Select
              defaultValue="alipay"
              style={{ width: '100%' }}
              options={[
                { value: 'alipay', label: '支付宝 ***8888' },
                { value: 'bank', label: '银行卡 ***6666' },
              ]}
            />
          </div>
        </div>
      </Drawer>

      {/* 提现记录 Drawer */}
      <Drawer
        title={
          dict('PC.Pages.MorePage.MyEarnings.withdrawRecordTitle') || '提现记录'
        }
        open={withdrawRecordOpen}
        onClose={() => setWithdrawRecordOpen(false)}
        width={400}
      >
        <div className={styles.withdrawRecordList}>
          {MOCK_WITHDRAW_RECORDS.map((record) => (
            <div key={record.id} className={styles.withdrawRecordItem}>
              <div className={styles.withdrawRecordInfo}>
                <div className={styles.withdrawRecordAmount}>
                  ¥{record.amount}
                </div>
                <div className={styles.withdrawRecordTime}>{record.time}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Tag color="success">{record.status}</Tag>
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                  {record.account}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Drawer>
    </WorkspaceLayout>
  );
};

export default MyEarnings;
