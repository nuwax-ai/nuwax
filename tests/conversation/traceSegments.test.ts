import { splitNodesByVisibility } from '@/features/conversation/presentation-v2/renderPreferences';
import { composeConversationTraceSegments } from '@/features/conversation/presentation-v2/traceSegments';
import type {
  ConversationProcessNode,
  ConversationTurnPresentationV2,
} from '@/features/conversation/presentation-v2/types';
import { describe, expect, it } from 'vitest';

const node = (
  id: string,
  kind: ConversationProcessNode['kind'],
  overrides: Partial<ConversationProcessNode> = {},
): ConversationProcessNode => ({
  id,
  kind,
  title: id,
  summary: '',
  status: 'finished',
  failed: false,
  ...overrides,
});

const turn = (
  nodes: ConversationProcessNode[],
  overrides: Partial<
    Pick<ConversationTurnPresentationV2, 'running' | 'finalAnswer'>
  > = {},
): Pick<
  ConversationTurnPresentationV2,
  'nodes' | 'running' | 'finalAnswer'
> => ({
  nodes,
  running: true,
  finalAnswer: { text: '', source: 'none' },
  ...overrides,
});

const processSegments = (source: ReturnType<typeof turn>) =>
  composeConversationTraceSegments(source).filter(
    (item) => item.kind === 'process-segment',
  );

