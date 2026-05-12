import { dict } from '@/services/i18nRuntime';
import {
  apiCreateWithdrawApply,
  apiGetRevenueStats,
  apiGetWithdrawConfig,
} from '@/services/subscriptionService';
import { CalendarOutlined, DownloadOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Button, message, Modal, Statistic } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import WithdrawRecordModal from './components/WithdrawRecordModal';
import styles from './index.less';

const cx = classNames.bind(styles);

const EarningsSummary: React.FC = () => {
  const [withdrawRecordOpen, setWithdrawRecordOpen] = useState(false);

  // 获取提现配置（最低提现金额）
  const { data: withdrawConfigRes } = useRequest(apiGetWithdrawConfig);
  const minAmount = withdrawConfigRes?.data?.minAmount || 0;

  // 获取收益统计数据
  const {
    data: revenueData,
    loading: statsLoading,
    refresh: refreshStats,
  } = useRequest(apiGetRevenueStats);

  // 提现申请
  const { loading: withdrawLoading, run: runWithdraw } = useRequest(
    apiCreateWithdrawApply,
    {
      manual: true,
      onSuccess: (res) => {
        Modal.success({
          title: dict('PC.Pages.MorePage.MyEarnings.withdrawSuccessTitle'),
          content: (
            <div>
              <div>{dict('PC.Pages.MorePage.MyEarnings.withdrawSuccess')}</div>
              <Statistic
                title={dict('PC.Pages.MorePage.MyEarnings.withdrawableBalance')}
                value={res?.data?.amount || 0}
                precision={2}
                prefix="¥"
                valueStyle={{ fontSize: '18px', fontWeight: '600' }}
              />
            </div>
          ),
          okText: dict('PC.Common.ok'),
        });
        refreshStats();
      },
      onError: (err) => {
        message.error(err.message || '提现申请失败');
      },
    },
  );

  const stats = useMemo(() => {
    const data = revenueData?.data;
    const total = data?.totalRevenue || 0;
    const pending = data?.pendingAmount || 0;
    const withdrawn = data?.settledAmount || 0;

    return [
      {
        label: dict('PC.Pages.MorePage.MyEarnings.totalIncome'),
        value: total,
        hint: dict('PC.Pages.MorePage.MyEarnings.totalIncomeDesc'),
        color: 'var(--xagi-blue)',
      },
      {
        label: dict('PC.Pages.MorePage.MyEarnings.pendingSettlement'),
        value: pending,
        hint: dict('PC.Pages.MorePage.MyEarnings.pendingDesc'),
        color: 'var(--xagi-orange)',
      },
      {
        label: dict('PC.Pages.MorePage.MyEarnings.withdrawn'),
        value: withdrawn,
        hint: dict('PC.Pages.MorePage.MyEarnings.withdrawnDesc'),
        color: 'var(--xagi-color-text)',
      },
    ];
  }, [revenueData]);

  const pendingAmount = revenueData?.data?.pendingAmount || 0;

  return (
    <>
      <div className={cx(styles['earnings-summary'])}>
        {/* 统计卡片 */}
        <div className={cx(styles['stats-container'])}>
          {stats.map((item, index, arr) => (
            <React.Fragment key={item.label}>
              <div className={cx(styles['stat-card'])}>
                <Statistic
                  title={item.label}
                  value={item.value}
                  precision={2}
                  prefix="¥"
                  loading={statsLoading}
                  valueStyle={{
                    color: item.color,
                    fontSize: '24px',
                    fontWeight: '600',
                  }}
                />
                {item.hint && (
                  <div className={cx(styles['stat-hint'])}>{item.hint}</div>
                )}
              </div>
              {index < arr.length - 1 && <div className={cx(styles.divider)} />}
            </React.Fragment>
          ))}
        </div>

        {/* 提现操作区 */}
        <div className={cx(styles['withdraw-container'])}>
          <div className={cx(styles['balance-info'])}>
            <Statistic
              title={dict('PC.Pages.MorePage.MyEarnings.withdrawableBalance')}
              value={pendingAmount}
              precision={2}
              prefix="¥"
              loading={statsLoading}
            />
          </div>
          <div className={cx(styles['action-buttons'])}>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              className={cx(styles['withdraw-apply-btn'])}
              disabled={pendingAmount <= 0 || pendingAmount < minAmount}
              loading={withdrawLoading}
              onClick={runWithdraw}
            >
              {dict('PC.Pages.MorePage.MyEarnings.withdrawApply')}
            </Button>
            <Button
              icon={<CalendarOutlined />}
              className={cx(styles['withdraw-record-btn'])}
              onClick={() => setWithdrawRecordOpen(true)}
            >
              {dict('PC.Pages.MorePage.MyEarnings.withdrawRecord')}
            </Button>
          </div>
        </div>
      </div>
      <WithdrawRecordModal
        open={withdrawRecordOpen}
        onOpenChange={setWithdrawRecordOpen}
      />
    </>
  );
};

export default EarningsSummary;
