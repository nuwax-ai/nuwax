import CreditsPurchaseModal from '@/components/business-component/CreditsBalance/CreditsPurchaseModal';
import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import type { CreditRecordInfo } from '@/types/interfaces/subscription';
import { CreditRecordTypeEnum } from '@/types/interfaces/subscription';
import { formatDateTime } from '@/utils/dateUtils';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, DatePicker, Select, Tag } from 'antd';
import type { Dayjs } from 'dayjs';
import React, { useState } from 'react';
import styles from './index.less';

// Mock 统计数据
const MOCK_STATS = {
  totalEarned: 5998,
  totalConsumed: 3010,
  currentRemaining: 12580,
};

// Mock 积分记录
const MOCK_RECORDS: CreditRecordInfo[] = [
  {
    id: 1,
    recordType: CreditRecordTypeEnum.Consume,
    description: 'API调用 Token消耗',
    amount: -450,
    balance: 12580,
    createdAt: '2026-04-26 14:32:00',
  },
  {
    id: 2,
    recordType: CreditRecordTypeEnum.Consume,
    description: '智能文档摘要订阅',
    amount: -120,
    balance: 13030,
    createdAt: '2026-04-26 09:15:00',
  },
  {
    id: 3,
    recordType: CreditRecordTypeEnum.Consume,
    description: 'AI绘画助手 图像生成',
    amount: -230,
    balance: 13150,
    createdAt: '2026-04-25 23:58:00',
  },
  {
    id: 4,
    recordType: CreditRecordTypeEnum.Recharge,
    description: '每日签到奖励',
    amount: 200,
    balance: 13380,
    createdAt: '2026-04-25 18:30:00',
  },
  {
    id: 5,
    recordType: CreditRecordTypeEnum.Consume,
    description: 'Web搜索工具调用',
    amount: -50,
    balance: 13180,
    createdAt: '2026-04-25 10:00:00',
  },
  {
    id: 6,
    recordType: CreditRecordTypeEnum.Consume,
    description: '代码分析工具 批量扫描',
    amount: -380,
    balance: 13230,
    createdAt: '2026-04-24 16:42:00',
  },
  {
    id: 7,
    recordType: CreditRecordTypeEnum.Recharge,
    description: '专业版订阅积分发放',
    amount: 2000,
    balance: 13610,
    createdAt: '2026-04-24 08:20:00',
  },
  {
    id: 8,
    recordType: CreditRecordTypeEnum.Consume,
    description: '合同审查助手 文档处理',
    amount: -160,
    balance: 11610,
    createdAt: '2026-04-23 21:15:00',
  },
  {
    id: 9,
    recordType: CreditRecordTypeEnum.Recharge,
    description: '参与"AI创意大赛"活动奖励',
    amount: 500,
    balance: 11860,
    createdAt: '2026-04-22 19:45:00',
  },
  {
    id: 10,
    recordType: CreditRecordTypeEnum.Recharge,
    description: '积分增购 积分包C',
    amount: 499,
    balance: 11835,
    createdAt: '2026-04-19 14:20:00',
  },
];

