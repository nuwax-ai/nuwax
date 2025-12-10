import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React from 'react';

interface RightSuffixSlotProps {
  // 创建技能回调
  onCreate?: () => void;
}
const RightSuffixSlot: React.FC<RightSuffixSlotProps> = ({
  onCreate = () => {},
}) => {
  // 创建技能按钮点击
  const handleCreate = () => {
    onCreate?.();
  };
  return (
    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
      创建技能
    </Button>
  );
};

export default RightSuffixSlot;
