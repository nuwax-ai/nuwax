import { TableActions, XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiPageDevPaymentAccounts } from '@/services/subscriptionService';
import type { DevPaymentAccountRecord } from '@/types/interfaces/subscription';
import { DevPaymentTypeEnum } from '@/types/interfaces/subscription';
import { BankFilled } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import React, { useCallback, useState } from 'react';
import PaymentDetailModal from './components/PaymentDetailModal';

const DevPayment: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  const handleShowDetail = useCallback((record: any) => {
    // 统一详情弹窗所需的数据格式
    const detailData = {
      ...record,
      developerId: record.userId,
      developerName: record.userName,
      accountNo: record.bankCardNo,
      accountType: DevPaymentTypeEnum.BankCard, // 后端示例目前均为银行卡
    };
    setCurrentRecord(detailData);
    setModalVisible(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setModalVisible(false);
    setCurrentRecord(null);
  }, []);

  const columns: ProColumns<DevPaymentAccountRecord>[] = [
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.colDeveloperId',
      ),
      dataIndex: 'userId',
      key: 'userId',
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.colDeveloper',
      ),
      dataIndex: 'userName',
      key: 'userNameKeyword',
      ellipsis: true,
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.colEmail',
      ),
      dataIndex: 'email',
      key: 'email',
      search: false,
      ellipsis: true,
      render: (val) => val || '-',
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.colPhone',
      ),
      dataIndex: 'phone',
      key: 'phone',
      search: false,
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
          <Tag icon={<BankFilled />} color="green">
            {dict(
              'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.typeBankCard',
            )}
          </Tag>
          {record.bankCardNo || '-'}
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
        <XProTable<DevPaymentAccountRecord>
          rowKey="id"
          columns={columns}
          request={async (params) => {
            try {
              const { current, pageSize, userNameKeyword, userId } = params;
              const res = await apiPageDevPaymentAccounts({
                userNameKeyword,
                userId: userId ? Number(userId) : undefined,
                page: current || 1,
                pageSize: pageSize || 10,
              });
              if (res?.code === SUCCESS_CODE && res.data) {
                return {
                  data: res.data.records || [],
                  total: res.data.total || 0,
                  success: true,
                };
              }
            } catch (err) {
              console.error('Failed to fetch dev payment accounts:', err);
            }
            return {
              data: [],
              total: 0,
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
