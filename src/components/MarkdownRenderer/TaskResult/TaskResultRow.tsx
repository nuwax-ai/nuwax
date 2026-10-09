import { FileTextOutlined, RightOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface TaskResultRowProps {
  /** 行内展示文本（文件名 / 标题） */
  label: string;
  /** tooltip 文案，缺省取 label */
  description?: string;
  /** data-key 标识（用于 markdown <task-result> 等列表场景） */
  dataKey?: string;
  /** 点击行回调 */
  onClick?: () => void;
}

/**
 * 文件摘要行（纯展示 + 可点击）。
 * 与 TaskResult 共用同一套 .task-result 样式：markdown 的 <task-result> 标签渲染、
 * 以及 OpenUI sidecar 摘要均复用本组件，避免样式重复。
 *
 * 注意：本组件刻意不依赖 umi / context，便于在没有 ModelProvider 的环境（如单测）下复用。
 */
const TaskResultRow: React.FC<TaskResultRowProps> = ({
  label,
  description,
  dataKey,
  onClick,
}) => (
  <div
    key={dataKey}
    data-key={dataKey}
    className={cx(styles['task-result'])}
    onClick={onClick}
    title={description ?? label}
  >
    <span className={cx(styles['task-result-icon'])}>
      <FileTextOutlined />
    </span>
    <span className={cx(styles['task-result-action'])}>{label}</span>
    <span className={cx(styles['task-result-arrow'])}>
      <RightOutlined />
    </span>
  </div>
);

export default TaskResultRow;
