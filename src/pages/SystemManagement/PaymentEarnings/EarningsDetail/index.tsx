import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import { formatDateTime } from '@/utils/dateUtils';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Card, Col, Row, Space, Statistic, Tag } from 'antd';
import React, { useState } from 'react';
import { history, useSearchParams } from 'umi';

const MOCK_STATS = {
  totalEarnings: 128500,
  withdrawn: 82000,
  available: 46500,
  count: 8,
};

const MOCK_EARNINGS = [
  {
    id: 1,
    orderNo: 'ORD20260426001',
    itemName: '智能客服助手',
    amount: 35000,
    type: '平台服务',
    createdAt: '2026-04-26T10:30:00Z',
    status: 'settled',
  },
  {
    id: 2,
    orderNo: 'ORD20260425003',
    itemName: 'AI绘画工具',
    amount: 18500,
    type: '工具调用',
    createdAt: '2026-04-25T14:20:00Z',
    status: 'settled',
  },
  {
    id: 3,
    orderNo: 'ORD20260424007',
    itemName: '智能客服助手',
    amount: 22000,
    type: '订阅',
    createdAt: '2026-04-24T09:15:00Z',
    status: 'settled',
  },
  {
    id: 4,
    orderNo: 'ORD20260423012',
    itemName: '数据洞察平台',
    amount: 28000,
    type: '订阅',
    createdAt: '2026-04-23T16:40:00Z',
    status: 'unsettled',
  },
  {
    id: 5,
    orderNo: 'ORD20260416001',
    itemName: '平台服务费',
    amount: -5000,
    type: '平台服务',
    createdAt: '2026-04-16T08:00:00Z',
    status: 'settled',
  },
];

const FILTER_OPTIONS = [
  { key: 'all', label: '全部' },
  { key: 'settled', label: '已结算' },
  { key: 'unsettled', label: '未结算' },
];

interface EarningRecord {
  id: number;
  orderNo: string;
  itemName: string;
  amount: number;
  type: string;
  createdAt: string;
  status: string;
}

const EarningsDetail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const developerName = searchParams.get('developerName');
  const [filter, setFilter] = useState<string>('all');

  const columns: ProColumns<EarningRecord>[] = [
    {
      title: '订单编号/流水号',
      dataIndex: 'orderNo',
      width: 180,
      search: false,
    },
    {
      title: '收益项名称',
      dataIndex: 'itemName',
      search: false,
    },
    {
      title: '收益金额',
      dataIndex: 'amount',
      search: false,
      render: (_, record) => (
        <span
          style={{
            color: record.amount >= 0 ? '#52c41a' : '#ff4d4f',
            fontWeight: 600,
          }}
        >
          ¥{(record.amount ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: '收益类型',
      dataIndex: 'type',
      search: false,
    },
    {
      title: '收益时间',
      dataIndex: 'createdAt',
      search: false,
      render: (val) => (val ? formatDateTime(val as string) : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      search: false,
      render: (_, record) => (
        <Tag color={record.status === 'settled' ? 'success' : 'warning'}>
          {record.status === 'settled' ? '已结算' : '未结算'}
        </Tag>
      ),
    },
  ];

  const filteredData =
    filter === 'all'
      ? MOCK_EARNINGS
      : MOCK_EARNINGS.filter((item) => item.status === filter);

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.SystemEarningsDetail.title')}
      rightSlot={<Button onClick={() => history.back()}>返回收益列表</Button>}
    >
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 16, fontWeight: 500 }}>
          {developerName} - {dict('PC.Pages.SystemEarningsDetail.subtitle')}
        </span>
      </div>

      {/* 统计卡 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="收益总额"
              value={MOCK_STATS.totalEarnings}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已提现" value={MOCK_STATS.withdrawn} prefix="¥" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="可提现"
              value={MOCK_STATS.available}
              prefix="¥"
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="明细笔数" value={MOCK_STATS.count} suffix="笔" />
          </Card>
        </Col>
      </Row>

      {/* 筛选按钮组 */}
      <Space style={{ marginBottom: 16 }}>
        {FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.key}
            type={filter === opt.key ? 'primary' : 'default'}
            onClick={() => setFilter(opt.key)}
          >
            {opt.label}
          </Button>
        ))}
      </Space>

      <XProTable<EarningRecord>
        rowKey="id"
        columns={columns}
        search={false}
        dataSource={filteredData}
        pagination={false}
      />
    </WorkspaceLayout>
  );
};

export default EarningsDetail;
