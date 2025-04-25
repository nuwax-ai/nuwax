import { EllipsisTooltip } from '@/components/EllipsisTooltip';
import { TaskStatus } from '@/types/enums/agent';
import {
  TaskListProps,
  TimedConversationTaskInfo,
} from '@/types/interfaces/agentTask';
import {
  DeleteOutlined,
  FormOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { Empty } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const TaskList: React.FC<TaskListProps> = ({
  loading,
  taskStatus,
  taskList,
}) => {
  const emptyDesc =
    taskStatus === TaskStatus.EXECUTING
      ? '暂无进行中的任务'
      : '暂无已取消的任务';
  if (loading) {
    return (
      <div className={cx('flex', 'items-center', 'content-center', 'h-full')}>
        <LoadingOutlined className={cx(styles.loading)} />
      </div>
    );
  }

  const handleClick = (info: TimedConversationTaskInfo) => {
    if (info.taskStatus === TaskStatus.EXECUTING) {
      console.log('handleClick');
    }
  };

  return taskList?.length > 0 ? (
    <div className={cx(styles['task-wrapper'])}>
      {taskList?.map((item: TimedConversationTaskInfo) => (
        <div
          key={item.taskId}
          className={cx(styles['task-item'], 'flex', 'items-center')}
          onClick={() => handleClick(item)}
        >
          <EllipsisTooltip
            text={String(item?.topic)}
            className={cx('flex-1', styles.name)}
            placement="topLeft"
          />
          {item.taskStatus === TaskStatus.EXECUTING && (
            <>
              <FormOutlined className={cx(styles.icon, 'cursor-pointer')} />
              <DeleteOutlined className={cx(styles.icon, 'cursor-pointer')} />
              <span className={cx(styles.time)}>{item.taskCronDesc}</span>
            </>
          )}
        </div>
      ))}
    </div>
  ) : (
    <Empty description={emptyDesc} />
  );
};

export default TaskList;
