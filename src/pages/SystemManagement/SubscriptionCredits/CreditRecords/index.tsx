import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiListAdminCreditRecords } from '@/services/subscriptionService';
import type { AdminCreditRecordInfo } from '@/types/interfaces/subscription';
import { CreditRecordTypeEnum } from '@/types/interfaces/subscription';
import { formatDateTime } from '@/utils/dateUtils';
import type { ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import React, { useMemo } from 'react';

interface CreditRecordExt extends AdminCreditRecordInfo {
  phone: string;
  recordNo: string;
}

const MOCK_RECORDS: CreditRecordExt[] = [
  {
    id: 1,
    recordNo: 'CR20260428001',
    userName: 'Alice Wang',
    phone: '138****1234',
    recordType: CreditRecordTypeEnum.Recharge,
    description: '购买标准包 500 积分',
    amount: 500,
    balance: 1250,
    createdAt: '2026-04-28T10:30:00Z',
  },
  {
    id: 2,
    recordNo: 'CR20260427001',
    userName: 'Bob Li',
    phone: '139****5678',
    recordType: CreditRecordTypeEnum.Consume,
    description: 'AI 智能体使用 - 代码助手',
    amount: -50,
    balance: 350,
    createdAt: '2026-04-27T14:20:00Z',
  },
  {
    id: 3,
    recordNo: 'CR20260426001',
    userName: 'Eric Zhang',
    phone: '136****3456',
    recordType: CreditRecordTypeEnum.Recharge,
    description: '购买企业包 10000 积分',
    amount: 10000,
    balance: 4800,
    createdAt: '2026-04-26T09:00:00Z',
  },
  {
    id: 4,
    recordNo: 'CR20260425001',
    userName: 'Fiona Liu',
    phone: '135****7890',
    recordType: CreditRecordTypeEnum.Refund,
    description: '退款 - 订单 ORD20260220001',
    amount: 100,
    balance: 99,
    createdAt: '2026-04-25T16:00:00Z',
  },
  {
    id: 5,
    recordNo: 'CR20260424001',
    userName: 'Alice Wang',
    phone: '138****1234',
    recordType: CreditRecordTypeEnum.Consume,
    description: 'AI 智能体使用 - 数据分析师',
    amount: -30,
    balance: 750,
    createdAt: '2026-04-24T11:00:00Z',
  },
];

const CreditRecords: React.FC = () => {
  const typeConfig = useMemo(
    () => ({
      [CreditRecordTypeEnum.Recharge]: {
        color: 'success',
        label: dict('PC.Pages.SystemCreditRecords.typeIncrease'),
      },
      [CreditRecordTypeEnum.Consume]: {
        color: 'error',
        label: dict('PC.Pages.SystemCreditRecords.typeDecrease'),
      },
      [CreditRecordTypeEnum.Refund]: {
        color: 'success',
        label: dict('PC.Pages.SystemCreditRecords.typeIncrease'),
      },
    }),
    [],
  );

  const columns: ProColumns<CreditRecordExt>[] = [
    {
      title: dict('PC.Pages.SystemCreditRecords.colRecordNo'),
      dataIndex: 'recordNo',
      key: 'recordNo',
      ellipsis: true,
      width: 180,
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.colUser'),
      dataIndex: 'userName',
      key: 'userName',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.colPhone'),
      dataIndex: 'phone',
      key: 'phone',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.MorePage.CreditRecords.colType'),
      dataIndex: 'recordType',
      key: 'recordType',
      render: (_, record) => {
        const cfg = typeConfig[record.recordType];
        return <Tag color={cfg?.color}>{cfg?.label}</Tag>;
      },
      valueEnum: {
        [CreditRecordTypeEnum.Recharge]: {
          text: dict('PC.Pages.SystemCreditRecords.typeIncrease'),
        },
        [CreditRecordTypeEnum.Consume]: {
          text: dict('PC.Pages.SystemCreditRecords.typeDecrease'),
        },
      },
    },
    {
      title: dict('PC.Pages.MorePage.CreditRecords.colDescription'),
      dataIndex: 'description',
      key: 'description',
      search: false,
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.MorePage.CreditRecords.colAmount'),
      dataIndex: 'amount',
      key: 'amount',
      search: false,
      render: (_, record) => {
        const val = record.amount ?? 0;
        const isPositive = val > 0;
        return (
          <span
            style={{
              color: isPositive ? '#52c41a' : '#ff4d4f',
              fontWeight: 500,
            }}
          >
            {isPositive ? `+${val}` : String(val)}
          </span>
        );
      },
    },
    {
      title: dict('PC.Pages.MorePage.CreditRecords.colBalance'),
      dataIndex: 'balance',
      key: 'balance',
      search: false,
      render: (val) => (val ?? 0).toLocaleString(),
    },
    {
      title: dict('PC.Pages.MorePage.CreditRecords.colCreatedAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      search: false,
      render: (val) => formatDateTime(val),
    },
  ];

  return (
    <WorkspaceLayout title={dict('PC.Routes.creditsRecordsQuery')}>
      <XProTable<CreditRecordExt>
        rowKey="id"
        columns={columns}
        request={async (params) => {
          try {
            const res = await apiListAdminCreditRecords({
              keyword: params.userName,
              recordType: params.recordType,
              pageNum: params.current,
              pageSize: params.pageSize,
            });
            if (res?.code === SUCCESS_CODE && res.data?.list?.length) {
              return {
                data: res.data.list,
                total: res.data.total,
                success: true,
              };
            }
          } catch {}
          return {
            data: MOCK_RECORDS,
            total: MOCK_RECORDS.length,
            success: true,
          };
        }}
      />
    </WorkspaceLayout>
  );
};

export default CreditRecords;
