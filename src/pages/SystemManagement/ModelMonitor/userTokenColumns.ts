import { dict } from '@/services/i18nRuntime';
import type { UserTokenMetrics } from '@/types/interfaces/systemManage';
import { formatDecimal, formatInteger } from '@/utils/numberFormat';
import type { TableColumnsType } from 'antd';

export function userTokenColumns<
  T extends UserTokenMetrics,
>(): TableColumnsType<T> {
  return [
    ['totalTokens', 'totalTokens'],
    ['inputTokens', 'nonCacheInputTokens'],
    ['cacheInputTokens', 'cacheInputTokens'],
    ['outputTokens', 'outputTokens'],
    ['callCount', 'colCallCount'],
    ['creditAmount', 'creditConsumed'],
  ].map(([field, label]) => ({
    title: dict(`PC.Pages.ModelMonitor.${label}`),
    dataIndex: field,
    key: field,
    width: 155,
    align: 'right',
    render: (_, record) => {
      const value = record[field as keyof UserTokenMetrics];
      return value === null || value === undefined
        ? '-'
        : field === 'creditAmount'
        ? formatDecimal(value)
        : formatInteger(value);
    },
  }));
}
