import SystemSubscriptionPlansModal from '@/components/business-component/CreditInsufficientNotice/SystemSubscriptionPlansModal';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { EVENT_TYPE } from '@/constants/event.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetCreditSummary,
  apiGetMySubscription,
} from '@/services/subscriptionService';
import { BizTypeEnum } from '@/types/interfaces/subscription';
import eventBus from '@/utils/eventBus';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const SparkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M8 1.2 9.3 6.1 14.2 7.4 9.3 8.7 8 13.6 6.7 8.7 1.8 7.4 6.7 6.1 8 1.2Z"
      fill="#E0A106"
    />
  </svg>
);

const DiamondIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M3.2 6.2 8 13.4 12.8 6.2 10.6 3.2H5.4L3.2 6.2Z"
      fill="none"
      stroke="#C4A574"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path d="M3.2 6.2h9.6" stroke="#C4A574" strokeWidth="1.2" />
  </svg>
);

const ChevronIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path
      d="M4.2 2.4 7.8 6 4.2 9.6"
      fill="none"
      stroke="#C4A574"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** 侧栏底部积分：进入布局即拉总积分，升级按钮打开系统套餐弹窗 */
const SidebarCreditCard: React.FC = () => {
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const showCredits = tenantConfigInfo?.enableSubscription !== 0;
  const [totalCredit, setTotalCredit] = useState<number | null>(null);
  const [planName, setPlanName] = useState('');
  const [plansOpen, setPlansOpen] = useState(false);

  useEffect(() => {
    if (!showCredits) {
      return;
    }
    let cancelled = false;
    apiGetCreditSummary({ silentPolling: true })
      .then((result) => {
        if (cancelled || result?.code !== SUCCESS_CODE) {
          return;
        }
        setTotalCredit(result.data?.totalCredit ?? 0);
      })
      .catch((error: unknown) => {
        console.error('[SidebarCreditCard] 查询积分总览失败', error);
      });
    apiGetMySubscription({ bizType: BizTypeEnum.System })
      .then((result) => {
        if (cancelled || result?.code !== SUCCESS_CODE) {
          return;
        }
        const current = result.data?.currentSubscription;
        setPlanName(current?.plan?.name || current?.planName || '');
      })
      .catch((error: unknown) => {
        console.error('[SidebarCreditCard] 查询当前套餐失败', error);
      });
    return () => {
      cancelled = true;
    };
  }, [showCredits]);

  useEffect(() => {
    const handleSummaryUpdated = (data: { totalCredit?: number }) => {
      if (typeof data?.totalCredit === 'number') {
        setTotalCredit(data.totalCredit);
      }
    };
    eventBus.on(EVENT_TYPE.CreditSummaryUpdated, handleSummaryUpdated);
    return () => {
      eventBus.off(EVENT_TYPE.CreditSummaryUpdated, handleSummaryUpdated);
    };
  }, []);

  if (!showCredits) {
    return null;
  }

  const exchangeDesc = tenantConfigInfo?.creditExchangeDesc;

  return (
    <>
      <div className={cx(styles.card)}>
        <div className={cx(styles['credit-row'])}>
          <span className={cx(styles['credit-main'])}>
            <SparkIcon />
            <span className={cx(styles['credit-value'])}>
              {totalCredit === null ? '--' : totalCredit}
            </span>
          </span>
          {planName ? (
            <span className={cx(styles['plan-name'])}>
              <span className={cx(styles['plan-name-badge'])}>{planName}</span>
              {exchangeDesc ? (
                <Tooltip title={exchangeDesc}>
                  <InfoCircleOutlined className={cx(styles['plan-info'])} />
                </Tooltip>
              ) : null}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className={cx(styles['upgrade-button'])}
          onClick={() => setPlansOpen(true)}
        >
          <DiamondIcon />
          <span className={cx(styles['upgrade-text'])}>
            {dict('PC.Layouts.SidebarCredit.upgradeBenefits')}
          </span>
          <ChevronIcon />
        </button>
      </div>
      <SystemSubscriptionPlansModal
        open={plansOpen}
        onClose={() => setPlansOpen(false)}
      />
    </>
  );
};

export default SidebarCreditCard;
