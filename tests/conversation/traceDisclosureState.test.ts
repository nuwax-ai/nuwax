import {
  createTraceDisclosureState,
  reduceTraceDisclosure,
  resolveSegmentDisclosure,
} from '@/features/conversation/presentation-v2/traceDisclosureState';
import { buildTraceViewModel } from '@/features/conversation/presentation-v2/traceViewModel';
import type { ConversationProcessNode } from '@/features/conversation/presentation-v2/types';
import { describe, expect, it } from 'vitest';

const node = (
  id: string,
  kind: ConversationProcessNode['kind'],
  failed = false,
): ConversationProcessNode => ({
  id,
  kind,
  title: id,
  summary: '',
  failed,
  status: failed ? 'failed' : 'finished',
});

describe('轨迹折叠规则 R-DISCLOSURE', () => {
  it('活动组超越后仅自动收起一次，手动重开可跨增量保留且状态互不污染', () => {
    const initial = createTraceDisclosureState({
      activeGroupIds: ['a'],
      activeSegmentId: 's1',
    });
    const overtaken = reduceTraceDisclosure(initial, {
      type: 'activity-changed',
      activeGroupIds: ['b'],
      activeSegmentId: 's2',
    });
    expect(overtaken.groups.a).toBe(false);
    expect(overtaken.segments.s1).toBe(false);
    expect(initial.groups).toEqual({});
    expect(initial.autoCollapsedGroups.size).toBe(0);
    const reopened = reduceTraceDisclosure(overtaken, {
      type: 'toggle',
      scope: 'groups',
      id: 'a',
      defaultExpanded: false,
    });
    const ended = reduceTraceDisclosure(reopened, {
      type: 'activity-changed',
      activeGroupIds: [],
    });
    expect(ended.groups).toEqual({ a: true, b: false });
    expect(reopened.groups).toEqual({ a: true });
    expect(
      reduceTraceDisclosure(ended, {
        type: 'activity-changed',
        activeGroupIds: [],
      }),
    ).toBe(ended);
    expect(createTraceDisclosureState({ activeGroupIds: [] }).groups).toEqual(
      {},
    );
  });

  it('活动组手动收起后，同组增量不重置选择', () => {
    const initial = createTraceDisclosureState({ activeGroupIds: ['a'] });
    const closed = reduceTraceDisclosure(initial, {
      type: 'toggle',
      scope: 'groups',
      id: 'a',
      defaultExpanded: true,
    });
    expect(
      reduceTraceDisclosure(closed, {
        type: 'activity-changed',
        activeGroupIds: ['a'],
      }),
    ).toBe(closed);
    expect(closed.groups.a).toBe(false);
  });

  it('整轮收起保留 OpenUI 挂载，普通详情卸载；单项段不套额外折叠', () => {
    const options = {
      running: true,
      traceExpanded: false,
      active: false,
      canCollapse: true,
      hasPersistentContent: false,
    };
    expect(resolveSegmentDisclosure(options)).toEqual({
      mounted: false,
      expanded: false,
      showToggle: false,
    });
    expect(
      resolveSegmentDisclosure({ ...options, hasPersistentContent: true })
        .mounted,
    ).toBe(true);
    expect(
      resolveSegmentDisclosure({
        ...options,
        traceExpanded: true,
        canCollapse: false,
      }),
    ).toEqual({ mounted: true, expanded: true, showToggle: false });
    expect(
      resolveSegmentDisclosure({
        ...options,
        traceExpanded: true,
        active: true,
        manualExpanded: false,
      }).expanded,
    ).toBe(true);
    expect(
      resolveSegmentDisclosure({ ...options, running: false }).expanded,
    ).toBe(true);
  });
});

describe('展示模型 R-VISIBILITY', () => {
  it('隐藏思考仍划分前后工具组，恢复隐藏项不改变组 ID 或活动组', () => {
    const turn = {
      nodes: [
        node('a', 'tool'),
        node('b', 'tool'),
        node('think', 'reasoning'),
        node('c', 'tool'),
        node('d', 'tool'),
      ],
      running: true,
      finalAnswer: { text: '', source: 'none' as const },
    };
    const preferences = { preset: 'focused' as const, nodeOverrides: {} };
    const hidden = buildTraceViewModel(turn, preferences, false);
    const revealed = buildTraceViewModel(turn, preferences, true);
    expect(hidden.hiddenCount).toBe(1);
    expect(hidden.activeGroupIds).toEqual(['tool-group:c']);
    expect(hidden.hiddenSegmentIds).toEqual(['trace-segment:a']);
    const segment = hidden.segments[0];
    const fullSegment = revealed.segments[0];
    if (
      segment.kind !== 'process-segment' ||
      fullSegment.kind !== 'process-segment'
    )
      throw new Error('expected process segments');
    expect(segment.items.map((item) => item.id)).toEqual([
      'tool-group:a',
      'tool-group:c',
    ]);
    expect(fullSegment.items.map((item) => item.id)).toEqual([
      'tool-group:a',
      'think',
      'tool-group:c',
    ]);
  });

  it('偏好隐藏工具时保留失败节点与原组身份，不把剩余单项重新分组', () => {
    const model = buildTraceViewModel(
      {
        nodes: [node('a', 'tool'), node('b', 'tool', true)],
        running: true,
        finalAnswer: { text: '', source: 'none' as const },
      },
      { preset: 'balanced', nodeOverrides: { tool: 'hidden' } },
      false,
    );
    expect(model.hiddenCount).toBe(1);
    const segment = model.segments[0];
    if (segment.kind !== 'process-segment')
      throw new Error('expected process segment');
    expect(segment.failed).toBe(true);
    expect(segment.canCollapse).toBe(false);
    expect(segment.items).toMatchObject([
      {
        kind: 'tool-group',
        id: 'tool-group:a',
        nodes: [{ id: 'b' }],
        status: 'failed',
      },
    ]);
  });
});
