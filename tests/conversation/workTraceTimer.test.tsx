import WorkTraceDisclosure from '@/features/conversation/presentation-v2/react/WorkTraceDisclosure';
import { normalizeV2ToolDetail } from '@/features/conversation/presentation-v2/toolDetail';
import type {
  ConversationProcessNode,
  ConversationTurnPresentationV2,
} from '@/features/conversation/presentation-v2/types';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { ProcessingEnum } from '@/types/enums/common';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { renderMarkdown } = vi.hoisted(() => ({ renderMarkdown: vi.fn() }));

vi.mock('@/hooks/useUnifiedTheme', () => ({
  useUnifiedTheme: () => ({ data: { antdTheme: 'light' } }),
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string, ...values: (string | number)[]) =>
    values.length ? `${key}:${values.join(',')}` : key,
}));
// SvgIcon 内部读自身 css-modules,vitest 环境未编译——以轻量桩替换
vi.mock('@/components/base/SvgIcon', () => ({
  default: ({ name }: { name: string }) => <span data-svg-icon={name} />,
}));
vi.mock('@/components/MarkdownRenderer', () => ({
  PureMarkdownRenderer: ({ children }: { children: string }) => {
    renderMarkdown(children);
    return <div data-testid="trace-markdown">{children}</div>;
  },
}));
vi.mock('@/features/conversation/presentation-v2/toolDetail', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/conversation/presentation-v2/toolDetail')
  >('@/features/conversation/presentation-v2/toolDetail');
  return {
    ...actual,
    normalizeV2ToolDetail: vi.fn(actual.normalizeV2ToolDetail),
  };
});
vi.mock('@/features/conversation/presentation-v2/react/index.less', () => ({
  default: new Proxy({}, { get: (_target, key: string) => key }),
}));

const preferences = { preset: 'balanced', nodeOverrides: {} } as const;

const createTurn = (): ConversationTurnPresentationV2 => ({
  key: 'running-tools',
  assistantMessages: [],
  nodes: [
    {
      id: 'narration',
      kind: 'narration',
      title: '',
      summary: '',
      text: '检查改动并执行验证。',
      status: 'finished',
      failed: false,
    },
    ...[
      {
        id: 'edit',
        title: '编辑文件',
        status: 'finished',
        result: {
          kind: 'edit',
          input: {
            file_path: '/home/user/123/main.ts',
            diff: '--- a/main.ts\n+++ b/main.ts\n@@ -1 +1 @@\n-old\n+new',
          },
        },
      },
      {
        id: 'execute',
        title: '执行验证',
        status: 'running',
        result: {
          kind: 'execute',
          input: { command: 'npm test' },
          data: '验证中',
        },
      },
    ].map(
      ({ id, title, status, result }) =>
        ({
          id,
          kind: 'tool',
          title,
          summary: '',
          status,
          failed: false,
          componentType: AgentComponentTypeEnum.ToolCall,
          processing: {
            executeId: id,
            name: title,
            type: AgentComponentTypeEnum.ToolCall,
            status:
              status === 'running'
                ? ProcessingEnum.EXECUTING
                : ProcessingEnum.FINISHED,
            result,
          },
        } as ConversationProcessNode),
    ),
  ],
  finalAnswer: { text: '', source: 'none' },
  running: true,
  terminalStatus: 'complete',
  metrics: { toolCount: 2, messageCount: 0, elapsedAnchor: Date.now() },
});

describe('运行中工作轨迹计时隔离', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-16T00:00:00Z'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('默认展开的活动工具组只更新耗时，不重复处理折叠工具结果或正文', () => {
    const { container } = render(
      <WorkTraceDisclosure
        turn={createTurn()}
        preferences={preferences}
        onManualToggle={vi.fn()}
      />,
    );
    const traceToggle = screen.getByTestId('v2-trace-toggle');
    expect(traceToggle).toHaveAttribute('aria-expanded', 'true');
    expect(traceToggle).toHaveTextContent('00:00');
    expect(container.querySelectorAll('[data-node-id]')).toHaveLength(2);
    expect(container.querySelector('[data-tool-detail-kind]')).toBeNull();
    const normalizedAtMount = vi.mocked(normalizeV2ToolDetail).mock.calls
      .length;
    expect(normalizedAtMount).toBeGreaterThan(0);
    const markdownAtMount = renderMarkdown.mock.calls.length;

    for (let second = 1; second <= 3; second += 1) {
      act(() => vi.advanceTimersByTime(1000));
      expect(traceToggle).toHaveTextContent(`00:0${second}`);
    }

    expect(normalizeV2ToolDetail).toHaveBeenCalledTimes(normalizedAtMount);
    expect(renderMarkdown).toHaveBeenCalledTimes(markdownAtMount);
  });

  it('展开工具详情后计时保持内容不重算，工具结果和终态仍能更新', () => {
    const turn = createTurn();
    const view = render(
      <WorkTraceDisclosure
        turn={turn}
        preferences={preferences}
        manualExpanded
        onManualToggle={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /npm test/ }));
    expect(
      view.container.querySelector('[data-tool-detail-kind="terminal"]'),
    ).toHaveTextContent('验证中');
    const normalizedAtExpansion = vi.mocked(normalizeV2ToolDetail).mock.calls
      .length;
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByTestId('v2-trace-toggle')).toHaveTextContent('00:02');
    expect(normalizeV2ToolDetail).toHaveBeenCalledTimes(normalizedAtExpansion);

    const terminalTurn: ConversationTurnPresentationV2 = {
      ...turn,
      running: false,
      metrics: { ...turn.metrics, elapsedMs: 2000 },
      nodes: turn.nodes.map((node) =>
        node.id === 'execute'
          ? {
              ...node,
              status: 'finished',
              processing: {
                ...node.processing!,
                status: ProcessingEnum.FINISHED,
                result: { ...node.processing!.result!, data: '验证通过' },
              },
            }
          : node,
      ),
    };
    view.rerender(
      <WorkTraceDisclosure
        turn={terminalTurn}
        preferences={preferences}
        manualExpanded
        onManualToggle={vi.fn()}
      />,
    );
    // 活动组终态自动收起，再次展开仍保留工具详情的手动选择。
    fireEvent.click(
      view.container.querySelector('[data-tool-group-id] > button')!,
    );
    expect(
      view.container.querySelector('[data-tool-detail-kind="terminal"]'),
    ).toHaveTextContent('验证通过');
    const terminalLabel = screen.getByTestId('v2-trace-toggle').textContent;
    expect(terminalLabel).toContain('traceMetricElapsed:2');
    const normalizedAtFinish = vi.mocked(normalizeV2ToolDetail).mock.calls
      .length;
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByTestId('v2-trace-toggle')).toHaveTextContent(
      terminalLabel!,
    );
    expect(normalizeV2ToolDetail).toHaveBeenCalledTimes(normalizedAtFinish);
  });
});
