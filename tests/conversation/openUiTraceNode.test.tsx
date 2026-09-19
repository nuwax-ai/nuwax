/**
 * V2 OpenUI 产物挂载渲染测试：
 * - OpenUiTraceNode：ready（openui-ref → artifactUrl 构建）/ input-only / absent → null /
 *   onOpenSidecar 透传；
 * - WorkTraceDisclosure 常显区：轨迹收起态 OpenUI 看板仍在 DOM；absent 节点回落
 *   轨迹体内普通工具行（对齐 V1 MarkdownCustomProcess 的降级口径）。
 */
import OpenUiTraceNode from '@/features/conversation/presentation-v2/react/OpenUiTraceNode';
import WorkTraceDisclosure from '@/features/conversation/presentation-v2/react/WorkTraceDisclosure';
import type {
  ConversationProcessNode,
  ConversationRenderPreferencesV2,
  ConversationTurnPresentationV2,
} from '@/features/conversation/presentation-v2/types';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { ProcessingEnum } from '@/types/enums/common';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('umi', () => ({
  useModel: () => ({}),
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string, ...values: (string | number)[]) =>
    values.length ? `${key}:${values.join(',')}` : key,
}));
vi.mock('@/features/conversation/presentation-v2/react/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/components/MarkdownRenderer', () => ({
  PureMarkdownRenderer: ({ children }: { children: string }) => (
    <div data-testid="pure-markdown">{children}</div>
  ),
}));
vi.mock('@/components/business-component/OpenUiArtifactView', () => ({
  default: (props: any) => (
    <div
      data-testid="openui-artifact-view"
      data-artifact-url={String(props.artifactUrl ?? '')}
      data-has-artifact={String(Boolean(props.artifact))}
      data-has-inline-input={String(Boolean(props.inlineInput))}
    >
      <button
        type="button"
        data-testid="openui-sidecar-trigger"
        onClick={() => props.onOpenSidecar?.({ artifactId: 'probe' })}
      >
        sidecar
      </button>
    </div>
  ),
}));

const OPEN_UI_REF = {
  type: 'nuwax.openui-ref',
  schemaVersion: 'nuwax.openui-ref/v1',
  artifactId: '1219fcb4-a107-4f92-abff-7f8922f1228d',
  path: 'data/1219fcb4-a107-4f92-abff-7f8922f1228d.openui.json',
  title: 'Gitee 仓库总览',
  presentation: { mode: 'inline', autoOpen: false },
  digest: `sha256:${'a'.repeat(64)}`,
  operation: 'created',
} as const;

const RENDER_INPUT = {
  schemaVersion: 'nuwax.openui/v1',
  title: '订单看板',
  presentation: { mode: 'inline', autoOpen: false, preferredWidth: 'wide' },
  document: {
    language: 'openui-lang',
    specVersion: '0.5',
    source: 'Stack [Text "hi"]',
  },
  bindings: { tools: [] },
  fallback: { markdown: '' },
};

/** 构造 OpenUI 轨迹节点：result 形态对齐 applyOpenUiToolCallSseEvent 产出的 processing */
const openUiNode = (
  result: unknown,
  componentType: AgentComponentTypeEnum = AgentComponentTypeEnum.ToolCall,
  status: 'running' | 'finished' | 'failed' = 'finished',
): ConversationProcessNode => ({
  id: 'op-1',
  kind: 'tool',
  title: 'Backend.Sandbox.Event.renderUI',
  summary: '',
  status,
  failed: status === 'failed',
  componentType,
  executeId: 'op-1',
  processing: {
    executeId: 'op-1',
    name: 'Backend.Sandbox.Event.renderUI',
    type: componentType,
    status:
      status === 'running'
        ? ProcessingEnum.EXECUTING
        : status === 'failed'
        ? ProcessingEnum.FAILED
        : ProcessingEnum.FINISHED,
    result,
  } as ConversationProcessNode['processing'],
});

const readyResult = () => ({
  executeId: 'op-1',
  name: 'Backend.Sandbox.Event.renderUI',
  success: true,
  data: OPEN_UI_REF,
  structuredContent: OPEN_UI_REF,
  rawOutput: { structuredContent: OPEN_UI_REF },
});

const inputOnlyResult = () => ({
  executeId: 'op-1',
  name: 'Backend.Sandbox.Event.renderUI',
  success: true,
  rawOutput: { input: RENDER_INPUT },
});

const PREFS: ConversationRenderPreferencesV2 = {
  preset: 'balanced',
  nodeOverrides: {},
};

const buildTurn = (
  nodes: ConversationProcessNode[],
  running = false,
): ConversationTurnPresentationV2 => ({
  key: 'turn-1',
  assistantMessages: [],
  nodes,
  finalAnswer: { text: '', source: 'none' },
  running,
  terminalStatus: 'complete',
  metrics: { toolCount: nodes.length, messageCount: 0 },
});

