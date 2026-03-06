export interface TrendChartProps {
  title: string;
  data: Array<{ date: string; value: number }>;
  height?: number;
  color?: string;
  tooltipName?: string;
  loading?: boolean;
  period?: '7d' | '30d' | 'month';
  onPeriodChange?: (period: '7d' | '30d' | 'month') => void;
  periods?: Array<{ label: string; value: '7d' | '30d' | 'month' }>;
}
