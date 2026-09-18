/**
 * childrenProbe 纯函数单测：项目子会话「切回核对」探针的指纹比对分类。
 * 覆盖：无差异 / 指纹差异（状态跃迁、modified）/ 归属化未知行（命中重拉、
 * 范围外忽略、类型撞车、无归属兜底）/ 满页兜底。
 * 语义按 2026-09-18 testagent 真实数据校准（见 childrenProbe.ts 头注释）。
 */
import { describe, expect, it } from 'vitest';

import { TaskStatus } from '@/types/enums/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { CHILDREN_PROBE_LIMIT, diffChildrenProbe } from './childrenProbe';
import type { ProjectChildItem, ProjectItem } from './index';

const conversation = (
  id: number,
  extra: Partial<ConversationInfo> = {},
): ConversationInfo =>
  ({
    id,
    modified: '2026-09-18T08:00:00.000+00:00',
    ...extra,
  } as ConversationInfo);

const childOf = (c: ConversationInfo): ProjectChildItem => ({
  id: c.id,
  name: `会话${c.id}`,
  modified: c.modified,
  taskStatus: c.taskStatus,
  conversation: c,
});

const projectOf = (
  id: number,
  children?: ProjectChildItem[],
  projectType = 'NormalProject',
): ProjectItem => ({
  id,
  name: `项目${id}`,
  projectType: projectType as ProjectItem['projectType'],
  children,
});

describe('diffChildrenProbe', () => {
  it('无差异：全部命中且指纹一致，零重拉零跃迁', () => {
    const c11 = conversation(11, { taskStatus: TaskStatus.COMPLETE });
    const c21 = conversation(21);
    const result = diffChildrenProbe(
      [projectOf(1, [childOf(c11)]), projectOf(2, [childOf(c21)])],
      [c11, c21],
    );
    expect(result.changedProjectKeys.size).toBe(0);
    expect(result.finishedTransitions).toEqual([]);
    expect(result.hasUnknownConversation).toBe(false);
    expect(result.truncated).toBe(false);
  });

  it('EXECUTING→终态：记入跃迁清单并标记所属项目重拉', () => {
    const running = conversation(11, { taskStatus: TaskStatus.EXECUTING });
    const finished = conversation(11, { taskStatus: TaskStatus.COMPLETE });
    const result = diffChildrenProbe(
      [projectOf(1, [childOf(running)])],
      [finished],
    );
    expect(result.finishedTransitions).toEqual([
      { conversationId: 11, taskStatus: TaskStatus.COMPLETE },
    ]);
    expect([...result.changedProjectKeys]).toEqual(['NormalProject:1']);
  });

  it('modified 变化：非执行中会话也标记所属项目重拉', () => {
    const old = conversation(11, { taskStatus: TaskStatus.COMPLETE });
    const updated = conversation(11, {
      taskStatus: TaskStatus.COMPLETE,
      modified: '2026-09-18T09:00:00.000+00:00',
    });
    const result = diffChildrenProbe([projectOf(1, [childOf(old)])], [updated]);
    expect(result.changedProjectKeys.size).toBe(1);
    expect(result.finishedTransitions).toEqual([]);
  });

  it('已加载会话从探针中消失：忽略（两接口 universe 结构性不一致，实测项目 29）', () => {
    const c11 = conversation(11);
    const result = diffChildrenProbe([projectOf(1, [childOf(c11)])], []);
    expect(result.changedProjectKeys.size).toBe(0);
    expect(result.hasUnknownConversation).toBe(false);
  });

  it('新会话归属命中已加载项目：只标记该项目重拉', () => {
    const c11 = conversation(11);
    const fresh = conversation(99, {
      devTargetType: 'NormalProject',
      devTargetId: '1',
    });
    const result = diffChildrenProbe(
      [projectOf(1, [childOf(c11)]), projectOf(2, [])],
      [c11, fresh],
    );
    expect([...result.changedProjectKeys]).toEqual(['NormalProject:1']);
    expect(result.hasUnknownConversation).toBe(false);
  });

  it('新会话归属在面板范围外（第 2 页/归档项目）：忽略不触发兜底', () => {
    const c11 = conversation(11);
    const page2Row = conversation(99, {
      devTargetType: 'NormalProject',
      devTargetId: '126',
    });
    const result = diffChildrenProbe(
      [projectOf(1, [childOf(c11)])],
      [c11, page2Row],
    );
    expect(result.changedProjectKeys.size).toBe(0);
    expect(result.hasUnknownConversation).toBe(false);
  });

  it('归属按「类型+id」复合键：同 id 跨项目类型撞车不误归属（NormalProject:94 ≠ UserApp:94）', () => {
    const c11 = conversation(11);
    const collisionRow = conversation(99, {
      devTargetType: 'NormalProject',
      devTargetId: '94',
    });
    const result = diffChildrenProbe(
      [projectOf(94, [childOf(c11)], 'UserApp')],
      [c11, collisionRow],
    );
    expect(result.changedProjectKeys.size).toBe(0);
    expect(result.hasUnknownConversation).toBe(false);
  });

  it('无归属新会话：全部项目已加载时判定未知（全量兜底）', () => {
    const c11 = conversation(11);
    const unattributed = conversation(99);
    const result = diffChildrenProbe(
      [projectOf(1, [childOf(c11)])],
      [c11, unattributed],
    );
    expect(result.hasUnknownConversation).toBe(true);
  });

  it('无归属新会话：存在未加载项目时豁免判定（可能属于它们）', () => {
    const c11 = conversation(11);
    const unattributed = conversation(99);
    const result = diffChildrenProbe(
      [projectOf(1, [childOf(c11)]), projectOf(2, undefined)],
      [c11, unattributed],
    );
    expect(result.hasUnknownConversation).toBe(false);
  });

  it('回包满页：truncated 置真（可能截断，比对不可靠）', () => {
    const rows = Array.from({ length: CHILDREN_PROBE_LIMIT }, (_, i) =>
      conversation(i + 1),
    );
    const result = diffChildrenProbe([], rows);
    expect(result.truncated).toBe(true);
  });
});
