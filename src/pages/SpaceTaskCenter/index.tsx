import WorkspaceLayout from '@/components/WorkspaceLayout';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { TaskInfo } from '@/types/interfaces/library';
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

  // 模式
  const [mode, setMode] = useState<CreateUpdateModeEnum>(
    CreateUpdateModeEnum.Create,
  );

  // 任务信息
  const [taskInfo, setTaskInfo] = useState<TaskInfo | null>(null);

  // 创建任务
  const handleCreateTask = () => {
    setMode(CreateUpdateModeEnum.Create);
    setTaskInfo(null);
    setOpenCreateTask(true);
  };

  // 创建任务确认
  const handleCreateTaskConfirm = () => {
    // 查询任务列表
    centerProTableRef.current?.reload();
  };

  // 编辑任务
  const handleEditTask = (info: TaskInfo) => {
    setMode(CreateUpdateModeEnum.Update);
    setTaskInfo(info);
    setOpenCreateTask(true);
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
      <CenterProTable ref={centerProTableRef} onEdit={handleEditTask} />
      {/* 创建任务弹窗 */}
      <CreateTimedTask
        spaceId={spaceId}
        mode={mode}
        info={taskInfo}
        open={openCreateTask}
        onCancel={() => setOpenCreateTask(false)}
        onConfirm={handleCreateTaskConfirm}
      />
    </WorkspaceLayout>
  );
};

export default SpaceTaskCenter;
