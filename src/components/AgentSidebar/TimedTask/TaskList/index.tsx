import SvgIcon from '@/components/base/SvgIcon';
import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import {
  TaskListProps,
  TimedConversationTaskInfo,
} from '@/types/interfaces/agentTask';
import { ExclamationCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { Empty, Modal, Typography } from 'antd';
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
      ? dict('PC.Components.TaskList.noInProgressTasks')
      : dict('PC.Components.TaskList.noCancelledTasks');
  if (loading) {
    return (
      <div className={cx('flex', 'items-center', 'content-center', 'h-full')}>
        <LoadingOutlined className={cx(styles.loading)} />
      </div>
    );
  }

  // 点击任务项
  const handleClick = (info: TimedConversationTaskInfo) => {
    const { id, agentId } = info;
    history.push(`/home/chat/${id}/${agentId}`);
  };

  // 取消定时任务
  const handleCancelTimedTask = (
    e: React.MouseEvent,
    info: TimedConversationTaskInfo,
  ) => {
    e.stopPropagation();
    confirm({
      title: dict('PC.Components.TaskList.confirmCancelTask'),
      icon: <ExclamationCircleFilled />,
      content: info.topic,
      okText: dict('PC.Common.Global.confirm'),
      maskClosable: true,
      cancelText: dict('PC.Common.Global.cancel'),
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

  return taskList?.length > 0 ? (
    <div className={cx(styles['task-wrapper'], className)}>
      {taskList?.map((item: TimedConversationTaskInfo) => (
        <div
          key={item.id}
          className={cx(
            styles['task-item'],
            'flex',
            'items-center',
            'cursor-pointer',
          )}
        >
          <div className={cx('flex-1', styles.topicBox)}>
            <Typography.Title
              level={5}
              className={cx(styles.topic)}
              onClick={() => handleClick(item)}
              ellipsis={{ rows: 1, tooltip: item?.topic }}
            >
              {item?.topic}
            </Typography.Title>
            <span className={cx(styles.time)}>{item.taskCronDesc}</span>
          </div>
          {item.taskStatus === TaskStatus.EXECUTING && (
            <div className={cx(styles.iconBox)}>
              <SvgIcon
                name="icons-common-edit"
                className={cx(styles.icon)}
                onClick={(e) => handleEditTask(e, item)}
              />
              <SvgIcon
                name="icons-common-delete"
                className={cx(styles.icon)}
                onClick={(e) => handleCancelTimedTask(e, item)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  ) : (
    <Empty description={emptyDesc} />
  );
};

export default memo(TaskList);
