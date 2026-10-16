import ProcessNodeRow from '@/features/conversation/presentation-v2/react/ProcessNodeRow';
import TodoTraceNode from '@/features/conversation/presentation-v2/react/TodoTraceNode';
import {
  isTodoTraceNode,
  readPlanSteps,
} from '@/features/conversation/presentation-v2/traceItems';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// 仅替换视图重依赖，保留实际步骤解析与折叠状态：
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
});
