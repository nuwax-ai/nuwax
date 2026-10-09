import type { TaskCronInfo } from '@/types/interfaces/agentTask';

export const CUSTOM_CRON_TYPE = 'CustomCron';

/** 回显只匹配原值；不在预设内的表达式绝不降级为第一项。 */
export function resolveTimedPeriod(data: TaskCronInfo[], value?: string) {
  if (value === 'SpecificTime')
    return { typeName: value, cron: value, items: [] };
  const selected = value
    ? data.find((group) => group.items.some((item) => item.cron === value))
    : data[0];
  if (selected)
    return {
      typeName: selected.typeName,
      cron: value || selected.items[0]?.cron || '',
      items: selected.items,
    };
  return {
    typeName: value ? CUSTOM_CRON_TYPE : '',
    cron: value || '',
    items: [],
  };
}
