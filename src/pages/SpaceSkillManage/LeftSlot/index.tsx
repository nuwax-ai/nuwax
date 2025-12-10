import ButtonToggle from '@/components/ButtonToggle';
import { FILTER_STATUS } from '@/constants/space.constants';
import { FilterStatusEnum } from '@/types/enums/space';
import { useState } from 'react';

interface LeftSlotProps {
  // 默认状态
  defaultStatus?: FilterStatusEnum;
  // 状态变化回调
  onStatusChange?: (value: FilterStatusEnum) => void;
}

const LeftSlot: React.FC<LeftSlotProps> = ({
  defaultStatus = FilterStatusEnum.All,
  onStatusChange,
}) => {
  // 状态
  const [status, setStatus] = useState<FilterStatusEnum>(defaultStatus);
  // 处理状态变化
  const handleChangeStatus = (value: string | number | (string | number)[]) => {
    setStatus(value as FilterStatusEnum);
    onStatusChange?.(value as FilterStatusEnum);
  };

  return (
    <ButtonToggle
      options={FILTER_STATUS}
      value={status}
      onChange={handleChangeStatus}
    />
  );
};

export default LeftSlot;
