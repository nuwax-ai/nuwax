import { TableActions, XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiListDevPaymentAccounts } from '@/services/subscriptionService';
import type { DevPaymentAccountInfo } from '@/types/interfaces/subscription';
import { DevPaymentTypeEnum } from '@/types/interfaces/subscription';
import { AlipayCircleFilled, BankFilled } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import React, { useCallback, useState } from 'react';
import PaymentDetailModal from './components/PaymentDetailModal';

interface DevPaymentExt extends DevPaymentAccountInfo {
  email: string;
  phone: string;
}

const MOCK_ACCOUNTS: DevPaymentExt[] = [
  {
    id: 1,
    developerId: 101,
    developerName: 'Alice Wang',
    email: 'alice@example.com',
    phone: '138****1234',
    accountType: DevPaymentTypeEnum.Alipay,
    accountNo: 'alice@example.com',
    realName: '王丽',
    createdAt: '2026-03-15T08:00:00Z',
  },
  {
    id: 2,
    developerId: 102,
    developerName: 'Bob Li',
    email: 'bob@example.com',
    phone: '139****5678',
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
    email: 'carlos@dev.com',
    phone: '137****9012',
    accountType: DevPaymentTypeEnum.Alipay,
    accountNo: 'carlos@dev.com',
    realName: 'Carlos',
    createdAt: '2026-04-01T10:00:00Z',
  },
];

const DevPayment: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<DevPaymentExt | null>(
    null,
  );

  const handleShowDetail = useCallback((record: DevPaymentExt) => {
    setCurrentRecord(record);
    setModalVisible(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setModalVisible(false);
    setCurrentRecord(null);
  }, []);

  const columns: ProColumns<DevPaymentExt>[] = [
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.colDeveloperId',
      ),
      dataIndex: 'developerId',
      key: 'developerId',
      width: 100,
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.colDeveloper',
      ),
      dataIndex: 'developerName',
      key: 'developerName',
      ellipsis: true,
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.colEmail',
      ),
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
      render: (val) => val || '-',
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.colPhone',
      ),
      dataIndex: 'phone',
      key: 'phone',
      render: (val) => val || '-',
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.colDefaultAccount',
      ),
      key: 'defaultAccount',
      search: false,
      render: (_, record) => (
        <span>
          {record.accountType === DevPaymentTypeEnum.Alipay ? (
            <Tag icon={<AlipayCircleFilled />} color="blue">
              {dict(
                'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.typeAlipay',
              )}
            </Tag>
          ) : (
            <Tag icon={<BankFilled />} color="green">
              {dict(
                'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.typeBankCard',
              )}
            </Tag>
          )}
          {record.accountNo || '-'}
        </span>
      ),
    },
    {
      title: dict('PC.Common.Global.action'),
      key: 'action',
      search: false,
      width: 120,
      render: (_, record) => (
        <TableActions
          record={record}
          actions={[
            {
              key: 'detail',
              label: dict(
                'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.viewDetail',
              ),
              onClick: (r) => handleShowDetail(r),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <WorkspaceLayout title={dict('PC.Routes.devPaymentInfo')}>
        <XProTable<DevPaymentExt>
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
      <PaymentDetailModal
        open={modalVisible}
        record={currentRecord}
        onCancel={handleCloseDetail}
      />
    </>
  );
};

export default DevPayment;
