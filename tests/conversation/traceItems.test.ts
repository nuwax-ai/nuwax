import {
  composeConversationTraceItems,
  getNodeToolActionKind,
  getToolGroupActionKinds,
  getToolGroupStatus,
  hasProcessNodeDetail,
} from '@/features/conversation/presentation-v2/traceItems';
import type { ConversationProcessNode } from '@/features/conversation/presentation-v2/types';
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

const tool = (
  id: string,
  result: Record<string, unknown>,
  overrides: Partial<ConversationProcessNode> = {},
): ConversationProcessNode =>
  node(id, 'tool', {
    executeId: id,
    componentType: 'ToolCall',
    processing: {
      executeId: id,
      name: id,
      type: 'ToolCall',
      status: 'FINISHED',
      result: { executeId: id, ...result },
    } as ConversationProcessNode['processing'],
    ...overrides,
  });

describe('composeConversationTraceItems', () => {
  it('连续两条工具成组，单条工具保持 standalone，正文切断分组', () => {
    const items = composeConversationTraceItems(
      [
        tool('read-1', { kind: 'read', input: { file_path: 'a.ts' } }),
        tool('edit-1', { kind: 'edit', input: { file_path: 'a.ts' } }),
        node('text-1', 'narration', { text: '第一阶段完成' }),
        tool('run-1', { kind: 'execute', input: { command: 'npm test' } }),
      ],
      true,
    );

    expect(items.map((item) => item.kind)).toEqual([
      'tool-group',
      'narration',
      'standalone',
    ]);
    expect(items[0]).toMatchObject({
      id: 'tool-group:read-1',
      kind: 'tool-group',
      active: false,
    });
  });

  it.each([
    'reasoning',
    'context',
    'plan',
    'subagent',
    'completed-interaction',
    'unknown',
  ] as const)('%s 节点切断前后工具组', (boundaryKind) => {
    const items = composeConversationTraceItems(
      [
        tool('before-1', { kind: 'read' }),
        tool('before-2', { kind: 'execute' }),
        node('boundary', boundaryKind),
        tool('after-1', { kind: 'read' }),
        tool('after-2', { kind: 'edit' }),
      ],
      true,
    );

    expect(items.map((item) => item.kind)).toEqual([
      'tool-group',
      'standalone',
      'tool-group',
    ]);
    expect(items[2]).toMatchObject({ active: true });
  });

  it('OpenUI Event 独立展示并切断分组', () => {
    const openUi = tool(
      'open-ui',
      {},
      {
        componentType: 'Event',
        title: 'Backend.Sandbox.Event.renderUI',
        processing: undefined,
      },
    );
    const items = composeConversationTraceItems(
      [
        tool('read-1', { kind: 'read' }),
        tool('run-1', { kind: 'execute' }),
        openUi,
        tool('edit-1', { kind: 'edit' }),
        tool('read-2', { kind: 'read' }),
      ],
      true,
    );

    expect(items.map((item) => item.kind)).toEqual([
      'tool-group',
      'standalone',
      'tool-group',
    ]);
  });

  it('todo 工具按独立计划节点展示并切断普通工具组', () => {
    const todo = tool('todo', {}, { title: '更新 todo 任务清单' });
    const items = composeConversationTraceItems(
      [
        tool('read-1', { kind: 'read' }),
        tool('run-1', { kind: 'execute' }),
        todo,
        tool('edit-1', { kind: 'edit' }),
        tool('read-2', { kind: 'read' }),
      ],
      true,
    );
    expect(items.map((item) => item.kind)).toEqual([
      'tool-group',
      'standalone',
      'tool-group',
    ]);
    expect(getNodeToolActionKind(todo)).toBe('todo');
  });

  it('组 id 随流式追加保持稳定，只有尾部活动组展开', () => {
    const first = tool('read-1', { kind: 'read' });
    const second = tool('run-1', { kind: 'execute' });
    const before = composeConversationTraceItems([first, second], true);
    const after = composeConversationTraceItems(
      [first, second, tool('edit-1', { kind: 'edit' })],
      true,
    );

    expect(before[0]).toMatchObject({
      id: 'tool-group:read-1',
      active: true,
    });
    expect(after[0]).toMatchObject({
      id: 'tool-group:read-1',
      active: true,
    });
  });

  it('终态无活动组；状态优先 running，再 failed，最后 finished', () => {
    const running = tool('run', { kind: 'execute' }, { status: 'running' });
    const failed = tool('failed', { kind: 'read' }, { status: 'failed' });
    const finished = tool('done', { kind: 'edit' });

    expect(getToolGroupStatus([failed, running, finished])).toBe('running');
    expect(getToolGroupStatus([failed, finished])).toBe('failed');
    expect(getToolGroupStatus([finished])).toBe('finished');
    expect(
      getToolGroupStatus([node('unknown', 'tool', { status: 'unknown' })]),
    ).toBe('finished');
    expect(
      composeConversationTraceItems([running, finished], false)[0],
    ).toMatchObject({ active: false });
  });

  it('动作类型按首次出现顺序去重，重复执行逐条保留', () => {
    const nodes = [
      tool('edit-1', { kind: 'edit' }),
      tool('read-1', { kind: 'read' }),
      tool('edit-2', { kind: 'write' }),
      tool('run-1', { kind: 'execute' }),
    ];
    const [group] = composeConversationTraceItems(nodes, true);

    expect(group.kind).toBe('tool-group');
    if (group.kind !== 'tool-group') return;
    expect(group.nodes.map((item) => item.id)).toEqual([
      'edit-1',
      'read-1',
      'edit-2',
      'run-1',
    ]);
    expect(getToolGroupActionKinds(group.nodes)).toEqual([
      'file-edit',
      'file-read',
      'terminal',
    ]);
  });

  it('Skill 仅有 Markdown 正文时也是真实可展开详情', () => {
    const skill = tool(
      'skill-1',
      { input: { skill_content: '# Browser skill\n\nOpen a page.' } },
      { componentType: 'Skill' },
    );
    expect(hasProcessNodeDetail(skill)).toBe(true);
  });
});
