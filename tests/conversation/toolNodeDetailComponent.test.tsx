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
});
