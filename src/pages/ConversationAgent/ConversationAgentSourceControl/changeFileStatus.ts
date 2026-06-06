import type {
  ChangeFileGitStatusKind,
  ChangeFileInfo,
} from '@/components/FileTreeView/type';

/** 变更列表区块：暂存区 / 工作区 */
export type ChangeListSection = 'staged' | 'unstaged';

/** 当前选中的变更文件（同一 fileId 可能同时存在于两个区块） */
export interface SelectedChangeFile {
  fileId: string;
  section: ChangeListSection;
}

/** 判断列表项是否处于选中态 */
export const isChangeFileSelected = (
  fileId: string,
  section: ChangeListSection,
  selected?: SelectedChangeFile | null,
): boolean => selected?.fileId === fileId && selected?.section === section;

/** Git 风格变更类型 */
export type ChangeFileStatusKind = ChangeFileGitStatusKind;

/** 列表项右侧状态角标元数据 */
export interface ChangeFileStatusMeta {
  kind: ChangeFileStatusKind;
  /** 角标字母：U / M / A / D / C / R */
  label: string;
  isStaged: boolean;
}

const STATUS_LABEL: Record<ChangeFileStatusKind, string> = {
  modified: 'M',
  added: 'A',
  deleted: 'D',
  untracked: 'U',
  conflict: 'C',
  renamed: 'R',
};

/**
 * 根据 Git 状态类型与是否暂存区，生成 SCM 角标元数据
 */
export function resolveStatusMeta(
  kind: ChangeFileStatusKind,
  isStaged: boolean,
): ChangeFileStatusMeta {
  return {
    kind,
    label: STATUS_LABEL[kind],
    isStaged,
  };
}

/**
 * 解析暂存区列表项角标
 */
export function resolveStagedStatusMeta(
  item: ChangeFileInfo,
): ChangeFileStatusMeta | null {
  if (!item.stagedStatus) {
    return null;
  }
  return resolveStatusMeta(item.stagedStatus, true);
}

/**
 * 解析工作区（未暂存）列表项角标
 */
export function resolveUnstagedStatusMeta(
  item: ChangeFileInfo,
): ChangeFileStatusMeta | null {
  if (!item.unstagedStatus) {
    return null;
  }
  return resolveStatusMeta(item.unstagedStatus, false);
}
