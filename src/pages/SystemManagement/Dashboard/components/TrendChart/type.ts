export interface TrendChartProps {
  title: string;
  data: Array<{ date: string; value: number }>;
  height?: number;
  color?: string;
  tooltipName?: string;
}
