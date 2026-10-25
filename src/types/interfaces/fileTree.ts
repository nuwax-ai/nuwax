import type { LocalFileReference } from './localFile';

/**
 * 更新文件信息（用于提交文件修改）
 */
export interface UpdateFileInfo {
  /** 保留列表中的本机来源，防止迟到保存借用另一工作区。 */
  localFile?: LocalFileReference;
  /** 文件名 */
  name: string;
  /** 文件内容 */
  contents?: string;
  /** 是否为二进制文件 */
  binary?: boolean;
  /** 文件大小是否超限 */
  sizeExceeded?: boolean;
  /** 重命名之前的文件名（仅在重命名场景下使用） */
  renameFrom?: string;
  operation?: 'create' | 'delete' | 'rename' | 'modify';
  /*Whether entry is a directory */
  isDir?: boolean;
}
