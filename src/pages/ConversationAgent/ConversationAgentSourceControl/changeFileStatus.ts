import type { ChangeFileInfo } from '@/components/FileTreeView/type';

/** Git 风格变更类型 */
export type ChangeFileStatusKind =
  | 'modified'
  | 'added'
  | 'deleted'
  | 'untracked';

/** 列表项右侧状态角标元数据 */
export interface ChangeFileStatusMeta {
  kind: ChangeFileStatusKind;
  /** 角标字母：M / A / D / U */
  label: string;
  isStaged: boolean;
}

const STATUS_LABEL: Record<ChangeFileStatusKind, string> = {
  modified: 'M',
  added: 'A',
  deleted: 'D',
  untracked: 'U',
};

/**
 * 根据原始/当前内容与是否暂存，解析 SCM 状态角标（对齐 VS Code 源代码管理）
 */
export function resolveChangeFileStatus(
  item: ChangeFileInfo,
  isStaged: boolean,
): ChangeFileStatusMeta {
  const original = item.originalFileContent ?? '';
  const current = item.fileContent ?? '';
  const hasOriginal = original.length > 0;
  const hasCurrent = current.length > 0;

  if (!hasOriginal && hasCurrent) {
    const kind: ChangeFileStatusKind = isStaged ? 'added' : 'untracked';
    return { kind, label: STATUS_LABEL[kind], isStaged };
  }

  if (hasOriginal && !hasCurrent) {
    return {
      kind: 'deleted',
      label: STATUS_LABEL.deleted,
      isStaged,
    };
  }

  return {
    kind: 'modified',
    label: STATUS_LABEL.modified,
    isStaged,
  };
}