const CreditRecords: React.FC = () => {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [changeType, setChangeType] = useState<string>('全部');

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setChangeType('全部');
  };

  const columns: ProColumns<CreditRecordInfo>[] = [
    {
      title: dict('PC.Pages.MorePage.CreditRecords.colTime'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      search: false,
      width: 160,
      render: (val) => formatDateTime(val as string),
    },
    {
      title: dict('PC.Pages.MorePage.CreditRecords.colType'),
      dataIndex: 'recordType',
      key: 'recordType',
      search: false,
      width: 80,
      render: (_, record) => {
        const isIncrease = record.amount > 0;
        return (
          <Tag
            className={
              isIncrease ? styles.typeTagIncrease : styles.typeTagDecrease
            }
          >
            {isIncrease
              ? dict('PC.Pages.MorePage.CreditRecords.filterIncrease')
              : dict('PC.Pages.MorePage.CreditRecords.filterDecrease')}
          </Tag>
        );
      },
    },
    {
      title: dict('PC.Pages.MorePage.CreditRecords.colAmount'),
      dataIndex: 'amount',
      key: 'amount',
      search: false,
      width: 120,
      render: (_, record) => {
        const isPositive = record.amount > 0;
        return (
          <span
            className={`${styles.amountCell} ${
              isPositive ? styles.amountPositive : styles.amountNegative
            }`}
          >
            {isPositive ? `+${record.amount}` : String(record.amount)}
          </span>
        );
      },
    },
    {
      title: dict('PC.Pages.MorePage.CreditRecords.colRemaining'),
      dataIndex: 'balance',
      key: 'balance',
      search: false,
      width: 120,
      render: (val) => (val as number).toLocaleString(),
    },
    {
      title: dict('PC.Pages.MorePage.CreditRecords.colNote'),
      dataIndex: 'description',
      key: 'description',
      search: false,
      ellipsis: true,
    },
  ];

  return (
    <WorkspaceLayout title={dict('PC.Pages.MorePage.CreditRecords.pageTitle')}>
      {/* 统计卡片 */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} style={{ background: '#f6ffed' }}>
          <div className={styles.statLabel}>
            {dict('PC.Pages.MorePage.CreditRecords.totalEarned')}
          </div>
          <div className={styles.statValue}>
            {MOCK_STATS.totalEarned.toLocaleString()}
          </div>
          <div className={styles.statHint}>
            {dict('PC.Pages.MorePage.CreditRecords.totalEarnedDesc')}
          </div>
        </div>
        <div className={styles.statCard} style={{ background: '#fff2f0' }}>
          <div className={styles.statLabel}>
            {dict('PC.Pages.MorePage.CreditRecords.totalConsumed')}
          </div>
          <div className={styles.statValue}>
            {MOCK_STATS.totalConsumed.toLocaleString()}
          </div>
          <div className={styles.statHint}>
            {dict('PC.Pages.MorePage.CreditRecords.totalConsumedDesc')}
          </div>
        </div>
        <div className={styles.statCard} style={{ background: '#f0f5ff' }}>
          <div className={styles.statLabel}>
            {dict('PC.Pages.MorePage.CreditRecords.currentRemaining')}
          </div>
          <div className={styles.statValue}>
            {MOCK_STATS.currentRemaining.toLocaleString()}
          </div>
          <div className={styles.statHint}>
            {dict('PC.Pages.MorePage.CreditRecords.currentRemainingDesc')}
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>
            {dict('PC.Pages.MorePage.CreditRecords.startDate')}
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
            {dict('PC.Pages.MorePage.CreditRecords.endDate')}
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
            {dict('PC.Pages.MorePage.CreditRecords.changeType')}
          </span>
          <Select
            value={changeType}
            onChange={(val) => setChangeType(val)}
            size="small"
            style={{ width: 100 }}
            options={[
              {
                value: '全部',
                label: dict('PC.Pages.MorePage.CreditRecords.filterAll'),
              },
              {
                value: '增加',
                label: dict('PC.Pages.MorePage.CreditRecords.filterIncrease'),
              },
              {
                value: '扣减',
                label: dict('PC.Pages.MorePage.CreditRecords.filterDecrease'),
              },
            ]}
          />
        </div>
        <div className={styles.filterActions}>
          <Button size="small" onClick={handleReset}>
            {dict('PC.Pages.MorePage.CreditRecords.filterReset')}
          </Button>
          <Button type="primary" size="small">
            {dict('PC.Pages.MorePage.CreditRecords.filterSubmit')}
          </Button>
        </div>
      </div>

      {/* 积分记录表格 */}
      <XProTable<CreditRecordInfo>
        rowKey="id"
        columns={columns}
        search={false}
        toolBarRender={false}
        dataSource={MOCK_RECORDS}
        pagination={{ pageSize: 10 }}
      />

      <CreditsPurchaseModal
        open={purchaseOpen}
        onCancel={() => setPurchaseOpen(false)}
      />
    </WorkspaceLayout>
  );
};

export default CreditRecords;
