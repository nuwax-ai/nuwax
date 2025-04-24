import { apiAgentTaskList } from '@/services/agentTask';
import { TaskStatus } from '@/types/enums/agent';
import {
  TimedConversationTaskInfo,
  TimedConversationTaskParams,
  TimedTaskProps,
} from '@/types/interfaces/agentTask';
import { PlusOutlined } from '@ant-design/icons';
import { Tabs, TabsProps } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import CreateTimedTask from './CreateTimedTask';
import styles from './index.less';
import TaskList from './TaskList';

const cx = classNames.bind(styles);

// 定时任务
const TimedTask: React.FC<TimedTaskProps> = ({ agentId }) => {
  // 新建任务弹窗
  const [openTask, setOpenTask] = useState<boolean>(false);
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
      if (taskStatus) {
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

  useEffect(() => {
    setLoading(true);
    runTaskList({
      agentId,
      taskStatus: TaskStatus.EXECUTING, // 进行中
    });
  }, []);

  // tab 被点击的回调
  const handleTabClick = (activeKey: string) => {
    console.log(activeKey);
    setLoading(true);
    runTaskList({
      agentId,
      taskStatus: activeKey as TaskStatus,
    });
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

  const handleTaskCreate = () => {
    console.log('handleTaskCreate');
    setOpenTask(true);
  };

  return (
    <div className={cx(styles.container)}>
      <div className={cx('flex', 'items-center', 'content-between')}>
        <h3 className={cx(styles.title)}>定时任务</h3>
        <span
          className={cx(styles.create, 'cursor-pointer')}
          onClick={handleTaskCreate}
        >
          <PlusOutlined />
        </span>
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
        open={openTask}
        onCancel={() => setOpenTask(false)}
        onConfirm={() => setOpenTask(false)}
      />
    </div>
  );
};

export default TimedTask;
