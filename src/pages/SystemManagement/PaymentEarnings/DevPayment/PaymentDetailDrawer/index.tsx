import { dict } from '@/services/i18nRuntime';
import { DevPaymentTypeEnum } from '@/types/interfaces/subscription';
import { Drawer, Empty, Tag } from 'antd';
import React, { useMemo } from 'react';

export interface PaymentDetailDrawerProps {
  open: boolean;
  record: any | undefined;
  onClose: () => void;
}

const DetailRow: React.FC<{ label: string; value?: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid #f0f0f0',
    }}
  >
    <span style={{ color: '#666', flexShrink: 0 }}>{label}</span>
    <span style={{ color: '#333', textAlign: 'right' }}>{value ?? '-'}</span>
  </div>
);

const PaymentDetailDrawer: React.FC<PaymentDetailDrawerProps> = ({
  open,
  record,
  onClose,
}) => {
  const drawerWidth = useMemo(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return '85vw';
    }
    return 520;
  }, []);

  return (
    <Drawer
      title={
        dict('PC.Pages.SystemDevPayment.drawerTitle') +
        ' - ' +
        (record?.developerName || '')
      }
      open={open}
      onClose={onClose}
      width={drawerWidth}
      destroyOnClose
    >
      {!record ? (
        <Empty />
      ) : (
        <>
          <div
            style={{
              fontSize: 14,
              color: '#999',
              marginBottom: 8,
              fontWeight: 500,
            }}
          >
            {dict('PC.Pages.SystemDevPayment.sectionDeveloperInfo')}
          </div>
          <DetailRow
            label={dict('PC.Pages.SystemDevPayment.colDeveloperId')}
            value={record.developerId}
          />
          <DetailRow
            label={dict('PC.Pages.SystemDevPayment.colEmail')}
            value={record.email || '-'}
          />
          <DetailRow
            label={dict('PC.Pages.SystemDevPayment.settlementMethod')}
            value="自动"
          />

          <div
            style={{
              fontSize: 14,
              color: '#999',
              marginBottom: 8,
              marginTop: 24,
              fontWeight: 500,
            }}
          >
            {dict('PC.Pages.SystemDevPayment.sectionPaymentAccount')}
          </div>
          <DetailRow
            label={dict('PC.Pages.SystemDevPayment.colBankName')}
            value={record.bankName || '-'}
          />
          <DetailRow
            label={dict('PC.Pages.SystemDevPayment.colBankCard')}
            value={
              <span>
                <Tag
                  color={
                    record.accountType === DevPaymentTypeEnum.Alipay
                      ? 'blue'
                      : 'green'
                  }
                >
                  {record.accountType === DevPaymentTypeEnum.Alipay
                    ? '支付宝'
                    : '银行卡'}
                </Tag>
                {record.accountNo}
              </span>
            }
          />
          <DetailRow
            label={dict('PC.Pages.SystemDevPayment.colRealName')}
            value={record.realName}
          />
          <DetailRow
            label={dict('PC.Pages.SystemDevPayment.colPhone')}
            value={record.phone || '-'}
          />
        </>
      )}
    </Drawer>
  );
};

export default PaymentDetailDrawer;
