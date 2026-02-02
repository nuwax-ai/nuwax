import ButtonToggle from '@/components/ButtonToggle';
import { FILTER_STATUS } from '@/constants/space.constants';
import useSearchParamsCustom from '@/hooks/useSearchParamsCustom';
import { FilterStatusEnum } from '@/types/enums/space';
import { Space } from 'antd';
import { useEffect, useState } from 'react';

type IQuery = 'status';

const HeaderLeftSlot: React.FC = () => {
  const { searchParams, setSearchParamsCustom } =
    useSearchParamsCustom<IQuery>();
  // 状态
  const [status, setStatus] = useState<FilterStatusEnum>(
    Number(searchParams.get('status')) || FilterStatusEnum.All,
  );
  // 处理状态变化
  const handleChangeStatus = (value: string | number | (string | number)[]) => {
    setStatus(value as FilterStatusEnum);
    setSearchParamsCustom('status', value.toString());
  };

  // 监听 URL 参数变化，同步更新本地状态
  useEffect(() => {
    const urlStatus =
      Number(searchParams.get('status')) || FilterStatusEnum.All;
    setStatus(urlStatus);
  }, [searchParams]);

  return (
    <Space>
      {/* 状态 */}
      <ButtonToggle
        options={FILTER_STATUS}
        value={status}
        onChange={handleChangeStatus}
      />
    </Space>
  );
};

export default HeaderLeftSlot;
