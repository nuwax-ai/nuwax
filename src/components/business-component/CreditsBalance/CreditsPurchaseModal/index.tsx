import { dict } from '@/services/i18nRuntime';
import {
  apiListCreditPackages,
  apiPurchaseCredits,
} from '@/services/subscriptionService';
import type { CreditPackageInfo } from '@/types/interfaces/subscription';
import {
  preparePaymentWindow,
  type PaymentWindow,
} from '@/utils/hostBridge/paymentWindow';
import { Button, Modal, Spin, Tag, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useRequest } from 'umi';

interface Props {
  open: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}

const CreditsPurchaseModal: React.FC<Props> = ({
  open,
  onCancel,
  onSuccess,
}) => {
  const [packages, setPackages] = useState<CreditPackageInfo[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const purchasingRef = useRef(false);
  const paymentWindowRef = useRef<PaymentWindow | null>(null);

  useEffect(() => () => paymentWindowRef.current?.closePending(), []);

  const { loading, run: loadPackages } = useRequest(apiListCreditPackages, {
    manual: true,
    onSuccess: (res) => {
      const list = res?.data ?? [];
      setPackages(list);
      if (list.length > 0) setSelectedId(list[0].id);
    },
  });

  useEffect(() => {
    if (open) {
      setSelectedId(null);
      loadPackages();
    } else {
      paymentWindowRef.current?.closePending();
    }
  }, [open]);

  const handlePurchase = async () => {
    if (!selectedId || purchasingRef.current) return;
    const paymentWindow = preparePaymentWindow();
    if (!paymentWindow) {
      message.error(dict('PC.Components.CreditsBalance.purchaseFailed'));
      return;
    }
    paymentWindowRef.current = paymentWindow;
    purchasingRef.current = true;
    setPurchasing(true);
    try {
      const res = await apiPurchaseCredits(selectedId);
      const data = res?.data;
      if (data?.payUrl) {
        if (!(await paymentWindow.open(data.payUrl))) {
          message.error(dict('PC.Components.CreditsBalance.purchaseFailed'));
          return;
        }
      } else if (data?.qrCode) {
        message.info(dict('PC.Components.CreditsBalance.payByQRCode'));
      }
      message.success(dict('PC.Components.CreditsBalance.purchaseSuccess'));
      onSuccess?.();
      onCancel();
    } catch {
      message.error(dict('PC.Components.CreditsBalance.purchaseFailed'));
    } finally {
      paymentWindow.closePending();
      paymentWindowRef.current = null;
      purchasingRef.current = false;
      setPurchasing(false);
    }
  };

  return (
    <Modal
      title={dict('PC.Components.CreditsBalance.purchaseCredits')}
      open={open}
      onCancel={onCancel}
      width={520}
      centered
      footer={
        <Button
          type="primary"
          loading={purchasing}
          disabled={!selectedId}
          onClick={handlePurchase}
        >
          {dict('PC.Components.CreditsBalance.buyNow')}
        </Button>
      }
    >
      {loading ? (
        <div
          className="flex items-center content-center"
          style={{ height: 200 }}
        >
          <Spin />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {packages.map((pkg) => {
            const selected = selectedId === pkg.id;
            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedId(pkg.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: selected ? '2px solid #1677ff' : '1px solid #e8e8e8',
                  background: selected ? '#f0f5ff' : '#fff',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: 16 }}>
                    {pkg.name}
                    {pkg.tag && (
                      <Tag color="red" style={{ marginLeft: 8 }}>
                        {pkg.tag}
                      </Tag>
                    )}
                  </div>
                  <div style={{ color: '#666', marginTop: 4 }}>
                    {pkg.credits} {dict('PC.Components.CreditsBalance.credits')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{ fontSize: 18, fontWeight: 600, color: '#1677ff' }}
                  >
                    ¥{pkg.price}
                  </div>
                  {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                    <div
                      style={{
                        color: '#999',
                        textDecoration: 'line-through',
                        fontSize: 12,
                      }}
                    >
                      ¥{pkg.originalPrice}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

export default CreditsPurchaseModal;
