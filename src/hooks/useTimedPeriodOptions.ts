import { t } from '@/services/i18nRuntime';
import type { TaskCronInfo } from '@/types/interfaces/agentTask';
import { CUSTOM_CRON_TYPE, resolveTimedPeriod } from '@/utils/timedPeriod';
import { useEffect, useState, type Key } from 'react';
import { useRequest } from 'umi';

export function useTimedPeriodOptions(
  loadOptions: () => Promise<unknown>,
  value: string | undefined,
  onChange?: (value: string) => void,
  allowSpecificTime = true,
) {
  const [data, setData] = useState<TaskCronInfo[]>([]);
  const { run } = useRequest(loadOptions, {
    manual: true,
    onSuccess: (result: unknown) => setData(result as TaskCronInfo[]),
  });
  useEffect(() => {
    run();
  }, []);
  const selected = resolveTimedPeriod(data, value);
  // 仅新建空值播种默认周期；接口加载与编辑回显不触发表单变更。
  useEffect(() => {
    if (!value && selected.cron) onChange?.(selected.cron);
  }, [value, selected.cron, onChange]);
  const typeNameList = data.map((group) => ({
    label: group.typeName,
    value: group.typeName,
  }));
  if (allowSpecificTime)
    typeNameList.push({
      label: t('PC.Pages.SpaceTaskTimedPeriodSelector.specificTime'),
      value: 'SpecificTime',
    });
  if (selected.typeName === CUSTOM_CRON_TYPE)
    typeNameList.push({
      label: t('PC.Components.TimedPeriodSelector.customPeriod'),
      value: CUSTOM_CRON_TYPE,
    });
  return {
    typeName: selected.typeName,
    typeCron: selected.cron,
    typeNameList,
    typeCronList: selected.items.map((item) => ({
      label: item.desc,
      value: item.cron,
    })),
    isCustomCron: selected.typeName === CUSTOM_CRON_TYPE,
    handleChangeTypeName: (name: Key) => {
      if (name === CUSTOM_CRON_TYPE) return;
      if (name === 'SpecificTime') onChange?.('SpecificTime');
      else
        onChange?.(
          data.find((group) => group.typeName === name)?.items[0]?.cron || '',
        );
    },
    handleChangeTypeCron: (cron: Key) => onChange?.(String(cron)),
  };
}
