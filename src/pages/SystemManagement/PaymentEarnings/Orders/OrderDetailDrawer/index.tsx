import { dict } from '@/services/i18nRuntime';
import { formatDateTime } from '@/utils/dateUtils';
import { Drawer, Empty, Tag } from 'antd';
import React, { useMemo } from 'react';

export interface OrderDetailDrawerProps {
  open: boolean;
  record: any | undefined;
  onClose: () => void;
}

const payMethodMap: Record<string, string> = {
  wechat: 'PC.Pages.SystemPaymentOrders.payMethodWechat',
  alipay: 'PC.Pages.SystemPaymentOrders.payMethodAlipay',
  bank: 'PC.Pages.SystemPaymentOrders.payMethodBank',
};

const statusConfig: Record<string, { dictKey: string; color: string }> = {
  Paid: { dictKey: 'PC.Pages.MorePage.MyOrders.statusPaid', color: 'success' },
  Pending: {
    dictKey: 'PC.Pages.MorePage.MyOrders.statusPending',
    color: 'warning',
  },
  Refunded: {
    dictKey: 'PC.Pages.MorePage.MyOrders.statusRefunded',
    color: 'default',
  },
};

const DetailRow: React.FC<{ label: string; children?: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid #f0f0f0',
    }}
  >
    <span style={{ color: '#666', flexShrink: 0 }}>{label}</span>
    <span style={{ textAlign: 'right', wordBreak: 'break-all' }}>
      {children ?? '-'}
    </span>
  </div>
);

const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  open,
  record,
  onClose,
}) => {
  const drawerWidth = useMemo(() => {
    if (typeof window === 'undefined') return 520;
    return window.innerWidth < 768 ? '85vw' : 520;
  }, []);

  return (
    <Drawer
      title={dict('PC.Pages.SystemPaymentOrders.drawerTitle')}
      placement="right"
      open={open}
      onClose={onClose}
      width={drawerWidth}
      destroyOnHidden
    >
      {record ? (
        <div>
          <DetailRow label={dict('PC.Pages.SystemPaymentOrders.orderNo')}>
            {record.orderNo}
          </DetailRow>
          <DetailRow label={dict('PC.Pages.SystemPaymentOrders.payMethod')}>
            {payMethodMap[record.payMethod]
              ? dict(payMethodMap[record.payMethod])
              : record.payMethod}
          </DetailRow>
          <DetailRow label={dict('PC.Pages.SystemPaymentOrders.amount')}>
            ¥{record.amount}
          </DetailRow>
          <DetailRow label={dict('PC.Pages.SystemPaymentOrders.netAmount')}>
            ¥{Number(record.netAmount).toFixed(2)}
          </DetailRow>
          <DetailRow label={dict('PC.Pages.SystemPaymentOrders.serviceFee')}>
            <span style={{ color: '#ff4d4f' }}>
              ¥{Number(record.serviceFee).toFixed(2)}
            </span>
          </DetailRow>
          <DetailRow label={dict('PC.Pages.SystemPaymentOrders.status')}>
            {statusConfig[record.status] ? (
              <Tag color={statusConfig[record.status].color}>
                {dict(statusConfig[record.status].dictKey)}
              </Tag>
            ) : (
              record.status
            )}
          </DetailRow>
          <DetailRow label={dict('PC.Pages.SystemPaymentOrders.createdAt')}>
            {formatDateTime(record.createdAt)}
          </DetailRow>
          <DetailRow label={dict('PC.Pages.SystemPaymentOrders.paidAt')}>
            {record.paidAt ? formatDateTime(record.paidAt) : '-'}
          </DetailRow>
          <DetailRow label={dict('PC.Pages.SystemPaymentOrders.remark')}>
            {record.remark || '-'}
          </DetailRow>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Empty />
        </div>
      )}
    </Drawer>
  );
};

export default OrderDetailDrawer;