describe('OpenUiTraceNode', () => {
  it('ready（openui-ref）：透传 artifact 并构建产物文件 URL', async () => {
    render(
      <OpenUiTraceNode
        node={openUiNode(readyResult())}
        conversationId={1562078}
      />,
    );
    const view = await screen.findByTestId('openui-artifact-view');
    expect(view.dataset.hasArtifact).toBe('true');
    expect(view.dataset.artifactUrl).toContain('1562078');
    expect(view.dataset.artifactUrl).toContain(OPEN_UI_REF.artifactId);
  });

  it('input-only：内联 render input 透传，无 artifact 文件 URL', async () => {
    render(
      <OpenUiTraceNode
        node={openUiNode(inputOnlyResult())}
        conversationId={1562078}
      />,
    );
    const view = await screen.findByTestId('openui-artifact-view');
    expect(view.dataset.hasInlineInput).toBe('true');
    expect(view.dataset.hasArtifact).toBe('false');
    expect(view.dataset.artifactUrl).toBe('');
  });

  it('absent（终态退化）：不由渲染元素接管，渲染 null 回落普通行', () => {
    const { container } = render(
      <OpenUiTraceNode
        node={openUiNode({ executeId: 'op-1', success: true })}
        conversationId={1562078}
      />,
    );
    expect(container.querySelector('[data-testid="v2-openui-node"]')).toBeNull();
  });

  it('absent（执行窗）：渲染 null，回落普通行兜底', () => {
    const { container } = render(
      <OpenUiTraceNode
        node={openUiNode(undefined, AgentComponentTypeEnum.ToolCall, 'running')}
        conversationId={1562078}
      />,
    );
    expect(container.querySelector('[data-testid="v2-openui-node"]')).toBeNull();
  });

  it('onOpenSidecar 回调透传给 OpenUiArtifactView', async () => {
    const onOpenSidecar = vi.fn();
    render(
      <OpenUiTraceNode
        node={openUiNode(readyResult())}
        conversationId={1562078}
        onOpenSidecar={onOpenSidecar}
      />,
    );
    fireEvent.click(await screen.findByTestId('openui-sidecar-trigger'));
    expect(onOpenSidecar).toHaveBeenCalledWith(
      expect.objectContaining({ artifactId: 'probe' }),
    );
  });
});

describe('WorkTraceDisclosure · OpenUI 常显区', () => {
  it('轨迹收起态（终态轮默认）OpenUI 看板仍在 DOM，节点行不渲染', async () => {
    render(
      <WorkTraceDisclosure
        turn={buildTurn([openUiNode(readyResult())])}
        preferences={PREFS}
        onManualToggle={() => {}}
        conversationId={1562078}
      />,
    );
    // 收起态：折叠按钮在、轨迹体不在
    expect(screen.getByTestId('v2-trace-toggle')).toBeInTheDocument();
    expect(screen.queryByTestId('v2-node-disclosure')).toBeNull();
    // OpenUI 看板常显
    expect(
      await screen.findByTestId('v2-openui-node'),
    ).toBeInTheDocument();
    await screen.findByTestId('openui-artifact-view');
  });

  it('展开态：OpenUI 常显与轨迹体节点行共存', async () => {
    render(
      <WorkTraceDisclosure
        turn={buildTurn([openUiNode(readyResult())])}
        preferences={PREFS}
        manualExpanded
        onManualToggle={() => {}}
        conversationId={1562078}
      />,
    );
    expect(await screen.findByTestId('v2-openui-node')).toBeInTheDocument();
  });

  it('历史 Event 形态（finalResult 保留 Event componentType）同样常显', async () => {
    render(
      <WorkTraceDisclosure
        turn={buildTurn([
          openUiNode(readyResult(), AgentComponentTypeEnum.Event),
        ])}
        preferences={PREFS}
        onManualToggle={() => {}}
        conversationId={1562078}
      />,
    );
    expect(
      await screen.findByTestId('v2-openui-node'),
    ).toBeInTheDocument();
  });

  it('absent（终态退化）：回落普通行且动作词条化，协议名不外露、不进收起保持范围', () => {
    render(
      <WorkTraceDisclosure
        turn={buildTurn([openUiNode({ executeId: 'op-1', success: true })])}
        preferences={PREFS}
        manualExpanded
        onManualToggle={() => {}}
      />,
    );
    // 不由 OpenUI 渲染元素接管
    expect(screen.queryByTestId('v2-openui-node')).toBeNull();
    // 回落普通工具行，动作词条替代协议名
    const row = document.querySelector(
      '[data-node-id="op-1"][data-node-kind="tool"]',
    );
    expect(row).not.toBeNull();
    expect(row?.textContent).toContain('toolActionOpenUiFinished');
    expect(row?.textContent).not.toContain('Backend.Sandbox.Event.renderUI');
  });

  it('failed：回落普通行显示失败词条，不进收起保持范围', () => {
    render(
      <WorkTraceDisclosure
        turn={buildTurn([
          openUiNode(undefined, AgentComponentTypeEnum.ToolCall, 'failed'),
        ])}
        preferences={PREFS}
        manualExpanded
        onManualToggle={() => {}}
      />,
    );
    expect(screen.queryByTestId('v2-openui-node')).toBeNull();
    const row = document.querySelector(
      '[data-node-id="op-1"][data-node-kind="tool"]',
    );
    expect(row).not.toBeNull();
    expect(row?.textContent).toContain('toolActionOpenUiFailed');
    expect(row?.textContent).not.toContain('Backend.Sandbox.Event.renderUI');
  });

  it('运行轮（running）默认展开，OpenUI 常显不受影响', async () => {
    render(
      <WorkTraceDisclosure
        turn={buildTurn([openUiNode(inputOnlyResult())], true)}
        preferences={PREFS}
        onManualToggle={() => {}}
        conversationId={1562078}
      />,
    );
    const view = await screen.findByTestId('openui-artifact-view');
    await waitFor(() => expect(view.dataset.hasInlineInput).toBe('true'));
    expect(screen.queryByTestId('v2-openui-node')).not.toBeNull();
  });
});
