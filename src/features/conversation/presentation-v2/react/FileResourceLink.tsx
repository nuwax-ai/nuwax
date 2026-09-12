import classNames from 'classnames';
import React from 'react';
import { getFileTypeInfo, splitFilePath } from '../toolFilePresentation';
import type { ConversationToolResource } from '../types';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface FileResourceLinkProps {
  target: string;
  line?: number;
  onOpenResource?: (resource: ConversationToolResource) => void;
  /**
   * 行内嵌套变体（ProcessNodeRow 折叠行内使用）：渲染 span 并阻止点击冒泡，
   * 避免触发外层行的展开；且不展示目录段，保持行紧凑（完整路径见 title）。
   * 所有文件路径均渲染徽标链接；能否打开由宿主 handler 判定（失败 toast）。
   */
  inline?: boolean;
}

/** 文件路径高亮链接：类型徽标 + 可点文件名（+ 目录弱化），视觉上直接表达「可点击打开」 */
const FileResourceLink: React.FC<FileResourceLinkProps> = ({
  target,
  line,
  onOpenResource,
  inline = false,
}) => {
  const { dir, name } = splitFilePath(target);
  const typeInfo = getFileTypeInfo(name);
  const content = (
    <>
      <span
        className={cx(styles['tool-file-badge'])}
        style={{
          backgroundColor: typeInfo.bg,
          color: typeInfo.color ?? '#fff',
        }}
        aria-hidden="true"
      >
        {typeInfo.label}
      </span>
      <span className={cx(styles['tool-file-name'])}>{name}</span>
      {!inline && dir && (
        <span className={cx(styles['tool-file-dir'])}>{dir}/</span>
      )}
    </>
  );
  if (!onOpenResource) {
    return (
      <span className={cx(styles['tool-file-link'])} title={target}>
        {content}
      </span>
    );
  }
  if (inline) {
    return (
      <span
        className={cx(styles['tool-file-link'], styles['is-clickable'])}
        title={target}
        onClick={(event) => {
          // 行本身是展开/收起按钮：阻止冒泡，只触发文件打开
          event.stopPropagation();
          onOpenResource({ kind: 'file', target, line });
        }}
      >
        {content}
      </span>
    );
  }
  return (
    <button
      type="button"
      className={cx(styles['tool-file-link'], styles['is-clickable'])}
      title={target}
      onClick={() => onOpenResource({ kind: 'file', target, line })}
    >
      {content}
    </button>
  );
};

export default FileResourceLink;