describe('composeConversationTraceSegments', () => {
  it('普通正文关闭此前思考和工具所在段，下一过程段保留真实顺序并继续活动', () => {
    const firstNodes = [
      node('think-1', 'reasoning'),
      node('read-1', 'tool'),
      node('think-2', 'reasoning'),
      node('run-1', 'tool'),
    ];
    const narration = node('text-1', 'narration', { text: '第一阶段完成。' });
    const secondNodes = [
      node('context-1', 'context'),
      node('plan-1', 'plan'),
      node('subagent-1', 'subagent'),
      node('interaction-1', 'completed-interaction'),
      node('unknown-1', 'unknown'),
    ];
    const segments = composeConversationTraceSegments(
      turn([...firstNodes, narration, ...secondNodes]),
    );

    expect(segments.map((item) => item.kind)).toEqual([
      'process-segment',
      'narration',
      'process-segment',
    ]);
    expect(segments[0]).toMatchObject({
      id: 'trace-segment:think-1',
      nodes: firstNodes,
      active: false,
      metrics: { toolCount: 2, messageCount: 2 },
    });
    expect(segments[1]).toEqual({
      kind: 'narration',
      id: narration.id,
      node: narration,
    });
    expect(segments[2]).toMatchObject({
      id: 'trace-segment:context-1',
      nodes: secondNodes,
      active: true,
    });
  });

  it('只有一条思考或一条工具也能形成被正文关闭的过程段', () => {
    const segments = processSegments(
      turn([
        node('think-1', 'reasoning'),
        node('text-1', 'narration', { text: '准备完成。' }),
        node('run-1', 'tool'),
        node('text-2', 'narration', { text: '验证完成。' }),
      ]),
    );

    expect(segments).toHaveLength(2);
    expect(segments.map((item) => item.active)).toEqual([false, false]);
    expect(segments.map((item) => item.nodes.map((entry) => entry.id))).toEqual(
      [['think-1'], ['run-1']],
    );
  });

  it('仍在独立回答区流出的正文立即关闭尾段，无须等下一工具把它改为 narration', () => {
    const nodes = [node('think-1', 'reasoning'), node('run-1', 'tool')];
    const [active] = processSegments(turn(nodes));
    const [closed] = processSegments(
      turn(nodes, {
        finalAnswer: {
          text: '当前阶段完成，接下来继续。',
          source: 'messageText',
        },
      }),
    );

    expect(active.active).toBe(true);
    expect(closed.active).toBe(false);
    expect(closed.id).toBe(active.id);
    expect(closed.nodes).toEqual(active.nodes);
  });

  it('空白回答不提前关闭尾段', () => {
    const [segment] = processSegments(
      turn([node('think-1', 'reasoning')], {
        finalAnswer: { text: ' \n\t ', source: 'messageText' },
      }),
    );

    expect(segment.active).toBe(true);
  });

  it('流式追加过程节点及随后出现正文边界时段键保持稳定', () => {
    const first = node('think-1', 'reasoning');
    const second = node('read-1', 'tool');
    const before = processSegments(turn([first, second]));
    const appended = processSegments(
      turn([first, second, node('run-1', 'tool')]),
    );
    const nextStage = processSegments(
      turn([
        first,
        second,
        node('run-1', 'tool'),
        node('text-1', 'narration', { text: '第一阶段完成。' }),
        node('think-2', 'reasoning'),
      ]),
    );

    expect(before[0].id).toBe('trace-segment:think-1');
    expect(appended[0].id).toBe(before[0].id);
    expect(nextStage[0].id).toBe(before[0].id);
    expect(nextStage[0].active).toBe(false);
    expect(nextStage[1]).toMatchObject({
      id: 'trace-segment:think-2',
      active: true,
    });
  });

  it('计数仅取当前段，工具执行去重，正文与计划及未知项不计消息', () => {
    const segments = processSegments(
      turn([
        node('read-1', 'tool', { executeId: 'shared-execution' }),
        node('read-copy', 'tool', { executeId: 'shared-execution' }),
        node('subagent-1', 'subagent'),
        node('think-1', 'reasoning'),
        node('context-1', 'context'),
        node('interaction-1', 'completed-interaction'),
        node('plan-1', 'plan'),
        node('unknown-1', 'unknown'),
        node('text-1', 'narration', { text: '第一阶段完成。' }),
        node('run-2', 'tool'),
        node('think-2', 'reasoning'),
      ]),
    );

    expect(segments[0].metrics).toMatchObject({
      toolCount: 2,
      messageCount: 3,
    });
    expect(segments[1].metrics).toMatchObject({
      toolCount: 1,
      messageCount: 1,
    });
  });

  it('按原始节点先分段，focused 隐藏思考不会更换段键或合并正文两侧的段', () => {
    const nodes = [
      node('hidden-think-1', 'reasoning'),
      node('read-1', 'tool'),
      node('text-1', 'narration', { text: '文件已读取。' }),
      node('hidden-think-2', 'reasoning'),
      node('run-1', 'tool'),
    ];
    const visible = splitNodesByVisibility(nodes, {
      preset: 'focused',
      nodeOverrides: {},
    });
    const segments = processSegments(turn(nodes));

    expect(visible.visibleNodes.map((item) => item.id)).toEqual([
      'read-1',
      'text-1',
      'run-1',
    ]);
    expect(segments.map((item) => item.id)).toEqual([
      'trace-segment:hidden-think-1',
      'trace-segment:hidden-think-2',
    ]);
    expect(segments.map((item) => item.metrics.messageCount)).toEqual([1, 1]);
  });

  it('终态不存在活动段', () => {
    const segments = processSegments(
      turn(
        [
          node('think-1', 'reasoning'),
          node('text-1', 'narration', { text: '阶段完成。' }),
          node('run-1', 'tool'),
        ],
        { running: false },
      ),
    );

    expect(segments.map((item) => item.active)).toEqual([false, false]);
  });

  it('空数据与连续正文不会创建空过程段', () => {
    expect(composeConversationTraceSegments(turn([]))).toEqual([]);
    const narrationNodes = [
      node('text-1', 'narration', { text: '先确认范围。' }),
      node('text-2', 'narration', { text: '再开始执行。' }),
    ];
    const segments = composeConversationTraceSegments(turn(narrationNodes));

    expect(segments.map((item) => item.kind)).toEqual([
      'narration',
      'narration',
    ]);
    expect(segments.map((item) => item.id)).toEqual(['text-1', 'text-2']);
  });

  it('没有可信工具窗口时省略耗时，不把思考 durationMs 当作整段耗时', () => {
    const [segment] = processSegments(
      turn([
        node('think-1', 'reasoning', { durationMs: 3000 }),
        node('run-1', 'tool'),
      ]),
    );

    expect(segment.metrics.elapsedMs).toBeUndefined();
  });

  it.each([
    { nodes: [node('start-only', 'tool', { startTime: 1000 })] },
    { nodes: [node('end-only', 'tool', { endTime: 4000 })] },
    {
      nodes: [
        node('start-only', 'tool', { startTime: 1000 }),
        node('end-only', 'tool', { endTime: 4000 }),
      ],
    },
    {
      nodes: [
        node('invalid-window', 'tool', { startTime: 4000, endTime: 1000 }),
      ],
    },
  ])('缺失或倒置的时间边界不产生假耗时：%j', ({ nodes }) => {
    const [segment] = processSegments(turn(nodes));
    expect(segment.metrics.elapsedMs).toBeUndefined();
  });

  it('单个可信执行窗口可以提供该段已知耗时', () => {
    const [segment] = processSegments(
      turn([
        node('think-1', 'reasoning'),
        node('run-1', 'tool', { startTime: 1000, endTime: 2500 }),
      ]),
    );

    expect(segment.metrics.elapsedMs).toBe(1500);
  });

  it('已知执行窗口只在段内取最早开始与最晚结束，不借用其他段的时间', () => {
    const segments = processSegments(
      turn([
        node('read-1', 'tool', { startTime: 1000, endTime: 2000 }),
        node('run-1', 'tool', { startTime: 1500, endTime: 4000 }),
        node('text-1', 'narration', { text: '第一阶段完成。' }),
        node('read-2', 'tool', { startTime: 10000, endTime: 12000 }),
      ]),
    );

    expect(segments.map((item) => item.metrics.elapsedMs)).toEqual([
      3000, 2000,
    ]);
  });
});
