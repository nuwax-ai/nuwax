import React, { useContext } from 'react';
import { useModel } from 'umi';
import { TaskResultContext } from './context';
import TaskResultRow from './TaskResultRow';

/**
 * TaskResult 组件
 * 用于渲染 <task-result> 标签，显示任务结果信息
 *
 * @param children - 任务结果内容（例如：百度首页当前截图 baidu_homepage_current.png）
 * @param node - AST 节点信息，用于生成唯一 key
 */
interface TaskResultProps {
  children?: React.ReactNode;
  node?: any;
  conversationId?: string | number;
}

const TaskResult: React.FC<TaskResultProps> = ({
  children,
  node,
  conversationId,
}) => {
  const { onTaskResultClick } = useContext(TaskResultContext);

  const {
    openPreviewView,
    setTaskAgentSelectedFileId,
    setTaskAgentSelectTrigger,
  } = useModel('conversationInfo');

  // 生成唯一 key
  const {
    end: { offset: endOffset } = { offset: 0 },
    start: { offset: startOffset } = { offset: 0 },
  } = node?.position || {};
  const taskResultKey = `${startOffset}-${endOffset}-task-result`;

  if (!children) {
    return null;
  }

  try {
    // children 可能是单个元素而非数组（task-result 标签只包一个子节点时），
    // 直接 .filter 会抛 "c?.filter is not a function"——统一 toArray 后再过滤
    const childItems = React.Children.toArray(children);
    // 有文件描述显示文件描述
    const fileDescription = childItems
      .filter((item: any) => item.type === 'description')
      .map((item: any) => item.props?.children ?? '')
      .join('');
    // 有文件名显示文件名
    const fileName = childItems
      .filter((item: any) => item.type === 'file')
      .map((item: any) => item.props?.children ?? '')
      .join('');
    // 没有文件名不显示组件
    if (!fileName) {
      return null;
    }

    // 点击事件处理
    const handleClick = async () => {
      /**
       * fileName: /home/user/1465924/workspace/2025-financial-statistics.pptx
       * conversationId: 1465924
       * fileId: workspace/2025-financial-statistics.pptx
       */
      let fileId = fileName.split(`${conversationId}/`).pop();

      // 当点击的是文件夹时，如果文件ID以 / 结尾，则去掉 /
      if (fileId?.endsWith('/')) {
        fileId = fileId.slice(0, -1);
      }

      if (!fileId || conversationId === undefined || conversationId === null) {
        return;
      }

      // 如果外部 Context 提供了拦截器回调且返回了 true（表示拦截），则取消默认行为
      if (onTaskResultClick && onTaskResultClick(fileId) === true) {
        return;
      }

      const cId = Number(conversationId);
      await openPreviewView(cId, { forceRefresh: true });
      setTaskAgentSelectedFileId(fileId);
      // 每次点击时更新触发标志，确保即使文件ID相同也能触发文件选择
      setTaskAgentSelectTrigger(Date.now());
    };

    return (
      <TaskResultRow
        label={fileDescription ? fileDescription : fileName}
        description={fileDescription}
        dataKey={taskResultKey}
        onClick={handleClick}
      />
    );
  } catch (error) {
    console.warn('TaskResult error', error);
    return null;
  }
};

export default TaskResult;
