import { dict } from '@/services/i18nRuntime';
import { Card, Col, Row, Statistic } from 'antd';
import React from 'react';

interface WithdrawalStatsProps {
  pendingCount: number;
  totalApproved: number;
  totalCount: number;
}

const WithdrawalStats: React.FC<WithdrawalStatsProps> = ({
  pendingCount,
  totalApproved,
  totalCount,
}) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col span={8}>
        <Card>
          <Statistic
            title={dict('PC.Pages.SystemWithdrawal.statPending')}
            value={pendingCount}
            suffix={dict('PC.Common.Global.items')}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic
            title={dict('PC.Pages.SystemWithdrawal.statApproved')}
            value={totalApproved}
            precision={0}
            prefix="¥"
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic
            title={dict('PC.Pages.SystemWithdrawal.statTotal')}
            value={totalCount}
            suffix={dict('PC.Common.Global.items')}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default WithdrawalStats;
