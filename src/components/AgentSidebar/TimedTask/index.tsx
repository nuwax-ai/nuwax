import SvgIcon from '@/components/base/SvgIcon';
import { apiAgentTaskCancel, apiAgentTaskList } from '@/services/agentTask';
import { TaskStatus } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import {
  TimedConversationTaskInfo,
  TimedConversationTaskParams,
  TimedTaskProps,
} from '@/types/interfaces/agentTask';
import { Button, message, Tabs, TabsProps, Typography } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel, useRequest } from 'umi';
import CreateTimedTask from './CreateTimedTask';
import styles from './index.less';
import TaskList from './TaskList';

const cx = classNames.bind(styles);

// 定时任务
const TimedTask: React.FC<TimedTaskProps> = ({ agentId }) => {
  // 使用 model 中的定时任务弹窗状态，而不是本地状态
  const { isTimedTaskOpen, closeTimedTask, timedTaskMode, openTimedTask } =
    useModel('conversationInfo');

  // 更新时,当前任务信息
  const [currentTask, setCurrentTask] = useState<TimedConversationTaskInfo>();
  // 当前激活active: 任务状态
  const [currentTaskStatus, setCurrentTaskStatus] = useState<TaskStatus>(
    TaskStatus.EXECUTING,
  );
  // 加载中状态
  const [loading, setLoading] = useState<boolean>(false);
  // 执行中任务列表
  const [executingTaskList, setExecutingTaskList] = useState<
    TimedConversationTaskInfo[]
  >([]);
  // 取消任务列表
  const [cancelTaskList, setCancelTaskList] = useState<
    TimedConversationTaskInfo[]
  >([]);

  // 查询用户定时会话列表
  const { run: runTaskList } = useRequest(apiAgentTaskList, {
    manual: true,
    debounceInterval: 500,
    onSuccess: (
      result: TimedConversationTaskInfo[],
      params: TimedConversationTaskParams[],
    ) => {
      const { taskStatus } = params[0];
      if (taskStatus === TaskStatus.EXECUTING) {
        setExecutingTaskList(result || []);
      } else {
        setCancelTaskList(result || []);
      }
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 取消定时会话
  const { run: runCancelTask } = useRequest(apiAgentTaskCancel, {
    manual: true,
    debounceInterval: 500,
    onSuccess: (_: null, params: number[]) => {
      const [id] = params;
      message.success('定时任务已取消');
      setExecutingTaskList((prev) => {
        return prev.filter((item) => item.id !== id);
      });
    },
  });

  // 查询任务列表
  const handleQueryTaskList = (taskStatus: TaskStatus) => {
    setLoading(true);
    runTaskList({
      agentId,
      taskStatus,
    });
  };

  useEffect(() => {
    // 查询"进行中"定时任务列表
    handleQueryTaskList(TaskStatus.EXECUTING);

    return () => {
      setExecutingTaskList([]);
      setCancelTaskList([]);
    };
  }, [agentId]);

  // tab 被点击的回调
  const handleTabClick = (activeKey: string) => {
    const status = activeKey as TaskStatus;
    setCurrentTaskStatus(status);
    // 查询任务列表
    handleQueryTaskList(status);
  };

  // 取消定时任务
  const handleCancelTask = (info: TimedConversationTaskInfo) => {
    const { id } = info;
    runCancelTask(id);
  };

  // 编辑任务
  const handleEditTask = (info: TimedConversationTaskInfo) => {
    setCurrentTask(info);
    openTimedTask(CreateUpdateModeEnum.Update);
  };

  const items: TabsProps['items'] = [
    {
      key: TaskStatus.EXECUTING,
      label: '进行中',
      children: (
        <TaskList
          loading={loading}
          taskStatus={TaskStatus.EXECUTING}
          taskList={executingTaskList}
          onCancelTask={handleCancelTask}
          onEditTask={handleEditTask}
        />
      ),
    },
    {
      key: TaskStatus.CANCEL,
      label: '已取消',
      children: (
        <TaskList
          loading={loading}
          taskStatus={TaskStatus.CANCEL}
          taskList={cancelTaskList}
        />
      ),
    },
  ];

  // 创建定时任务 - 现在通过 model 状态管理
  const handleTaskCreate = () => {
    openTimedTask(CreateUpdateModeEnum.Create);
  };

  // 确认创建、更新定时任务
  const handleConfirmCreateTask = () => {
    // 关闭弹窗通过 model 状态管理
    if (currentTaskStatus === TaskStatus.EXECUTING) {
      // 重新查询"进行中"定时任务列表
      handleQueryTaskList(TaskStatus.EXECUTING);
    }
  };

  return (
    <div className={cx(styles.container, 'flex-1', 'flex', 'flex-col')}>
      <div
        className={cx(
          'flex',
          'items-center',
          'content-between',
          styles.titleBox,
        )}
      >
        <Typography.Title className={cx(styles.title)} level={5}>
          定时任务
        </Typography.Title>
        <Button
          size="small"
          className={cx(styles.create, 'cursor-pointer')}
          onClick={handleTaskCreate}
          icon={<SvgIcon name="icons-common-plus" style={{ fontSize: 16 }} />}
          type="text"
        >
          添加
        </Button>
      </div>
      {/* 定时任务tab */}
      <Tabs
        rootClassName={cx(styles.tab)}
        tabBarGutter={20}
        defaultActiveKey={TaskStatus.EXECUTING}
        items={items}
        onTabClick={handleTabClick}
      />
      {/* 创建定时任务弹窗组件 */}
      <CreateTimedTask
        agentId={agentId}
        open={isTimedTaskOpen}
        mode={timedTaskMode}
        currentTask={currentTask}
        onCancel={closeTimedTask}
        onConfirm={handleConfirmCreateTask}
      />
    </div>
  );
};

export default TimedTask;
