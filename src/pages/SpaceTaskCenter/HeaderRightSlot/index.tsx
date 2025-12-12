import WorkspaceSearch from '@/components/WorkspaceLayout/components/WorkspaceSearch';
import useSearchParamsCustom from '@/hooks/useSearchParamsCustom';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import React, { useState } from 'react';

type IQuery = 'keyword';

interface HeaderRightSlotProps {
  // 创建任务回调
  onCreate?: () => void;
}
const HeaderRightSlot: React.FC<HeaderRightSlotProps> = ({
  onCreate = () => {},
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

  return (
    <Space>
      <WorkspaceSearch
        value={keyword}
        onChange={handleSearchChange}
        onClear={handleSearchClear}
      />

      <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
        创建任务
      </Button>
    </Space>
  );
};

export default HeaderRightSlot;
