import { XProTable } from '@/components/ProComponents';
import { dict } from '@/services/i18nRuntime';
import { Modal } from 'antd';
import React from 'react';

interface RevenueDetailModalProps {
  open: boolean;
  onCancel: () => void;
  data: any[];
}

const RevenueDetailModal: React.FC<RevenueDetailModalProps> = ({
  open,
  onCancel,
  data,
}) => {
  return (
    <Modal
      title={dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.viewEarnings',
      )}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <XProTable
        rowKey="id"
        search={false}
        showQueryButtons={false}
        toolBarRender={false}
        dataSource={data}
        columns={[
          {
            title: dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Stats.colLastEarningsAt',
            ),
            dataIndex: 'dt',
            key: 'dt',
            width: 120,
          },
          {
            title: dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Stats.colTotalEarnings',
            ),
            dataIndex: 'amount',
            key: 'amount',
            width: 150,
            render: (_, record: any) => (
              <span style={{ fontWeight: 600, color: '#52c41a' }}>
                ¥{(record.amount ?? 0).toLocaleString()}
              </span>
            ),
          },
          {
            title: dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colCreatedAt',
            ),
            dataIndex: 'created',
            key: 'created',
            valueType: 'dateTime',
            width: 180,
          },
        ]}
      />
    </Modal>
  );
};

export default RevenueDetailModal;
