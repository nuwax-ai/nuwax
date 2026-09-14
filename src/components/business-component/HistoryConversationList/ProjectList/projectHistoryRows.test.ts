import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import type { UserProjectTabItem } from '@/types/interfaces/userProject';
import { describe, expect, it } from 'vitest';
import {
  appendProjectRowsDedup,
  computeHasMore,
  filterProjectConversations,
  filterProjectRows,
  needsChase,
} from './projectHistoryRows';

const buildProject = (
  overrides: Partial<UserProjectTabItem>,
): UserProjectTabItem =>
  ({
    projectId: 1,
    spaceId: 10,
    projectType: 'NormalProject',
    name: '项目',
    modified: '2026-09-14 10:00:00',
    created: '2026-09-14 10:00:00',
    ...overrides,
  } as UserProjectTabItem);

const buildConversation = (
  id: number,
  overrides: Partial<ConversationInfo> = {},
): ConversationInfo =>
  ({
    id,
    topic: `会话${id}`,
    archived: false,
    ...overrides,
  } as ConversationInfo);

describe('历史会话页项目行过滤（projectHistoryRows）', () => {
  it('全部视图隐藏归档项目，置顶项目稳定排前', () => {
    const rows = [
      buildProject({ projectId: 1 }),
      buildProject({ projectId: 2, archived: true }),
      buildProject({ projectId: 3, pinned: true }),
    ];
    const visible = filterProjectRows(rows, 'all');
    expect(visible.map((row) => row.projectId)).toEqual([3, 1]);
  });

  it('已收藏视图按回包 collected 打标兜底过滤（服务端 collectedFilter 未生效时）', () => {
    const rows = [
      buildProject({ projectId: 1, collected: true }),
      buildProject({ projectId: 2, collected: false }),
      buildProject({ projectId: 3 }), // 字段未返回 undefined
    ];
    const visible = filterProjectRows(rows, 'collected');
    expect(visible.map((row) => row.projectId)).toEqual([1]);
  });

  it('已归档视图只保留 archived===true（后端无 archivedFilter，前端过滤）', () => {
    const rows = [
      buildProject({ projectId: 1 }),
      buildProject({ projectId: 2, archived: true }),
    ];
    expect(filterProjectRows(rows, 'archived').map((r) => r.projectId)).toEqual(
      [2],
    );
  });

  it('子会话：全部/已收藏视图隐藏归档会话，已归档视图整组展示', () => {
    const conversations = [
      buildConversation(1),
      buildConversation(2, { archived: true }),
    ];
    expect(
      filterProjectConversations(conversations, 'all').map((c) => c.id),
    ).toEqual([1]);
    expect(
      filterProjectConversations(conversations, 'collected').map((c) => c.id),
    ).toEqual([1]);
    expect(
      filterProjectConversations(conversations, 'archived').map((c) => c.id),
    ).toEqual([1, 2]);
    // conversations 未返回时兜底空数组
    expect(filterProjectConversations(undefined, 'all')).toEqual([]);
  });
});

describe('页码分页追拉判定', () => {
  it('pages 回读优先：已到末页则无更多', () => {
    expect(computeHasMore(1, 1, 20, 20)).toBe(false);
    expect(computeHasMore(1, 3, 20, 20)).toBe(true);
  });

  it('pages 未回读时退满页判定', () => {
    expect(computeHasMore(1, undefined, 20, 20)).toBe(true);
    expect(computeHasMore(1, undefined, 5, 20)).toBe(false);
  });

  it('可见行数不足且还有下一页才追拉', () => {
    expect(needsChase(3, 10, 1, 3, 20, 20)).toBe(true);
    expect(needsChase(12, 10, 1, 3, 20, 20)).toBe(false);
    expect(needsChase(3, 10, 3, 3, 20, 20)).toBe(false); // 已到末页
    expect(needsChase(0, 10, 1, undefined, 5, 20)).toBe(false); // 满页判定无更多
  });

  it('追加页按 projectId 去重，保留先到行', () => {
    const base = [buildProject({ projectId: 1, name: '先到' })];
    const incoming = [
      buildProject({ projectId: 1, name: '后到' }),
      buildProject({ projectId: 2 }),
    ];
    const merged = appendProjectRowsDedup(base, incoming);
    expect(merged.map((row) => row.projectId)).toEqual([1, 2]);
    expect(merged[0].name).toBe('先到');
  });
});
