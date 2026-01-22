import { Line } from '@ant-design/plots';
import { Card, Radio } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';
import type { TrendChartProps } from './type';

const cx = classNames.bind(styles);

const TrendChart: React.FC<TrendChartProps> = ({
  title,
  data,
  height = 280,
  color = '#1890ff',
  tooltipName = '数据',
}) => {
  const [period, setPeriod] = useState<'7d' | '30d' | 'month'>('7d');

  const config = React.useMemo(
    () => ({
      data,
      xField: 'date',
      yField: 'value',
      height,
      shapeField: 'smooth',
      scale: {
        y: {
          domainMin: 0,
        },
      },
      style: {
        lineWidth: 2.5,
        stroke: color,
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
        name: tooltipName,
        value: d.value.toLocaleString(),
      }),
    }),
    [data, height, color, tooltipName],
  );
  return (
    <Card className={cx(styles['trend-chart'])} bordered={false}>
      <div className={cx(styles['trend-chart-header'])}>
        <h3 className={cx(styles['trend-chart-title'])}>{title}</h3>
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
      <div className={cx(styles['trend-chart-content'])}>
        <Line {...config} />
      </div>
    </Card>
  );
};

export default TrendChart;
