import { usePageModel } from '@/modelScopes/usePageModel';
import { taskResultFileName } from '@/utils/taskResult';
import classNames from 'classnames';
import React, { useContext } from 'react';
import { TaskResultContext } from './context';
import styles from './index.less';
import TaskResultRow from './TaskResultRow';

const cx = classNames.bind(styles);

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

/** 把 markdown 子节点收成纯文本。文件名可能被拆成多个文本节点，不能只取第一个。 */
const readNodeText = (node: React.ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(readNodeText).join('');
  }
  if (React.isValidElement(node)) {
    return readNodeText(
      (node.props as { children?: React.ReactNode }).children,
    );
  }
  return '';
};

const elementTag = (child: React.ReactElement): string => {
  if (typeof child.type === 'string') {
    return child.type;
  }
  const tagName = (child.props as { node?: { tagName?: string } }).node
    ?.tagName;
  return typeof tagName === 'string' ? tagName : '';
};

/**
 * 收集某种子标签的文本。
 * 多个 <file> 必须分开保留：拼成一个字符串后，点击会去打开一个不存在的路径。
 */
const collectTagTexts = (children: React.ReactNode, tag: string): string[] => {
  const found: string[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      return;
    }
    const props = child.props as { children?: React.ReactNode };
    if (elementTag(child) === tag) {
      const text = readNodeText(props.children).trim();
      if (text) {
        found.push(text);
      }
      return;
    }
    if (props.children) {
      found.push(...collectTagTexts(props.children, tag));
    }
  });
  return found;
};

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
  } = usePageModel('conversationInfo');

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
    const fileDescription = collectTagTexts(children, 'description').join('');
    const files = collectTagTexts(children, 'file');
    // 没有文件名不显示组件
    if (files.length === 0) {
      return null;
    }

    /**
     * 打开其中一个产物。
     * fileName 可能是工作区相对路径，也可能只是文件名（新产物不再带会话目录）。
     * 带 `${conversationId}/` 时切掉沙箱前缀；纯文件名原样交给文件树按文件名搜索。
     */
    const openFile = async (fileName: string) => {
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
      // 只打开预览，不刷新文件树。从桌面切到预览时默认会重拉根目录，
      // 任务结果会另搜文件并加载它所在的那一层。
      await openPreviewView(cId, { skipFileTreeRefresh: true });
      setTaskAgentSelectedFileId(fileId);
      // 每次点击时更新触发标志，确保即使文件ID相同也能触发文件选择
      setTaskAgentSelectTrigger(Date.now());
    };

    if (files.length === 1) {
      return (
        <TaskResultRow
          label={fileDescription ? fileDescription : files[0]}
          description={fileDescription}
          dataKey={taskResultKey}
          onClick={() => {
            void openFile(files[0]);
          }}
        />
      );
    }

    return (
      <div className={cx(styles['task-result-group'])} data-key={taskResultKey}>
        {fileDescription ? (
          <div className={cx(styles['task-result-summary'])}>
            {fileDescription}
          </div>
        ) : null}
        {files.map((fileName, index) => (
          <TaskResultRow
            key={`${taskResultKey}-${fileName}`}
            label={taskResultFileName(fileName)}
            description={
              fileDescription ? `${fileDescription}\n${fileName}` : fileName
            }
            dataKey={`${taskResultKey}-${index}`}
            onClick={() => {
              void openFile(fileName);
            }}
          />
        ))}
      </div>
    );
  } catch (error) {
    console.warn('TaskResult error', error);
    return null;
  }
};

export default TaskResult;
