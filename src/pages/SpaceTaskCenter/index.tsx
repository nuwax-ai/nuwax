import WorkspaceLayout from '@/components/WorkspaceLayout';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useRef, useState } from 'react';
import { useParams } from 'umi';
import CenterProTable, { CenterProTableRef } from './CenterProTable';
import CreateTimedTask from './CreateTimedTask';

const SpaceTaskCenter: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);

  // 表格区域 ref（用于创建后刷新表格数据）
  const centerProTableRef = useRef<CenterProTableRef>(null);

  // 创建任务
  const [openCreateTask, setOpenCreateTask] = useState(false);
  const handleCreateTask = () => {
    setOpenCreateTask(true);
  };
  const handleCreateTaskConfirm = () => {
    // 查询任务列表
    centerProTableRef.current?.reload();
  };

  return (
    <WorkspaceLayout
      title="任务中心"
      hideScroll={true}
      rightSlot={
        <Button
          key="create"
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateTask}
        >
          创建任务
        </Button>
      }
    >
      {/* 主要内容区域 */}
      <CenterProTable ref={centerProTableRef} />
      {/* 创建任务弹窗 */}
      <CreateTimedTask
        spaceId={spaceId}
        open={openCreateTask}
        onCancel={() => setOpenCreateTask(false)}
        onConfirm={handleCreateTaskConfirm}
      />
    </WorkspaceLayout>
  );
};

export default SpaceTaskCenter;
