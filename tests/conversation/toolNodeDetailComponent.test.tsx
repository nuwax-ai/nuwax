import ProcessNodeRow from '@/features/conversation/presentation-v2/react/ProcessNodeRow';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { ProcessingEnum } from '@/types/enums/common';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// 重依赖 mock 照 tests/conversationRendererComponent.test.tsx 模板:
// umi / MarkdownRenderer 传递依赖会拉进 esbuild,vitest 环境必崩,须替换。
vi.mock('umi', () => ({
  useModel: () => ({}),
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));
vi.mock('@/components/MarkdownRenderer', () => ({
  default: ({ answer }: { answer: string }) => (
    <div data-testid="markdown-renderer">{answer}</div>
  ),
  PureMarkdownRenderer: ({ children }: { children: string }) => (
    <div data-testid="pure-markdown">{children}</div>
  ),
}));

vi.mock('@/components/base/CopyButton', () => ({
  default: ({ text }: { text?: string }) => (
    <button type="button" data-testid="copy-button" data-copy-text={text} />
  ),
}));
vi.mock(
  '@/components/business-component/ConversationShareModal/ShareMessageButton',
  () => ({
    default: ({ text }: { text: string }) => (
      <span data-testid="share-message-btn" data-share-text={text} />
    ),
  }),
);

vi.mock('@/features/conversation/presentation-v2/react/index.less', () => ({
  default: new Proxy({}, { get: (_target, key: string) => key }),
}));

describe('V2 真实工具节点详情', () => {
  it('外层标题只渲染一次，execute 详情不再嵌套旧工具卡或协议 JSON', () => {
    const title = "终端执行 nuwa-browser <<'EOF'";
    const { rerender } = render(
      <ProcessNodeRow
        expanded={false}
        onToggle={() => {}}
        node={
          {
            id: 'call-real',
            kind: 'tool',
            title,
            summary: '',
            status: 'failed',
            failed: true,
            componentType: AgentComponentTypeEnum.ToolCall,
            processing: {
              executeId: 'call-real',
              name: title,
              status: ProcessingEnum.FAILED,
              type: AgentComponentTypeEnum.ToolCall,
              result: {
                kind: 'execute',
                success: false,
                input: {
                  command: "nuwa-browser <<'EOF'\nEOF",
                  description: '打开 example.com 并读取标题',
                },
                data: [
                  {
                    type: 'content',
                    content: {
                      type: 'text',
                      text: '```\nExit code 1\ncannot connect to app socket\n```',
                    },
                  },
                ],
              },
            },
          } as any
        }
      />,
    );

    const row = screen.getByRole('button', { name: new RegExp(title) });
    fireEvent.click(row);
    // 外部受控组件需由测试重渲染展开态。
    rerender(
      <ProcessNodeRow
        expanded
        onToggle={() => {}}
        node={
          {
            id: 'call-real-expanded',
            kind: 'tool',
            title,
            summary: '',
            status: 'failed',
            failed: true,
            componentType: AgentComponentTypeEnum.ToolCall,
            processing: {
              name: title,
              status: ProcessingEnum.FAILED,
              type: AgentComponentTypeEnum.ToolCall,
              result: {
                kind: 'execute',
                success: false,
                input: { command: "nuwa-browser <<'EOF'\nEOF" },
                data: [
                  {
                    type: 'content',
                    content: {
                      type: 'text',
                      text: '```\nExit code 1\ncannot connect to app socket\n```',
                    },
                  },
                ],
              },
            },
          } as any
        }
      />,
    );

    const detail = document.querySelector('[data-tool-detail-kind="terminal"]');
    expect(detail).not.toBeNull();
    expect(screen.getAllByText(title)).toHaveLength(1);
    expect(detail).toHaveTextContent("$nuwa-browser <<'EOF'");
    expect(detail).toHaveTextContent('cannot connect to app socket');
    expect(
      detail?.querySelector('[class*="markdown-custom-process"]'),
    ).toBeNull();
    expect(detail?.querySelector('[class*="params-response-view"]')).toBeNull();
    expect(detail).not.toHaveTextContent('"type"');
  });

  it('无输入输出且无摘要的节点不渲染空详情容器', () => {
    const node = {
      id: 'call-empty',
      kind: 'tool',
      title: '空工具',
      summary: '',
      status: 'finished',
      componentType: AgentComponentTypeEnum.ToolCall,
      processing: {
        executeId: 'call-empty',
        name: '空工具',
        status: ProcessingEnum.FINISHED,
        type: AgentComponentTypeEnum.ToolCall,
        result: undefined,
      },
    } as any;
    const { rerender } = render(
      <ProcessNodeRow expanded={false} onToggle={() => {}} node={node} />,
    );
    rerender(<ProcessNodeRow expanded onToggle={() => {}} node={node} />);
    expect(document.querySelector('[data-tool-detail-kind]')).toBeNull();
  });

  it('行尾恒显示耗时与复制/分享（收起态即可见，对齐 V1 单行卡）', () => {
    const node = {
      id: 'call-dur',
      kind: 'tool',
      title: '终端执行 demo',
      summary: '',
      status: 'finished',
      componentType: AgentComponentTypeEnum.ToolCall,
      processing: {
        executeId: 'call-dur',
        name: '终端执行 demo',
        status: ProcessingEnum.FINISHED,
        type: AgentComponentTypeEnum.ToolCall,
        result: {
          kind: 'execute',
          success: true,
          startTime: 1000,
          endTime: 8400,
          input: { command: 'echo hi' },
          data: [{ type: 'content', content: { type: 'text', text: 'hi' } }],
        },
      },
    } as any;
    const props = { onToggle: () => {}, node };
    const { rerender } = render(<ProcessNodeRow expanded={false} {...props} />);
    // 收起态：操作区已在（不用点开）
    expect(screen.getByTestId('v2-node-duration')).toHaveTextContent('7.4s');
    expect(screen.getByTestId('copy-button')).toBeInTheDocument();
    expect(screen.getByTestId('share-message-btn')).toBeInTheDocument();

    // 展开态：操作区仍在，复制内容含命令与输出
    rerender(<ProcessNodeRow expanded {...props} />);
    expect(screen.getByTestId('v2-node-duration')).toHaveTextContent('7.4s');
    const copy = screen.getByTestId('copy-button');
    expect(copy.getAttribute('data-copy-text')).toContain('$ echo hi');
    expect(copy.getAttribute('data-copy-text')).toContain('hi');
  });
});
