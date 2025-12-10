import WorkspaceLayout from '@/components/WorkspaceLayout';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';

export default function SpaceSkillManage() {
  // 工作空间
  // WorkspaceLayout
  const handleCreate = () => {
    console.log('创建技能');
  };

  return (
    <WorkspaceLayout
      title="技能管理"
      rightSuffixSlot={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          创建技能
        </Button>
      }
    >
      {Array.from({ length: 10 }).map((item: any, index: number) => (
        <div key={index}>{index}333</div>
      ))}
    </WorkspaceLayout>
  );
}
