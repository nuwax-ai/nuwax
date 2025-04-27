import { EllipsisTooltip } from '@/components/EllipsisTooltip';
import { TaskStatus } from '@/types/enums/agent';
import {
  TaskListProps,
  TimedConversationTaskInfo,
} from '@/types/interfaces/agentTask';
import {
  DeleteOutlined,
  ExclamationCircleFilled,
  FormOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { Empty, Modal } from 'antd';
import classNames from 'classnames';
import React, { memo } from 'react';
import { history } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const { confirm } = Modal;

/**
 * 定时任务列表
 */
const TaskList: React.FC<TaskListProps> = ({
  className,
  loading,
  taskStatus,
  taskList,
  onCancelTask,
  onEditTask,
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

  // 点击任务项
  const handleClick = (info: TimedConversationTaskInfo) => {
    if (info.taskStatus === TaskStatus.EXECUTING) {
      const { id } = info;
      history.push(`/home/chat/${id}`);
    }
  };

  // 取消定时任务
  const handleCancelTimedTask = (
    e: React.MouseEvent,
    info: TimedConversationTaskInfo,
  ) => {
    e.stopPropagation();
    confirm({
      title: '您确定要取消此定时任务吗?',
      icon: <ExclamationCircleFilled />,
      content: info.topic,
      okText: '确定',
      maskClosable: true,
      cancelText: '取消',
      onOk() {
        onCancelTask?.(info);
      },
    });
  };

  // 编辑任务
  const handleEditTask = (
    e: React.MouseEvent,
    info: TimedConversationTaskInfo,
  ) => {
    e.stopPropagation();
    onEditTask?.(info);
  };

  // 手掌样式
  const cursor =
    taskStatus === TaskStatus.EXECUTING ? 'cursor-pointer' : 'cursor-default';

  return taskList?.length > 0 ? (
    <div className={cx(styles['task-wrapper'], className)}>
      {taskList?.map((item: TimedConversationTaskInfo) => (
        <div
          key={item.id}
          className={cx(styles['task-item'], 'flex', 'items-center', cursor)}
        >
          <EllipsisTooltip
            text={String(item?.topic)}
            className={cx('flex-1')}
            placement="topLeft"
            onClick={() => handleClick(item)}
          />
          {item.taskStatus === TaskStatus.EXECUTING && (
            <>
              <FormOutlined
                className={cx(styles.icon, 'cursor-pointer')}
                onClick={(e) => handleEditTask(e, item)}
              />
              <DeleteOutlined
                className={cx(styles.icon, 'cursor-pointer')}
                onClick={(e) => handleCancelTimedTask(e, item)}
              />
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

export default memo(TaskList);
