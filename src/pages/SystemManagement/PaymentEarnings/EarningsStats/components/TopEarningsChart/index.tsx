import { dict } from '@/services/i18nRuntime';
import { Column } from '@ant-design/plots';
import { Card, Empty } from 'antd';
import React, { useMemo } from 'react';
import styles from './index.less';

interface TopEarningsChartProps {
  title: string;
  data: Array<{ userName: string | null; amount: number }>;
  loading?: boolean;
}

const TopEarningsChart: React.FC<TopEarningsChartProps> = ({
  title,
  data,
  loading,
}) => {
  const config = useMemo(
    () => ({
      data: data?.map((item) => ({
        ...item,
        // 这里的 userName 可能为 null (根据接口示例)，做个兜底展示
        displayName: item.userName || '-',
      })),
      xField: 'displayName',
      yField: 'amount',
      padding: [50, 20, 80, 60],
      style: {
        maxWidth: 36,
        radiusTopLeft: 8,
        radiusTopRight: 8,
        fill: 'linear-gradient(180deg, #5b6df0 0%, #a4c2ff 100%)',
      },
      label: {
        text: (d: any) => `¥${(d.amount / 1000).toFixed(1)}K`,
        style: {
          fill: 'rgba(0, 0, 0, 0.85)',
          fontSize: 12,
          fontWeight: 600,
          dy: -20,
        },
      },
      scale: {
        y: {
          nice: true,
        },
      },
      axis: {
        x: {
          label: {
            style: {
              fill: 'rgba(0, 0, 0, 0.85)',
              fontSize: 13,
              fontWeight: 500,
            },
          },
          line: {
            style: {
              stroke: '#bfbfbf',
              lineWidth: 1,
            },
          },
        },
        y: {
          label: {
            formatter: (v: number) => `¥${v.toLocaleString()}`,
            style: {
              fill: 'rgba(0, 0, 0, 0.45)',
              fontSize: 11,
            },
          },
          gridLine: {
            style: {
              lineDash: [4, 4],
              stroke: '#f0f0f0',
            },
          },
        },
      },
      tooltip: {
        showMarkers: false,
        title: (items: any) => `${items.displayName}`,
        items: [
          (d: any) => ({
            name: dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Stats.chartTotalRevenue',
            ),
            value: `¥${d.amount.toLocaleString()}`,
            color: '#52c41a',
          }),
        ],
      },
    }),
    [data],
  );

  return (
    <Card
      className={styles.topEarningsChart}
      loading={loading}
      variant="borderless"
    >
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>{title}</h3>
      </div>
      <div
        style={{
          height: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {data && data.length > 0 ? <Column {...config} /> : <Empty />}
      </div>
    </Card>
  );
};

export default TopEarningsChart;
