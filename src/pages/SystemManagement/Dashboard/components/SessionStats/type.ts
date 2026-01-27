import type { StatCardProps } from '../StatCard/type';

export interface SessionStatsProps {
  stats: StatCardProps[];
  chartData: Array<{ date: string; value: number }>;
  loading?: boolean;
  period?: '7d' | '30d' | 'month';
  onPeriodChange?: (period: '7d' | '30d' | 'month') => void;
}
