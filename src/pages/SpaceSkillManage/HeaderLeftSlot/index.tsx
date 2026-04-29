import ButtonToggle from '@/components/ButtonToggle';
import SelectList from '@/components/custom/SelectList';
import { SKILL_USAGE_SCENARIO_LIST } from '@/constants/library.constants';
import { FILTER_STATUS } from '@/constants/space.constants';
import useSearchParamsCustom from '@/hooks/useSearchParamsCustom';
import { dict } from '@/services/i18nRuntime';
import { AgentTypeEnum, FilterStatusEnum } from '@/types/enums/space';
import { useEffect, useState } from 'react';

type IQuery = 'status' | 'usageScenario';

const FILTER_USAGE_SCENARIO = [
  {
    label: dict('PC.Pages.SpaceSkillManage.HeaderLeftSlot.allUsageScenarios'),
    value: AgentTypeEnum.All,
  },
  ...SKILL_USAGE_SCENARIO_LIST,
];

const HeaderLeftSlot: React.FC = () => {
  const { searchParams, setSearchParamsCustom } =
    useSearchParamsCustom<IQuery>();
  // 状态
  const [status, setStatus] = useState<FilterStatusEnum>(
    Number(searchParams.get('status')) || FilterStatusEnum.All,
  );
  // 适用范围
  const [usageScenario, setUsageScenario] = useState<AgentTypeEnum>(
    (searchParams.get('usageScenario') as AgentTypeEnum) || AgentTypeEnum.All,
  );

  // 处理状态变化
  const handleChangeStatus = (value: string | number | (string | number)[]) => {
    setStatus(value as FilterStatusEnum);
    setSearchParamsCustom('status', value.toString());
  };

  // 处理适用范围变化
  const handleChangeUsageScenario = (value: any) => {
    setUsageScenario(value as AgentTypeEnum);
    setSearchParamsCustom('usageScenario', value.toString());
  };

  // 监听 URL 参数变化，同步更新本地状态
  useEffect(() => {
    const urlStatus =
      Number(searchParams.get('status')) || FilterStatusEnum.All;
    setStatus(urlStatus);

    const urlUsageScenario =
      (searchParams.get('usageScenario') as AgentTypeEnum) || AgentTypeEnum.All;
    setUsageScenario(urlUsageScenario);
  }, [searchParams]);

  return (
    <>
      {/* 适用范围 */}
      <SelectList
        options={FILTER_USAGE_SCENARIO}
        value={usageScenario}
        onChange={handleChangeUsageScenario}
        style={{ width: 130 }}
      />
      {/* 状态 */}
      <ButtonToggle
        options={FILTER_STATUS}
        value={status}
        onChange={handleChangeStatus}
      />
    </>
  );
};

export default HeaderLeftSlot;
