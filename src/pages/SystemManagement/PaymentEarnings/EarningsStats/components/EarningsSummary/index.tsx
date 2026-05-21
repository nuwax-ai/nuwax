import { dict } from '@/services/i18nRuntime';
import { Card, Col, Row, Statistic } from 'antd';
import React from 'react';
import styles from './index.less';

export interface EarningsSummaryData {
  totalEarnings: number;
  monthlyEarnings: number;
  pendingSettlement: number;
  todayEarnings: number;
}

interface EarningsSummaryProps {
  data: EarningsSummaryData;
  loading?: boolean;
}

interface StatItemProps {
  title: string;
  value: number;
  prefix?: string;
  loading?: boolean;
}

const StatItem: React.FC<StatItemProps> = ({
  title,
  value,
  prefix,
  loading,
}) => (
  <Card className={styles.statCard} loading={loading}>
    <Statistic
      title={title}
      value={value}
      prefix={prefix}
      precision={typeof value === 'number' && !Number.isInteger(value) ? 2 : 0}
    />
  </Card>
);

const EarningsSummary: React.FC<EarningsSummaryProps> = ({ data, loading }) => {
  return (
    <Row className={styles.earningsSummary} gutter={[16, 16]}>
      <Col span={6}>
        <StatItem
          title={dict(
            'PC.Pages.SystemManagement.PaymentEarnings.Stats.totalRevenue',
          )}
          value={data.totalEarnings}
          prefix="¥"
          loading={loading}
        />
      </Col>
      <Col span={6}>
        <StatItem
          title={dict(
            'PC.Pages.SystemManagement.PaymentEarnings.Stats.todayRevenue',
          )}
          value={data.todayEarnings}
          prefix="¥"
          loading={loading}
        />
      </Col>
      <Col span={6}>
        <StatItem
          title={dict(
            'PC.Pages.SystemManagement.PaymentEarnings.Stats.monthRevenue',
          )}
          value={data.monthlyEarnings}
          prefix="¥"
          loading={loading}
        />
      </Col>
      <Col span={6}>
        <StatItem
          title={dict(
            'PC.Pages.SystemManagement.PaymentEarnings.Stats.pendingAmount',
          )}
          value={data.pendingSettlement}
          prefix="¥"
          loading={loading}
        />
      </Col>
    </Row>
  );
};

export default EarningsSummary;
