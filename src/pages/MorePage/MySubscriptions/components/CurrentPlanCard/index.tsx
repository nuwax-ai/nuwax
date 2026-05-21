import { dict } from '@/services/i18nRuntime';
import {
  MyPlanPeriodEnum,
  MySubscriptionItem,
} from '@/types/interfaces/subscription';
import { CheckOutlined } from '@ant-design/icons';
import { Statistic } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React from 'react';
import {
  getCreditsLabel,
  getFeeLabel,
  getPeriodRenewText,
  getStatusText,
} from '../../utils';
import styles from './index.less';

const cx = classNames.bind(styles);

interface CurrentPlanCardProps {
  planInfo: MySubscriptionItem;
}

/**
 * 当前订阅计划卡片组件
 */
const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({ planInfo }) => {
  // 格式化到期时间展示
  const renderValidity = () => {
    if (!planInfo.endTime) {
      return (
        <div className={cx(styles['plan-validity'])}>
          {dict('PC.Pages.MorePage.MySubscriptions.validityForever')}
        </div>
      );
    }

    // 格式化日期 YYYY-MM-DD
    const dateStr = dayjs(planInfo.endTime).format('YYYY-MM-DD');
    const periodText = getPeriodRenewText(planInfo.plan.period);

    return (
      <div className={cx(styles['plan-validity'])}>
        {dict(
          'PC.Pages.MorePage.MySubscriptions.validityTemplate',
          dateStr,
          periodText,
        )}
      </div>
    );
  };

  return (
    <>
      {/* 背景装饰元素 */}
      <div className={cx(styles['current-plan-card'])}>
        <div className={cx(styles['bg-decoration-1'])} />
        <div className={cx(styles['bg-decoration-2'])} />
        <div className={cx(styles['card-content'])}>
          <div className={cx(styles['plan-header'])}>
            <div className={cx(styles['header-left'])}>
              <div className={cx(styles['current-plan-label'])}>
                {/* 当前订阅 */}
                {dict('PC.Pages.MorePage.MySubscriptions.currentPlan')}
              </div>
              {/* 计划名称 */}
              <div className={cx(styles['plan-name'])}>{planInfo.planName}</div>
              {/* 到期时间 */}
              {renderValidity()}
            </div>
            <div className={cx(styles['plan-status'])}>
              <CheckOutlined className={cx(styles['status-icon'])} />
              {getStatusText(planInfo.status)}
            </div>
          </div>

          {planInfo.plan.period !== MyPlanPeriodEnum.Forever && (
            <div className={cx(styles['plan-meta'])}>
              <div className={cx(styles['plan-meta-item'])}>
                <span className={cx(styles['meta-label'])}>
                  {getFeeLabel(planInfo.plan.period)}
                </span>
                <span className={cx(styles['meta-value'])}>
                  <Statistic
                    value={planInfo.plan.price}
                    valueStyle={{ color: '#fff' }}
                    prefix="¥"
                    precision={2}
                  />
                </span>
              </div>
              <div className={cx(styles['plan-meta-item'])}>
                <span className={cx(styles['meta-label'])}>
                  {getCreditsLabel()}
                </span>
                <span className={cx(styles['meta-value'])}>
                  <Statistic
                    value={planInfo.plan.creditAmount}
                    valueStyle={{ color: '#fff' }}
                  />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CurrentPlanCard;
