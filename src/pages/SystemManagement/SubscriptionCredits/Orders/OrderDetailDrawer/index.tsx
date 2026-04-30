import { dict } from '@/services/i18nRuntime';
import { formatDate } from '@/utils/dateUtils';
import { Drawer, Empty, Tag } from 'antd';
import React, { useMemo } from 'react';

export interface OrderDetailDrawerProps {
  open: boolean;
  record: any | undefined;
  onClose: () => void;
}

const statusColorMap: Record<string, string> = {
  Paid: 'success',
  Pending: 'warning',
  Refunded: 'default',
};

const statusLabelMap: Record<string, string> = {
  Paid: dict('PC.Pages.MorePage.MyOrders.statusPaid'),
  Pending: dict('PC.Pages.MorePage.MyOrders.statusPending'),
  Refunded: dict('PC.Pages.MorePage.MyOrders.statusRefunded'),
};

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({
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
    <span style={{ color: '#666' }}>{label}</span>
    <span style={{ fontWeight: 500 }}>{value}</span>
  </div>
);

const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  open,
  record,
  onClose,
}) => {
  const drawerWidth = useMemo(() => {
    if (typeof window === 'undefined') return 520;
    const w = window.innerWidth || 520;
    return Math.min(520, Math.max(360, Math.floor(w * 0.85)));
  }, []);

  return (
    <Drawer
      title={dict('PC.Pages.SystemSubsOrders.drawerTitle')}
      placement="right"
      open={open}
      onClose={onClose}
      width={drawerWidth}
      destroyOnHidden
    >
      {record ? (
        <div>
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 14,
                color: '#999',
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              {dict('PC.Pages.SystemSubsOrders.detailDeveloperInfo')}
            </div>
            <DetailRow
              label={dict('PC.Pages.SystemSubsOrders.colRecordNo')}
              value={record.orderNo}
            />
            <DetailRow
              label={dict('PC.Pages.SystemSubsOrders.colDeveloper')}
              value={record.userName}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 14,
                color: '#999',
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              {dict('PC.Pages.SystemSubsOrders.detailSubscriptionInfo')}
            </div>
            <DetailRow
              label={dict('PC.Pages.SystemSubsOrders.colSubscriptionType')}
              value={
                record.orderType === 'Subscription'
                  ? dict('PC.Pages.MorePage.MyOrders.typeSubscription')
                  : dict('PC.Pages.MorePage.MyOrders.typeCredits')
              }
            />
            <DetailRow
              label={dict('PC.Pages.SystemSubsOrders.colPlanName')}
              value={record.productName}
            />
            <DetailRow
              label={dict('PC.Pages.MorePage.MyOrders.colAmount')}
              value={`${dict('PC.Common.Global.currencySymbol')}${
                record.amount ?? 0
              }`}
            />
            <DetailRow
              label={dict('PC.Pages.SystemSubsOrders.colStartAt')}
              value={record.startAt ? formatDate(record.startAt) : '-'}
            />
            <DetailRow
              label={dict('PC.Pages.SystemSubsOrders.colExpireAt')}
              value={record.expireAt ? formatDate(record.expireAt) : '-'}
            />
            <DetailRow
              label={dict('PC.Pages.MorePage.MyOrders.colStatus')}
              value={
                <Tag color={statusColorMap[record.status]}>
                  {statusLabelMap[record.status] ?? record.status}
                </Tag>
              }
            />
          </div>
        </div>
      ) : (
        <Empty />
      )}
    </Drawer>
  );
};

export default OrderDetailDrawer;
