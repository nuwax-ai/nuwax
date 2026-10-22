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
import SystemSubscriptionPlansModal from './SystemSubscriptionPlansModal';

const cx = classNames.bind(styles);

interface CreditInsufficientBannerProps {
  placement: 'page' | 'input';
}

/** 积分不足提示条。升级套餐打开系统套餐弹窗。 */
const CreditInsufficientBanner: React.FC<CreditInsufficientBannerProps> = ({
  placement,
}) => {
  const [plansOpen, setPlansOpen] = useState(false);

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
        <Button
          className={cx(styles['upgrade-button'])}
          onClick={() => setPlansOpen(true)}
        >
          {dict('PC.Components.CreditInsufficientNotice.upgrade')}
        </Button>
      </div>
      <SystemSubscriptionPlansModal
        open={plansOpen}
        onClose={() => setPlansOpen(false)}
      />
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
export { useHistoryCreditExhausted } from './useHistoryCreditExhausted';
