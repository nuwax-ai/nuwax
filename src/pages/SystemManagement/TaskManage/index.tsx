import WorkspaceLayout from '@/components/WorkspaceLayout';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { TaskInfo } from '@/types/interfaces/library';
import { useRef, useState } from 'react';
import CenterProTable, { CenterProTableRef } from './CenterProTable';
import CreateTimedTask from './CreateTimedTask';

const TaskManage: React.FC = () => {
  const spaceId = 836; // 系统管理下固定空间 ID

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
    <WorkspaceLayout title="任务管理" hideScroll={true}>
      {/* 主要内容区域 */}
      <CenterProTable
        ref={centerProTableRef}
        onEdit={handleEditTask}
        spaceId={spaceId}
      />
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

export default TaskManage;
