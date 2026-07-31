import type { OpenUiArtifact } from '@/types/interfaces/openUi';
import { legacyArtifactToOpenUiFile } from '@/utils/openUiArtifact';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { registerOpenUiActionSender } from './actionRegistry';
import OpenUiArtifactView, { OpenUiRuntimeFrame } from './index';

vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@openuidev/react-lang', () => ({
  Renderer: ({
    response,
    onAction,
    onStateUpdate,
  }: {
    response: string;
    onAction?: (event: Record<string, unknown>) => void;
    onStateUpdate?: (state: Record<string, unknown>) => void;
  }) => (
    <div data-testid="openui-renderer" data-response={response}>
      <button
        type="button"
        data-testid="openui-submit"
        onClick={() => {
          onStateUpdate?.({ test: { name: { value: '张三' } } });
          onAction?.({
            type: 'ToAssistant',
            params: {},
            humanFriendlyMessage: '用户提交了 inline 表单',
            formName: 'test',
          });
        }}
      />
    </div>
  ),
}));
vi.mock('@openuidev/react-ui/genui-lib', () => ({ openuiLibrary: {} }));
vi.mock('@openuidev/react-ui', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
// OpenUiRuntimeFrame 经 useModel('layout') 取 isMobile、并 import mobile-layout；
// 后者传递依赖 @umijs/bundler-utils → esbuild，在 vitest 下会崩，须一并 mock。
vi.mock('umi', () => ({ useModel: () => ({ isMobile: false }) }));
vi.mock('@nuwax-ai/openui-mcp/mobile-layout', () => ({
  createMobileAwareLibrary: (library: unknown) => library,
  MobileLayoutProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));
vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

// sidecar 摘要复用 TaskResultRow 叶子展示组件；此处按黑盒 mock，
// 仅验证 OpenUiArtifactView 正确传入了 label 与 onClick。
vi.mock('@/components/MarkdownRenderer/TaskResult/TaskResultRow', () => ({
  default: ({ label, onClick }: { label: string; onClick?: () => void }) => (
    <div data-testid="openui-sidecar-row" onClick={onClick}>
      {label}
    </div>
  ),
}));

const baseArtifact: OpenUiArtifact = {
  type: 'nuwax.openui',
  schemaVersion: 'nuwax.openui/v1',
  artifactId: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Deployment summary',
  presentation: { mode: 'inline', autoOpen: false },
  document: {
    language: 'openui-lang',
    specVersion: '0.5',
    source: 'root = TextContent("Ready", "large-heavy")',
    digest: `sha256:${'a'.repeat(64)}`,
  },
  bindings: { tools: [] },
  fallback: { markdown: 'Deployment is ready.' },
  createdAt: '2026-07-21T08:00:00.000Z',
  expiresAt: '2099-07-21T09:00:00.000Z',
};

describe('OpenUiArtifactView', () => {
  it('uses the original Renderer for legacy inline artifacts', () => {
    const { container } = render(
      <OpenUiArtifactView artifact={baseArtifact} />,
    );
    expect(screen.getByTestId('openui-renderer')).toHaveAttribute(
      'data-response',
      baseArtifact.document.source,
    );
    expect(
      container.querySelector('[data-openui-render-mode="renderer"]'),
    ).toHaveAttribute('data-openui-theme', 'light');
  });

  it('uses tool input with the original Renderer for file-reference inline artifacts', () => {
    const reference: OpenUiArtifact = {
      type: 'nuwax.openui-ref',
      schemaVersion: 'nuwax.openui-ref/v1',
      artifactId: baseArtifact.artifactId,
      path: `data/${baseArtifact.artifactId}.openui.json`,
      title: baseArtifact.title,
      presentation: baseArtifact.presentation,
      digest: baseArtifact.document.digest,
      operation: 'created',
    };
    render(
      <OpenUiArtifactView
        artifact={reference}
        inlineInput={{
          schemaVersion: 'nuwax.openui/v1',
          title: baseArtifact.title,
          presentation: baseArtifact.presentation,
          document: {
            language: 'openui-lang',
            specVersion: '0.5',
            source: baseArtifact.document.source,
          },
          bindings: { tools: [] },
          fallback: baseArtifact.fallback,
        }}
      />,
    );
    expect(screen.getByTestId('openui-renderer')).toHaveAttribute(
      'data-response',
      baseArtifact.document.source,
    );
  });

  it('uses tool input when the transport omitted the artifact reference', () => {
    render(
      <OpenUiArtifactView
        inlineArtifactId="call-inline"
        inlineInput={{
          schemaVersion: 'nuwax.openui/v1',
          title: baseArtifact.title,
          presentation: baseArtifact.presentation,
          document: {
            language: 'openui-lang',
            specVersion: '0.5',
            source: baseArtifact.document.source,
          },
          bindings: { tools: [] },
          fallback: baseArtifact.fallback,
        }}
      />,
    );

    expect(screen.getByTestId('openui-renderer')).toHaveAttribute(
      'data-response',
      baseArtifact.document.source,
    );
  });

  it('forwards an input-only inline form action to the conversation sender', async () => {
    const sender = vi.fn();
    const unregister = registerOpenUiActionSender(2336, sender);
    render(
      <OpenUiArtifactView
        conversationId={2336}
        inlineArtifactId={baseArtifact.artifactId}
        inlineInput={{
          artifactId: baseArtifact.artifactId,
          schemaVersion: 'nuwax.openui/v1',
          title: 'Inline 表单提交测试',
          presentation: baseArtifact.presentation,
          document: {
            language: 'openui-lang',
            specVersion: '0.5',
            source: baseArtifact.document.source,
          },
          bindings: { tools: [] },
          fallback: baseArtifact.fallback,
        }}
      />,
    );

    fireEvent.click(screen.getByTestId('openui-submit'));

    await waitFor(() => expect(sender).toHaveBeenCalledTimes(1));
    expect(sender.mock.calls[0][0]).toMatchObject({
      artifactId: baseArtifact.artifactId,
      title: 'Inline 表单提交测试',
    });
    expect(sender.mock.calls[0][1]).toMatchObject({
      artifactId: baseArtifact.artifactId,
      actionName: 'ToAssistant',
      values: { test: { name: { value: '张三' } } },
    });
    unregister();
  });

  it('opens sidecar artifacts through the host preview callback', () => {
    const onOpenSidecar = vi.fn();
    const sidecar = {
      ...baseArtifact,
      presentation: { mode: 'sidecar' as const, autoOpen: false },
    };
    render(
      <OpenUiArtifactView artifact={sidecar} onOpenSidecar={onOpenSidecar} />,
    );
    // sidecar 摘要现为 TaskResult 风格的可点击行（div + onClick），点击标题文本冒泡触发
    fireEvent.click(screen.getByText(sidecar.title));
    expect(onOpenSidecar).toHaveBeenCalledWith(sidecar);
  });

  it('always loads the iframe Runtime with the light theme', () => {
    const { container } = render(
      <OpenUiRuntimeFrame
        artifact={legacyArtifactToOpenUiFile(baseArtifact)}
      />,
    );
    const frame = container.querySelector('iframe');
    expect(frame?.contentWindow).toBeTruthy();
    const postMessage = vi.spyOn(frame!.contentWindow!, 'postMessage');

    fireEvent.load(frame!);

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'OPENUI_LOAD', theme: 'light' }),
      '*',
    );
  });

  it('does not reset to loading when filePath is unchanged and only initialArtifact reference changes', async () => {
    // 回归：sidecar 多次「打开预览」会新建 openUiArtifactFile 对象；
    // file_path 模式下若因此重置 loading，iframe 不重载则永远等不到 OPENUI_READY。
    const filePath = `/${123}/data/${baseArtifact.artifactId}.openui.json`;
    const firstFile = legacyArtifactToOpenUiFile(baseArtifact);
    const { container, rerender } = render(
      <OpenUiRuntimeFrame
        artifact={firstFile}
        filePath={filePath}
        expectedArtifactId={baseArtifact.artifactId}
        expectedDigest={baseArtifact.document.digest}
        variant="full"
      />,
    );
    const frame = container.querySelector('iframe');
    expect(frame).toBeTruthy();
    const nonce = new URL(
      frame!.getAttribute('src')!,
      'http://localhost',
    ).searchParams.get('nonce');

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          source: frame!.contentWindow,
          data: {
            type: 'OPENUI_READY',
            protocolVersion: 'nuwax.openui-runtime/v1',
            nonce,
          },
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.queryByText('PC.Components.OpenUi.loading'),
      ).not.toBeInTheDocument();
    });

    // 模拟再次点击「打开预览」：同内容、新对象引用
    const secondFile = legacyArtifactToOpenUiFile(baseArtifact);
    expect(secondFile).not.toBe(firstFile);

    rerender(
      <OpenUiRuntimeFrame
        artifact={secondFile}
        filePath={filePath}
        expectedArtifactId={baseArtifact.artifactId}
        expectedDigest={baseArtifact.document.digest}
        variant="full"
      />,
    );

    // 不应回到 loading；iframe nonce 也不应变（未强制重载）
    expect(
      screen.queryByText('PC.Components.OpenUi.loading'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('PC.Components.OpenUi.renderFailed'),
    ).not.toBeInTheDocument();
    const frameAfter = container.querySelector('iframe');
    expect(
      new URL(
        frameAfter!.getAttribute('src')!,
        'http://localhost',
      ).searchParams.get('nonce'),
    ).toBe(nonce);
  });

  it('does not flash timed-out failure when switching to another inline artifact', () => {
    // 回归：文件树连续切换 .openui.json 时，上一文件若已 timeout failed，
    // 新文件第一帧不得再展示「界面渲染失败 / OpenUI Runtime timed out」。
    vi.useFakeTimers();
    const fileA = legacyArtifactToOpenUiFile(baseArtifact);
    const fileB = legacyArtifactToOpenUiFile({
      ...baseArtifact,
      artifactId: '660e8400-e29b-41d4-a716-446655440001',
      title: 'Other board',
      document: {
        ...baseArtifact.document,
        source: 'root = TextContent("Other", "large-heavy")',
        digest: `sha256:${'b'.repeat(64)}`,
      },
    });

    const { rerender } = render(
      <OpenUiRuntimeFrame
        artifact={fileA}
        expectedArtifactId={fileA.artifactId}
        expectedDigest={fileA.document.digest}
        variant="full"
      />,
    );

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(
      screen.getByText('PC.Components.OpenUi.renderFailed'),
    ).toBeInTheDocument();
    expect(screen.getByText('OpenUI Runtime timed out.')).toBeInTheDocument();

    rerender(
      <OpenUiRuntimeFrame
        artifact={fileB}
        expectedArtifactId={fileB.artifactId}
        expectedDigest={fileB.document.digest}
        variant="full"
      />,
    );

    expect(
      screen.queryByText('PC.Components.OpenUi.renderFailed'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('OpenUI Runtime timed out.'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('PC.Components.OpenUi.loading'),
    ).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('does not reload the iframe when switching artifacts while loading', () => {
    // 回归：切换 artifact 不再重载 iframe（走 OPENUI_LOAD 增量更新）。
    // loading 态切换时 iframe 的 nonce/src 应保持不变，避免反复重载 3.4MB runtime。
    const fileA = legacyArtifactToOpenUiFile(baseArtifact);
    const fileB = legacyArtifactToOpenUiFile({
      ...baseArtifact,
      artifactId: '770e8400-e29b-41d4-a716-446655440002',
      title: 'Board B',
      document: {
        ...baseArtifact.document,
        source: 'root = TextContent("B", "large-heavy")',
        digest: `sha256:${'c'.repeat(64)}`,
      },
    });

    const { container, rerender } = render(
      <OpenUiRuntimeFrame
        artifact={fileA}
        expectedArtifactId={fileA.artifactId}
        expectedDigest={fileA.document.digest}
        variant="full"
      />,
    );

    const frame = container.querySelector('iframe')!;
    const nonceOf = () =>
      new URL(frame.getAttribute('src')!, 'http://localhost').searchParams.get(
        'nonce',
      );
    const nonceA = nonceOf();
    expect(nonceA).toBeTruthy();

    // 切到 B（仍 loading，未派发 OPENUI_READY）——不应重载
    rerender(
      <OpenUiRuntimeFrame
        artifact={fileB}
        expectedArtifactId={fileB.artifactId}
        expectedDigest={fileB.document.digest}
        variant="full"
      />,
    );

    expect(container.querySelector('iframe')).toBe(frame);
    expect(nonceOf()).toBe(nonceA);
  });

  it('updates artifact via OPENUI_LOAD without reloading when already ready', () => {
    // 核心回归：ready 态切换 artifact 时 iframe 不重载，而是经 OPENUI_LOAD 增量更新。
    const fileA = legacyArtifactToOpenUiFile(baseArtifact);
    const fileB = legacyArtifactToOpenUiFile({
      ...baseArtifact,
      artifactId: '880e8400-e29b-41d4-a716-446655440003',
      title: 'Board C',
      document: {
        ...baseArtifact.document,
        source: 'root = TextContent("C", "large-heavy")',
        digest: `sha256:${'d'.repeat(64)}`,
      },
    });

    const { container, rerender } = render(
      <OpenUiRuntimeFrame
        artifact={fileA}
        expectedArtifactId={fileA.artifactId}
        expectedDigest={fileA.document.digest}
        variant="full"
      />,
    );

    const frame = container.querySelector('iframe')!;
    const nonce = new URL(
      frame.getAttribute('src')!,
      'http://localhost',
    ).searchParams.get('nonce');

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          source: frame.contentWindow,
          data: {
            type: 'OPENUI_READY',
            protocolVersion: 'nuwax.openui-runtime/v1',
            nonce,
          },
        }),
      );
    });

    const postMessage = vi.spyOn(frame.contentWindow!, 'postMessage');

    // ready 态切到 B
    rerender(
      <OpenUiRuntimeFrame
        artifact={fileB}
        expectedArtifactId={fileB.artifactId}
        expectedDigest={fileB.document.digest}
        variant="full"
      />,
    );

    // 不重载：同一 iframe、nonce 不变
    expect(container.querySelector('iframe')).toBe(frame);
    expect(
      new URL(frame.getAttribute('src')!, 'http://localhost').searchParams.get(
        'nonce',
      ),
    ).toBe(nonce);

    // 且向 runtime 发出带新 artifact 的 OPENUI_LOAD（增量更新）
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'OPENUI_LOAD', artifact: fileB }),
      '*',
    );
  });

  it.each(['inline', 'full'] as const)(
    'forwards %s Runtime iframe actions to the conversation sender',
    async (variant) => {
      const sender = vi.fn();
      const unregister = registerOpenUiActionSender(2336, sender);
      const artifact = legacyArtifactToOpenUiFile(baseArtifact);
      const { container } = render(
        <OpenUiRuntimeFrame
          artifact={artifact}
          conversationId={2336}
          variant={variant}
        />,
      );
      const frame = container.querySelector('iframe');
      const nonce = new URL(
        frame!.getAttribute('src')!,
        'http://localhost',
      ).searchParams.get('nonce');
      const action = {
        type: 'nuwax.openui-action',
        schemaVersion: 'nuwax.openui-action/v1',
        actionId: `action-${variant}`,
        artifactId: artifact.artifactId,
        artifactPath: `data/${artifact.artifactId}.openui.json`,
        actionName: 'continue_conversation',
        values: { form: { name: { value: '张三' } } },
        formName: 'form',
        humanFriendlyMessage: '用户提交了 inline 表单',
        submittedAt: '2026-07-23T00:00:00.000Z',
      };

      window.dispatchEvent(
        new MessageEvent('message', {
          source: frame!.contentWindow,
          data: {
            type: 'OPENUI_ACTION',
            protocolVersion: 'nuwax.openui-runtime/v1',
            nonce,
            event: action,
          },
        }),
      );

      await waitFor(() =>
        expect(sender).toHaveBeenCalledWith(artifact, action),
      );
      unregister();
    },
  );
});
