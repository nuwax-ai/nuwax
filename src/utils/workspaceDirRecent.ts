/**
 * 最近选择的工作目录（目录选择弹窗根视图快速重选）：
 * localStorage 持久化，确认选择时记录（去重置顶、封顶裁剪），
 * 弹窗每次打开时读取展示。
 */

export const WORKSPACE_DIR_RECENT_STORAGE_KEY = 'workspace_dir_recent_list';

/** 最多保留的最近目录条数 */
export const WORKSPACE_DIR_RECENT_LIMIT = 5;

/** 读取最近目录列表（存储损坏/不可用时返回空数组） */
export const loadRecentWorkspaceDirs = (): string[] => {
  try {
    const raw = localStorage.getItem(WORKSPACE_DIR_RECENT_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list)
      ? list.filter(
          (item): item is string => typeof item === 'string' && !!item,
        )
      : [];
  } catch {
    return [];
  }
};

/**
 * 记录一次确认选择：去重置顶、超出上限裁剪；返回更新后的列表
 * （localStorage 不可用时返回内存语义的最新列表，仅本次会话生效）。
 */
export const addRecentWorkspaceDir = (dir: string): string[] => {
  const current = loadRecentWorkspaceDirs();
  if (!dir) return current;
  const next = [dir, ...current.filter((item) => item !== dir)].slice(
    0,
    WORKSPACE_DIR_RECENT_LIMIT,
  );
  try {
    localStorage.setItem(
      WORKSPACE_DIR_RECENT_STORAGE_KEY,
      JSON.stringify(next),
    );
  } catch {
    // ignore: localStorage 不可用，降级为仅本次会话生效
  }
  return next;
};
