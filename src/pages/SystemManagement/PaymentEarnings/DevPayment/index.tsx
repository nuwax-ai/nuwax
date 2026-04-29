import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiListDevPaymentAccounts } from '@/services/subscriptionService';
import type { DevPaymentAccountInfo } from '@/types/interfaces/subscription';
import { DevPaymentTypeEnum } from '@/types/interfaces/subscription';
import { formatDateTime } from '@/utils/dateUtils';
import { AlipayCircleFilled, BankFilled } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import React from 'react';

const MOCK_ACCOUNTS: DevPaymentAccountInfo[] = [
  {
    id: 1,
    developerId: 101,
    developerName: 'Alice Wang',
    accountType: DevPaymentTypeEnum.Alipay,
    accountNo: 'alice@example.com',
    realName: '王丽',
    createdAt: '2026-03-15T08:00:00Z',
  },
  {
    id: 2,
    developerId: 102,
    developerName: 'Bob Li',
    accountType: DevPaymentTypeEnum.BankCard,
    accountNo: '6222 **** **** 1234',
    realName: '李明',
    bankName: '中国工商银行',
    createdAt: '2026-02-20T09:00:00Z',
  },
  {
    id: 3,
    developerId: 103,
    developerName: 'Carlos Dev',
    accountType: DevPaymentTypeEnum.Alipay,
    accountNo: 'carlos@dev.com',
    realName: 'Carlos',
    createdAt: '2026-04-01T10:00:00Z',
  },
];

const DevPayment: React.FC = () => {
  const columns: ProColumns<DevPaymentAccountInfo>[] = [
    {
      title: dict('PC.Pages.SystemDevPayment.colDeveloper'),
      dataIndex: 'developerName',
      key: 'developerName',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.SystemDevPayment.colAccountType'),
      dataIndex: 'accountType',
      key: 'accountType',
      search: false,
      render: (_, record) =>
        record.accountType === DevPaymentTypeEnum.Alipay ? (
          <Tag icon={<AlipayCircleFilled />} color="blue">
            {dict('PC.Pages.SystemDevPayment.typeAlipay')}
          </Tag>
        ) : (
          <Tag icon={<BankFilled />} color="green">
            {dict('PC.Pages.SystemDevPayment.typeBankCard')}
          </Tag>
        ),
    },
    {
      title: dict('PC.Pages.SystemDevPayment.colAccountNo'),
      dataIndex: 'accountNo',
      key: 'accountNo',
      search: false,
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.SystemDevPayment.colRealName'),
      dataIndex: 'realName',
      key: 'realName',
      search: false,
    },
    {
      title: dict('PC.Pages.SystemDevPayment.colBankName'),
      dataIndex: 'bankName',
      key: 'bankName',
      search: false,
      render: (val) => val || '-',
    },
    {
      title: dict('PC.Pages.SystemDevPayment.colCreatedAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      search: false,
      render: (val) => formatDateTime(val),
    },
  ];

  return (
    <WorkspaceLayout title={dict('PC.Routes.devPaymentInfo')}>
      <XProTable<DevPaymentAccountInfo>
        rowKey="id"
        columns={columns}
        request={async (params) => {
          try {
            const res = await apiListDevPaymentAccounts({
              keyword: params.developerName,
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
            data: MOCK_ACCOUNTS,
            total: MOCK_ACCOUNTS.length,
            success: true,
          };
        }}
      />
    </WorkspaceLayout>
  );
};

export default DevPayment;
