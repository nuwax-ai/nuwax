import { plotAppearance } from '@/features/themes/adapters';
import { useAppTheme } from '@/features/themes/useAppTheme';
import { dict } from '@/services/i18nRuntime';
import { Line } from '@ant-design/plots';
import { useSize } from 'ahooks';
import { Card, Radio, Skeleton } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useRef } from 'react';
import styles from './index.less';
import type { TrendChartProps } from './type';

const cx = classNames.bind(styles);

const TrendChart: React.FC<TrendChartProps> = ({
  title,
  data,
  height = 280,
  color = '#1890ff',
  tooltipName = dict('PC.Pages.SystemDashboard.chartTooltipData'),
  loading = false,
  period = '7d',
  onPeriodChange,
  periods = [
    { label: dict('PC.Pages.SystemDashboard.period7d'), value: '7d' },
    { label: dict('PC.Pages.SystemDashboard.period30d'), value: '30d' },
    {
      label: dict('PC.Pages.SystemDashboard.periodMonth'),
      value: 'month',
    },
  ],
}) => {
  const appearance = useAppTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const size = useSize(containerRef);

  const config = useMemo(
    () => ({
      theme: plotAppearance(appearance),
      data,
      xField: 'date',
      yField: 'value',
      width: size?.width,
      height,
      autoFit: false,
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
              fill: appearance.tokens['text.secondary'],
              fontSize: 12,
            },
          },
          line: {
            style: {
              stroke: appearance.tokens['border.default'],
            },
          },
          tick: {
            length: 4,
            style: {
              stroke: appearance.tokens['border.default'],
            },
          },
        },
        y: {
          label: {
            style: {
              fill: appearance.tokens['text.secondary'],
              fontSize: 12,
            },
          },
          grid: {
            line: {
              style: {
                lineWidth: 1,
                lineDash: [4, 4],
                stroke: appearance.tokens['border.default'],
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
    [data, color, tooltipName, size?.width, appearance],
  );
  return (
    <Card className={cx(styles['trend-chart'])} variant="borderless">
      <div className={cx(styles['trend-chart-header'])}>
        <h3 className={cx(styles['trend-chart-title'])}>{title}</h3>
        <Radio.Group
          value={period}
          onChange={(e) => onPeriodChange?.(e.target.value)}
          size="small"
          className={cx(styles['period-selector'])}
        >
          {periods.map((p) => (
            <Radio.Button key={p.value} value={p.value}>
              {p.label}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>
      <div
        className={cx(styles['trend-chart-content'])}
        style={{ height, position: 'relative' }}
        ref={containerRef}
      >
        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          <Line {...config} />
        )}
      </div>
    </Card>
  );
};

export default TrendChart;
