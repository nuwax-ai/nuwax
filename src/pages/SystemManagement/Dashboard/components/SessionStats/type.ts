import type { StatCardProps } from '../StatCard/type';

export interface SessionStatsProps {
  stats: StatCardProps[];
  chartData: Array<{ date: string; value: number }>;
}
