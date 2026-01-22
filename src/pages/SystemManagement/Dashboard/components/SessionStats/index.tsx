import { Line } from '@ant-design/plots';
import { Card, Col, Radio, Row } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import StatCard from '../StatCard';
import styles from './index.less';
import type { SessionStatsProps } from './type';

const cx = classNames.bind(styles);

const SessionStats: React.FC<SessionStatsProps> = ({ stats, chartData }) => {
  const [period, setPeriod] = useState<'7d' | '30d' | 'month'>('7d');

  const chartConfig = React.useMemo(
    () => ({
      data: chartData,
      xField: 'date',
      yField: 'value',
      height: 280,
      shapeField: 'smooth',
      scale: {
        y: {
          domainMin: 0,
        },
      },
      style: {
        lineWidth: 2.5,
        stroke: '#52c41a',
      },
      axis: {
        x: {
          label: {
            style: {
              fill: 'rgba(0, 0, 0, 0.45)',
              fontSize: 12,
            },
          },
          line: {
            style: {
              stroke: '#d9d9d9',
            },
          },
          tick: {
            length: 4,
            style: {
              stroke: '#d9d9d9',
            },
          },
        },
        y: {
          label: {
            style: {
              fill: 'rgba(0, 0, 0, 0.45)',
              fontSize: 12,
            },
          },
          grid: {
            line: {
              style: {
                lineWidth: 1,
                lineDash: [4, 4],
                stroke: '#f0f0f0',
              },
            },
          },
        },
      },
      interaction: {
        tooltip: {
          marker: false,
        },
      },
      tooltip: (d: { date: string; value: number }) => ({
        name: '新增会话',
        value: d.value.toLocaleString(),
      }),
    }),
    [chartData],
  );

  return (
    <div className={cx(styles['session-stats'])}>
      <Row gutter={[16, 16]}>
        {stats.map((stat, index) => (
          <Col key={index} xs={24} sm={12} md={12} lg={12} xl={12}>
            <StatCard {...stat} />
          </Col>
        ))}
      </Row>
      <Card className={cx(styles['session-chart'])} bordered={false}>
        <div className={cx(styles['chart-header'])}>
          <h3 className={cx(styles['chart-title'])}>七日新增会话趋势</h3>
          <Radio.Group
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            size="small"
            className={cx(styles['period-selector'])}
          >
            <Radio.Button value="7d">7天</Radio.Button>
            <Radio.Button value="30d">30天</Radio.Button>
            <Radio.Button value="month">按月</Radio.Button>
          </Radio.Group>
        </div>
        <Line {...chartConfig} />
      </Card>
    </div>
  );
};

export default SessionStats;
