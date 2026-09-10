/**
 * 最近选择的工作目录（workspaceDirRecent util）单测：
 * 记录去重置顶、封顶裁剪、空值透传、存储损坏兜底。
 */
import { describe, expect, it } from 'vitest';
import {
  addRecentWorkspaceDir,
  loadRecentWorkspaceDirs,
  WORKSPACE_DIR_RECENT_LIMIT,
  WORKSPACE_DIR_RECENT_STORAGE_KEY,
} from '../workspaceDirRecent';

describe('workspaceDirRecent 最近目录', () => {
  it('空存储时读取返回空数组', () => {
    localStorage.removeItem(WORKSPACE_DIR_RECENT_STORAGE_KEY);
    expect(loadRecentWorkspaceDirs()).toEqual([]);
  });

  it('记录置顶，重复确认去重不产生副本', () => {
    localStorage.removeItem(WORKSPACE_DIR_RECENT_STORAGE_KEY);
    addRecentWorkspaceDir('/a');
    addRecentWorkspaceDir('/b');
    addRecentWorkspaceDir('/a');
    expect(loadRecentWorkspaceDirs()).toEqual(['/a', '/b']);
  });

  it('超出上限裁剪，仅保留最近 N 条', () => {
    localStorage.removeItem(WORKSPACE_DIR_RECENT_STORAGE_KEY);
    for (let i = 0; i < WORKSPACE_DIR_RECENT_LIMIT + 2; i += 1) {
      addRecentWorkspaceDir(`/dir-${i}`);
    }
    const list = loadRecentWorkspaceDirs();
    expect(list).toHaveLength(WORKSPACE_DIR_RECENT_LIMIT);
    expect(list[0]).toBe(`/dir-${WORKSPACE_DIR_RECENT_LIMIT + 1}`);
  });

  it('空串不写入', () => {
    localStorage.removeItem(WORKSPACE_DIR_RECENT_STORAGE_KEY);
    expect(addRecentWorkspaceDir('')).toEqual([]);
    expect(localStorage.getItem(WORKSPACE_DIR_RECENT_STORAGE_KEY)).toBeNull();
  });

  it('存储内容损坏时兜底为空数组', () => {
    localStorage.setItem(WORKSPACE_DIR_RECENT_STORAGE_KEY, 'not-json{{{');
    expect(loadRecentWorkspaceDirs()).toEqual([]);
  });

  it('非字符串条目被过滤', () => {
    localStorage.setItem(
      WORKSPACE_DIR_RECENT_STORAGE_KEY,
      JSON.stringify(['/ok', 3, null, '']),
    );
    expect(loadRecentWorkspaceDirs()).toEqual(['/ok']);
  });
});
