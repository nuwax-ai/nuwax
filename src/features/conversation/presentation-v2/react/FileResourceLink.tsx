import classNames from 'classnames';
import React from 'react';
import { getFileTypeInfo, splitFilePath } from '../toolFilePresentation';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface FileResourceLinkProps {
  target: string;
  /**
   * 行内嵌套变体（ProcessNodeRow 折叠行内使用）：不展示目录段，保持行紧凑
   * （完整路径见 title）。
   * 2026-09-14 商讨定调：文件路径跳转功能关闭——纯展示（灰徽标 + 普通色
   * 文件名，无下划线/手型/点击）。未来可能按「个人电脑」场景重新打开
   * （网关 customTargetDir 仅个人电脑会话放行、云端待后端契约）；恢复时
   * 重新接回 onOpenResource 与可点样式即可（git 历史可回溯 4c52fa9ac）。
   */
  inline?: boolean;
}

/** 文件路径展示：类型徽标 + 文件名（+ 目录弱化），不可点、不抢焦点 */
const FileResourceLink: React.FC<FileResourceLinkProps> = ({
  target,
  inline = false,
}) => {
  const { dir, name } = splitFilePath(target);
  const typeInfo = getFileTypeInfo(name);
  return (
    <span className={cx(styles['tool-file-link'])} title={target}>
      <span className={cx(styles['tool-file-badge'])} aria-hidden="true">
        {typeInfo.label}
      </span>
      <span className={cx(styles['tool-file-name'])}>{name}</span>
      {!inline && dir && (
        <span className={cx(styles['tool-file-dir'])}>{dir}/</span>
      )}
    </span>
  );
};

export default FileResourceLink;
