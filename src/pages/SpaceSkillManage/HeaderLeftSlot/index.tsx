import ButtonToggle from '@/components/ButtonToggle';
import SelectList from '@/components/custom/SelectList';
import {
  CREATE_LIST,
  FILTER_STATUS,
  LIBRARY_ALL_TYPE,
} from '@/constants/space.constants';
import useSearchParamsCustom from '@/hooks/useSearchParamsCustom';
import {
  ComponentTypeEnum,
  CreateListEnum,
  FilterStatusEnum,
} from '@/types/enums/space';
import { Space } from 'antd';
import { useState } from 'react';

type IQuery = 'type' | 'create' | 'status';

const HeaderLeftSlot: React.FC = () => {
  const { searchParams, setSearchParamsCustom } =
    useSearchParamsCustom<IQuery>();
  // 类型
  const [type, setType] = useState<ComponentTypeEnum>(
    searchParams.get('type') || ComponentTypeEnum.All_Type,
  );
  // 处理类型变化
  const handleChangeType = (value: React.Key) => {
    setType(value as ComponentTypeEnum);
    setSearchParamsCustom('type', value.toString());
  };

  // 创建方式
  const [create, setCreate] = useState<CreateListEnum>(
    Number(searchParams.get('create')) || CreateListEnum.All_Person,
  );
  // 处理创建方式变化
  const handleChangeCreate = (value: string | number | (string | number)[]) => {
    setCreate(value as CreateListEnum);
    setSearchParamsCustom('create', value.toString());
  };

  // 状态
  const [status, setStatus] = useState<FilterStatusEnum>(
    Number(searchParams.get('status')) || FilterStatusEnum.All,
  );
  // 处理状态变化
  const handleChangeStatus = (value: string | number | (string | number)[]) => {
    setStatus(value as FilterStatusEnum);
    setSearchParamsCustom('status', value.toString());
  };

  return (
    <Space>
      {/* 类型 */}
      <SelectList
        value={type}
        options={LIBRARY_ALL_TYPE}
        onChange={(value) => handleChangeType(value)}
      />
      {/* 创建方式 单选模式 */}
      <ButtonToggle
        options={CREATE_LIST}
        value={create}
        onChange={handleChangeCreate}
      />
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
