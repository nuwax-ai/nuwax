import classNames from 'classnames';

import { FileTextOutlined, RightOutlined } from '@ant-design/icons';
import React from 'react';
import { useModel } from 'umi';
import styles from './index.less';
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

const TaskResult: React.FC<TaskResultProps> = ({
  children,
  node,
  conversationId,
}) => {
  const { openPreviewView } = useModel('conversationInfo');

  // 生成唯一 key
  const {
    end: { offset: endOffset } = { offset: 0 },
    start: { offset: startOffset } = { offset: 0 },
  } = node?.position || {};
  const taskResultKey = `${startOffset}-${endOffset}-task-result`;

  // 提取文本内容
  const extractTextContent = (node: any): string => {
    if (typeof node === 'string') {
      return node;
    }
    if (Array.isArray(node)) {
      return node.map(extractTextContent).join('');
    }
    if (node?.props?.children) {
      return extractTextContent(node.props.children);
    }
    return '';
  };

  const textContent = extractTextContent(children);

  // 点击事件处理
  const handleClick = () => {
    openPreviewView(conversationId);
  };

  // 有文件描述显示文件描述
  // const fileDescription = node?.props?.fileDescription;
  console.log(children);
  const fileDescription = (children as React.ReactNode[])
    ?.filter((item: any) => item.type === 'description')
    .map((item: any) => item.props.children)
    .join('');
  console.log('fileDescription', fileDescription);
  // 有文件名显示文件名
  const fileName = (children as React.ReactNode[])
    ?.filter((item: any) => item.type === 'file')
    .map((item: any) => item.props.children)
    .join('');
  console.log('fileName', fileName);
  // 没有文件名不显示组件
  if (!fileName) {
    return null;
  }

  return (
    <div
      key={taskResultKey}
      data-key={taskResultKey}
      className={cx(styles['task-result'])}
      onClick={handleClick}
      title={textContent.replaceAll('\n', ' ')}
    >
      <span className={cx(styles['task-result-icon'])}>
        <FileTextOutlined />
      </span>
      <span className={cx(styles['task-result-action'])}>
        {fileDescription ? fileDescription : fileName}
      </span>
      <span className={cx(styles['task-result-arrow'])}>
        <RightOutlined />
      </span>
    </div>
  );
};

export default TaskResult;
