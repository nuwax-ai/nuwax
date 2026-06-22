import type {
  ChangeFileGitStatusKind,
  ChangeFileInfo,
} from '@/components/business-component/FileTreePreviewPanel/types/file-tree';

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

/** 变更列表展示项（含文件名与角标，与 buildChangeFileTree.ChangeListItem 结构一致） */
export type ChangeFileDisplayItem = ChangeFileInfo & {
  fileName: string;
  parentPath: string;
  statusMeta: ChangeFileStatusMeta;
};

const STATUS_LABEL: Record<ChangeFileStatusKind, string> = {
  modified: 'M',
  added: 'A',
  deleted: 'D',
  untracked: 'U',
  conflict: 'C',
  renamed: 'R',
};

/** 更改区列表排序：冲突置顶，其余按 Git 优先级 */
const UNSTAGED_DISPLAY_ORDER: Record<ChangeFileStatusKind, number> = {
  conflict: 0,
  deleted: 1,
  added: 2,
  modified: 3,
  renamed: 4,
  untracked: 5,
};

const sortChangeDisplayItems = (
  items: ChangeFileDisplayItem[],
  section: ChangeListSection,
): ChangeFileDisplayItem[] =>
  [...items].sort((a, b) => {
    if (section === 'unstaged') {
      const orderA = UNSTAGED_DISPLAY_ORDER[a.statusMeta.kind] ?? 99;
      const orderB = UNSTAGED_DISPLAY_ORDER[b.statusMeta.kind] ?? 99;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
    }
    return a.fileId.localeCompare(b.fileId);
  });

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

/** 将 ChangeFileInfo 转为列表展示项（补全 fileName / parentPath） */
export const toChangeListBaseItem = (
  item: ChangeFileInfo,
): Omit<ChangeFileDisplayItem, 'statusMeta'> => {
  const segments = item.fileId.split('/');
  const fileName = segments[segments.length - 1] || item.fileId;
  return {
    ...item,
    fileName,
    parentPath: item.fileId,
  };
};

/**
 * 将变更文件 map 并 merge 到「暂存的更改」「更改」两个列表
 * 同一 fileId 可同时出现在两区（MM、新建已暂存后再改等），角标由 resolveGitFileStatuses 决定
 */
export const splitChangeFilesForDisplay = (
  changeFiles: ChangeFileInfo[],
): {
  stagedItems: ChangeFileDisplayItem[];
  unstagedItems: ChangeFileDisplayItem[];
} => {
  const stagedItems: ChangeFileDisplayItem[] = [];
  const unstagedItems: ChangeFileDisplayItem[] = [];

  changeFiles.forEach((item) => {
    const base = toChangeListBaseItem(item);

    const stagedMeta = resolveStagedStatusMeta(item);
    if (stagedMeta) {
      stagedItems.push({ ...base, statusMeta: stagedMeta });
    }

    const unstagedMeta = resolveUnstagedStatusMeta(item);
    if (unstagedMeta) {
      unstagedItems.push({ ...base, statusMeta: unstagedMeta });
    }
  });

  return {
    stagedItems: sortChangeDisplayItems(stagedItems, 'staged'),
    unstagedItems: sortChangeDisplayItems(unstagedItems, 'unstaged'),
  };
};
