import ProcessNodeRow from '@/features/conversation/presentation-v2/react/ProcessNodeRow';
import TodoTraceNode from '@/features/conversation/presentation-v2/react/TodoTraceNode';
import ToolGroupDisclosure from '@/features/conversation/presentation-v2/react/ToolGroupDisclosure';
import {
  isTodoTraceNode,
  readPlanSteps,
} from '@/features/conversation/presentation-v2/traceItems';
import type { ConversationProcessNode } from '@/features/conversation/presentation-v2/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// 重依赖 mock 照 tests/conversation/toolNodeDetailComponent.test.tsx 模板:
// umi / MarkdownRenderer 传递依赖会拉进 esbuild,vitest 环境必崩,须替换。
vi.mock('umi', () => ({
  useModel: () => ({}),
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));
// SvgIcon 内部读自身 css-modules,vitest 环境未编译——以轻量桩替换
vi.mock('@/components/base/SvgIcon', () => ({
  default: ({ name }: { name: string }) => <span data-svg-icon={name} />,
}));
vi.mock('@/components/MarkdownRenderer', () => ({
  default: ({ answer }: { answer: string }) => (
    <div data-testid="markdown-renderer">{answer}</div>
  ),
  PureMarkdownRenderer: ({ children }: { children: string }) => (
    <div data-testid="pure-markdown">{children}</div>
  ),
}));
vi.mock('@/features/conversation/presentation-v2/react/index.less', () => ({
  default: new Proxy({}, { get: (_target, key: string) => key }),
}));

const SUMMARY_TEXT = 'Wait — but there is a subtlety: getToolNodePresentation';

describe('思考行完成态时长', () => {
  it('有 durationMs:渲染「持续了」词条替代首行摘要', () => {
    render(
      <ProcessNodeRow
        expanded={false}
        onToggle={() => {}}
        node={
          {
            id: 'think-done',
            kind: 'reasoning',
            title: '',
            summary: SUMMARY_TEXT,
            thinkText: `${SUMMARY_TEXT}\n第二行`,
            status: 'finished',
            failed: false,
            durationMs: 73_000,
          } as any
        }
      />,
    );
    const row = screen.getByRole('button');
    expect(row.textContent).toContain('nodeThinkingDuration');
    expect(row.textContent).not.toContain(SUMMARY_TEXT);
    expect(row.querySelector('.node-dot')).not.toBeNull();
  });

  it('历史无 durationMs:降级回首行摘要', () => {
    render(
      <ProcessNodeRow
        expanded={false}
        onToggle={() => {}}
        node={
          {
            id: 'think-legacy',
            kind: 'reasoning',
            title: '',
            summary: SUMMARY_TEXT,
            thinkText: `${SUMMARY_TEXT}\n第二行`,
            status: 'finished',
            failed: false,
          } as any
        }
      />,
    );
    const row = screen.getByRole('button');
    expect(row.textContent).toContain(SUMMARY_TEXT);
    expect(row.textContent).not.toContain('nodeThinkingDuration');
  });

  it('durationMs 不足 1 秒（bug2492 突发落盘形态）:不显示「持续了 0 秒」，回落首行摘要', () => {
    render(
      <ProcessNodeRow
        expanded={false}
        onToggle={() => {}}
        node={
          {
            id: 'think-burst',
            kind: 'reasoning',
            title: '',
            summary: SUMMARY_TEXT,
            thinkText: `${SUMMARY_TEXT}\n第二行`,
            status: 'finished',
            failed: false,
            durationMs: 300,
          } as any
        }
      />,
    );
    const row = screen.getByRole('button');
    // 展示层双保险：秒级粒度不可读的窗口回落摘要，绝不渲染「持续了 0 秒」
    expect(row.textContent).toContain(SUMMARY_TEXT);
    expect(row.textContent).not.toContain('nodeThinkingDuration');
  });
});

describe('待办清单数据判定 readPlanSteps / isTodoTraceNode', () => {
  const planNodeWith = (data: unknown) =>
    ({
      id: 'plan-1',
      kind: 'plan',
      title: '',
      summary: '',
      status: 'finished',
      failed: false,
      processing: { result: { data } },
    } as any);

  it('结构化步骤数组:解析并接管', () => {
    const steps = readPlanSteps({
      data: [
        { status: 'completed', content: '初始化项目' },
        { status: 'in_progress', content: '编写入口' },
        { status: 'weird-status', content: '未知状态归为待办' },
        { content: '' }, // 无内容项被剔除
      ],
    });
    expect(steps).toEqual([
      { status: 'completed', content: '初始化项目' },
      { status: 'in_progress', content: '编写入口' },
      { status: 'pending', content: '未知状态归为待办' },
    ]);
    expect(isTodoTraceNode(planNodeWith(steps))).toBe(true);
  });

  it('非结构化数据(字符串/空数组/无 content):不接管,回落普通行', () => {
    expect(readPlanSteps({ data: 'free text' })).toBeNull();
    expect(readPlanSteps({ data: [] })).toBeNull();
    expect(readPlanSteps({ data: [{ status: 'pending' }] })).toBeNull();
    expect(readPlanSteps({})).toBeNull();
    expect(isTodoTraceNode(planNodeWith(null))).toBe(false);
    // 非 plan 节点即便携带步骤数据也不接管
    expect(
      isTodoTraceNode({
        ...planNodeWith([{ status: 'pending', content: 'x' }]),
        kind: 'tool',
      }),
    ).toBe(false);
  });
});

describe('待办卡 TodoTraceNode 三态', () => {
  const buildNode = (status: 'running' | 'finished') =>
    ({
      id: 'todo-node',
      kind: 'plan',
      title: '',
      summary: '',
      status,
      failed: false,
      processing: {
        result: {
          data: [
            { status: 'completed', content: '第一步' },
            { status: 'in_progress', content: '第二步' },
            { status: 'pending', content: '第三步' },
          ],
        },
      },
    } as any);

  it('运行中:默认展开,头部带进度 N/M 与三态项', () => {
    render(<TodoTraceNode node={buildNode('running')} />);
    const toggle = screen.getByTestId('v2-todo-trace-toggle');
    expect(toggle.textContent).toContain('todoTraceTitle');
    expect(toggle.textContent).toContain('1/3');
    const card = screen.getByTestId('v2-todo-trace');
    expect(card.querySelector('.todo-step')).not.toBeNull();
    expect(card.querySelector('.is-completed')).not.toBeNull();
    expect(card.querySelector('.is-in-progress')).not.toBeNull();
  });

  it('运行中手动收起后,翻终态不再被自动收起逻辑翻转(保持手动选择)', () => {
    const { rerender } = render(<TodoTraceNode node={buildNode('running')} />);
    fireEvent.click(screen.getByTestId('v2-todo-trace-toggle'));
    expect(
      screen.getByTestId('v2-todo-trace').querySelector('.todo-step'),
    ).toBeNull();
    // 手动重新展开,随后结束:自动收起只作用于「未手动干预」的展开态——
    // 结束沿自动收起一次;此后展开为用户态
    fireEvent.click(screen.getByTestId('v2-todo-trace-toggle'));
    rerender(<TodoTraceNode node={buildNode('finished')} />);
    expect(
      screen.getByTestId('v2-todo-trace').querySelector('.todo-step'),
    ).toBeNull();
  });

  it('历史(首挂即终态):默认收起,点头部展开', () => {
    render(<TodoTraceNode node={buildNode('finished')} />);
    const card = screen.getByTestId('v2-todo-trace');
    expect(card.querySelector('.todo-step')).toBeNull();
    fireEvent.click(screen.getByTestId('v2-todo-trace-toggle'));
    expect(card.querySelector('.todo-step')).not.toBeNull();
  });
});

describe('工具组头计数', () => {
  const toolNode = (id: string, name: string, resultKind: string) =>
    ({
      id,
      kind: 'tool',
      title: name,
      summary: '',
      status: 'finished',
      failed: false,
      processing: {
        executeId: id,
        name,
        status: 'FINISHED',
        type: 'ToolCall',
        result: { kind: resultKind, success: true, input: {} },
      },
    } as any);

  const buildGroup = (
    nodes: ConversationProcessNode[],
    status: ConversationProcessNode['status'],
  ) => ({
    kind: 'tool-group' as const,
    id: 'group-1',
    nodes,
    actionKinds: ['file-read', 'terminal'] as any,
    status,
    active: false,
  });

  it('终态:按动作类计数拼接,运行中的类保持动词词条', () => {
    const readFile = toolNode('g-r1', 'read_file', 'read');
    const readFile2 = toolNode('g-r2', 'read_file', 'read');
    const runningTerm = {
      ...toolNode('g-t1', 'run_command', 'execute'),
      status: 'running',
      processing: {
        ...toolNode('g-t1', 'run_command', 'execute').processing,
        status: 'EXECUTING',
      },
    };
    render(
      <ToolGroupDisclosure
        group={buildGroup([readFile, readFile2, runningTerm], 'running')}
        nodes={[readFile, readFile2, runningTerm]}
        expanded={false}
        onToggle={() => {}}
        nodeIsExpanded={() => false}
        onToggleNode={() => {}}
      />,
    );
    const toggle = screen.getByRole('button');
    // 已完成的读取类计数:读取了 2 个文件
    expect(toggle.textContent).toContain('toolGroupCountFileRead');
    // 运行中的终端类保持动词词条,不计数
    expect(toggle.textContent).toContain('toolActionTerminalRunning');
    expect(toggle.textContent).not.toContain('toolGroupCountTerminal');
  });

  it('终态混合组:两类都计数', () => {
    const readFile = toolNode('g-r1', 'read_file', 'read');
    const term = toolNode('g-t1', 'run_command', 'execute');
    render(
      <ToolGroupDisclosure
        group={buildGroup([readFile, term], 'finished')}
        nodes={[readFile, term]}
        expanded={false}
        onToggle={() => {}}
        nodeIsExpanded={() => false}
        onToggleNode={() => {}}
      />,
    );
    const toggle = screen.getByRole('button');
    expect(toggle.textContent).toContain('toolGroupCountFileRead');
    expect(toggle.textContent).toContain('toolGroupCountTerminal');
  });
});
