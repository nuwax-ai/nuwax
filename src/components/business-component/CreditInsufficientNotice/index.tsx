import { dict } from '@/services/i18nRuntime';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import {
  useClaimCreditInsufficientPageBanner,
  useCreditInsufficientSnapshot,
} from './creditInsufficientStore';
import styles from './index.less';

const cx = classNames.bind(styles);

type PurchaseModalComponent = React.ComponentType<{
  open: boolean;
  onCancel: () => void;
}>;

interface CreditInsufficientBannerProps {
  placement: 'page' | 'input';
}

/** 积分不足提示条。增购积分打开积分增购弹窗，按需加载以免会话页静态依赖购买逻辑。 */
const CreditInsufficientBanner: React.FC<CreditInsufficientBannerProps> = ({
  placement,
}) => {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [PurchaseModal, setPurchaseModal] =
    useState<PurchaseModalComponent | null>(null);

  const openPurchase = () => {
    setPurchaseOpen(true);
    if (PurchaseModal) {
      return;
    }
    import('@/components/business-component/PurchaseModal')
      .then((module) => {
        setPurchaseModal(() => module.default);
      })
      .catch((error: unknown) => {
        console.error('[CreditInsufficientNotice] 增购积分弹窗加载失败', error);
        setPurchaseOpen(false);
      });
  };

  return (
    <>
      <div
        className={cx(styles.banner, {
          [styles['banner-page']]: placement === 'page',
          [styles['banner-input']]: placement === 'input',
        })}
      >
        <span className={cx(styles['banner-text'])}>
          <InfoCircleOutlined className={cx(styles['banner-icon'])} />
          {dict('PC.Components.CreditInsufficientNotice.banner')}
        </span>
        <Button className={cx(styles['upgrade-button'])} onClick={openPurchase}>
          {dict('PC.Components.CreditInsufficientNotice.upgrade')}
        </Button>
      </div>
      {PurchaseModal ? (
        <PurchaseModal
          open={purchaseOpen}
          onCancel={() => setPurchaseOpen(false)}
        />
      ) : null}
    </>
  );
};

/** 页面顶部提示。挂上后会话区不再重复渲染顶部条。 */
export const CreditInsufficientPageBanner: React.FC = () => {
  useClaimCreditInsufficientPageBanner();
  const { visible } = useCreditInsufficientSnapshot();
  if (!visible) {
    return null;
  }
  return <CreditInsufficientBanner placement="page" />;
};

/** 页面没有自己的顶部条时，补在会话区最上方 */
export const CreditInsufficientSessionPageBanner: React.FC<{
  active: boolean;
}> = ({ active }) => {
  const { pageBannerClaimed } = useCreditInsufficientSnapshot();
  if (!active || pageBannerClaimed) {
    return null;
  }
  return <CreditInsufficientBanner placement="page" />;
};

/** 输入框上方的积分不足提示 */
export const CreditInsufficientInputBanner: React.FC<{
  active: boolean;
}> = ({ active }) => {
  if (!active) {
    return null;
  }
  return <CreditInsufficientBanner placement="input" />;
};

export {
  CreditInsufficientProvider,
  CreditInsufficientScope,
  useReportCreditInsufficient,
} from './creditInsufficientStore';
export {
  hasCreditDeductionInsufficientError,
  lastMessageIndicatesCreditExhausted,
} from './hasCreditDeductionInsufficientError';
export { useCreditBalancePositive } from './useCreditBalancePositive';
export { useHistoryCreditExhausted } from './useHistoryCreditExhausted';
