import CustomPopover from '@/components/CustomPopover';
import WorkspaceSearch from '@/components/WorkspaceLayout/components/WorkspaceSearch';
import { SKILL_ALL_RESOURCE } from '@/constants/space.constants';
import useSearchParamsCustom from '@/hooks/useSearchParamsCustom';
import { CreateSkillWayEnum } from '@/types/enums/space';
import { CustomPopoverItem } from '@/types/interfaces/common';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import React, { useState } from 'react';

type IQuery = 'keyword';

interface HeaderRightSlotProps {
  // 创建技能回调
  onCreate?: () => void;
  // 导入技能回调
  onImport?: () => void;
}
const HeaderRightSlot: React.FC<HeaderRightSlotProps> = ({
  onCreate = () => {},
  onImport = () => {},
}) => {
  const { searchParams, setSearchParamsCustom } =
    useSearchParamsCustom<IQuery>();
  // 搜索关键词
  const [keyword, setKeyword] = useState<string>(
    searchParams.get('keyword') || '',
  );

  // 搜索关键词变化
  const handleSearchChange = (value: string) => {
    setKeyword(value);
    setSearchParamsCustom('keyword', value);
  };

  // 搜索关键词清除
  const handleSearchClear = () => {
    setKeyword('');
    setSearchParamsCustom('keyword', '');
  };

  const handleClickPopoverItem = (item: CustomPopoverItem) => {
    const { value: type } = item;
    switch (type) {
      case CreateSkillWayEnum.Create:
        onCreate?.();
        break;
      case CreateSkillWayEnum.Import:
        onImport?.();
        break;
    }
  };

  return (
    <Space>
      <WorkspaceSearch
        value={keyword}
        onChange={handleSearchChange}
        onClear={handleSearchClear}
      />
      <CustomPopover list={SKILL_ALL_RESOURCE} onClick={handleClickPopoverItem}>
        <Button type="primary" icon={<PlusOutlined />}>
          技能
        </Button>
      </CustomPopover>
    </Space>
  );
};

export default HeaderRightSlot;
