import SvgIcon from '@/components/base/SvgIcon';
import CreditsPurchaseModal from '@/components/business-component/CreditsBalance/CreditsPurchaseModal';
import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetUserCredits,
  apiListCreditRecords,
} from '@/services/subscriptionService';
import type { CreditRecordInfo } from '@/types/interfaces/subscription';
import { CreditRecordTypeEnum } from '@/types/interfaces/subscription';
import { formatDateTime } from '@/utils/dateUtils';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Tag } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useRequest } from 'umi';

const CreditRecords: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const recordTypeConfig = useMemo(
    () => ({
      [CreditRecordTypeEnum.Recharge]: {
        color: 'success',
        label: dict('PC.Pages.MorePage.CreditRecords.typeRecharge'),
      },
      [CreditRecordTypeEnum.Consume]: {
        color: 'error',
        label: dict('PC.Pages.MorePage.CreditRecords.typeConsume'),
      },
      [CreditRecordTypeEnum.Refund]: {
        color: 'processing',
        label: dict('PC.Pages.MorePage.CreditRecords.typeRefund'),
      },
    }),
    [],
  );

  const { run: fetchCredits } = useRequest(apiGetUserCredits, {
    manual: true,
    onSuccess: (res) => {
      if (res?.data) setBalance(res.data.balance);
    },
  });

  useEffect(() => {
    fetchCredits();
  }, []);

  const columns: ProColumns<CreditRecordInfo>[] = [
    {
      title: dict('PC.Pages.MorePage.CreditRecords.colType'),
      dataIndex: 'recordType',
      key: 'recordType',
      render: (_, record) => {
        const config = recordTypeConfig[record.recordType];
        return <Tag color={config?.color}>{config?.label}</Tag>;
      },
      valueEnum: {
        [CreditRecordTypeEnum.Recharge]: {
          text: dict('PC.Pages.MorePage.CreditRecords.typeRecharge'),
        },
        [CreditRecordTypeEnum.Consume]: {
          text: dict('PC.Pages.MorePage.CreditRecords.typeConsume'),
        },
        [CreditRecordTypeEnum.Refund]: {
          text: dict('PC.Pages.MorePage.CreditRecords.typeRefund'),
        },
      },
    },
    {
      title: dict('PC.Pages.MorePage.CreditRecords.colDescription'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.MorePage.CreditRecords.colAmount'),
      dataIndex: 'amount',
      key: 'amount',
      search: false,
      render: (_, record) => {
        const isPositive = record.amount > 0;
        return (
          <span
            style={{
              color: isPositive ? '#52c41a' : '#ff4d4f',
              fontWeight: 500,
            }}
          >
            {isPositive ? `+${record.amount}` : String(record.amount)}
          </span>
        );
      },
    },
    {
      title: dict('PC.Pages.MorePage.CreditRecords.colBalance'),
      dataIndex: 'balance',
      key: 'balance',
      search: false,
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
    <WorkspaceLayout title={dict('PC.Pages.MorePage.CreditRecords.pageTitle')}>
      {/* 余额卡片 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 32px',
          borderRadius: 8,
          marginBottom: 16,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <SvgIcon name="icons-nav-credits" style={{ fontSize: 32 }} />
          <div>
            <div style={{ fontSize: 14, opacity: 0.85 }}>
              {dict('PC.Pages.MorePage.CreditRecords.currentBalance')}
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.2 }}>
              {balance.toLocaleString()}
            </div>
          </div>
        </div>
        <Button type="primary" ghost onClick={() => setPurchaseOpen(true)}>
          {dict('PC.Pages.MorePage.CreditRecords.buyCredits')}
        </Button>
      </div>

      <XProTable<CreditRecordInfo>
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await apiListCreditRecords({
            recordType: params.recordType as CreditRecordTypeEnum,
            pageNum: params.current,
            pageSize: params.pageSize,
          });
          if (res?.code === SUCCESS_CODE) {
            return {
              data: res.data?.list ?? [],
              total: res.data?.total ?? 0,
              success: true,
            };
          }
          return { data: [], total: 0, success: false };
        }}
      />

      <CreditsPurchaseModal
        open={purchaseOpen}
        onCancel={() => setPurchaseOpen(false)}
        onSuccess={fetchCredits}
      />
    </WorkspaceLayout>
  );
};

export default CreditRecords;
