import ProcessNodeRow from '@/features/conversation/presentation-v2/react/ProcessNodeRow';
import ToolNodeDetail from '@/features/conversation/presentation-v2/react/ToolNodeDetail';
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
    // 紧凑事件行用“动作 + 命令目标”表达，原始长标题只保留在无障碍名称中。
    expect(screen.queryByText(title)).toBeNull();
    expect(screen.getByRole('button').getAttribute('aria-label')).toContain(
      title,
    );
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
});

describe('V2 类型化工具详情', () => {
  const detailNode = (
    id: string,
    type: AgentComponentTypeEnum,
    result: Record<string, unknown>,
  ) =>
    ({
      id,
      kind: type === AgentComponentTypeEnum.Plan ? 'plan' : 'tool',
      title: id,
      summary: '',
      status: 'finished',
      failed: false,
      componentType: type,
      processing: {
        executeId: id,
        name: id,
        type,
        status: ProcessingEnum.FINISHED,
        result: { executeId: id, success: true, ...result },
      },
    } as any);

  it('文件读取展示路径/行范围/正文，并通过宿主回调打开资源', () => {
    const onOpenResource = vi.fn();
    render(
      <ToolNodeDetail
        node={detailNode('read', AgentComponentTypeEnum.ToolCall, {
          kind: 'read',
          input: {
            file_path: '/home/user/1562087/src/index.tsx',
            line_start: 4,
            line_end: 9,
          },
          data: 'export default App;',
        })}
        onOpenResource={onOpenResource}
      />,
    );
    const detail = document.querySelector(
      '[data-tool-detail-kind="file-read"]',
    );
    // 会话沙箱路径拆为「徽标 + 文件名 + 目录」三段，textContent 不再连续
    expect(detail).toHaveTextContent('index.tsx');
    expect(detail).toHaveTextContent('/home/user/1562087/src/');
    expect(detail).toHaveTextContent('export default App;');
    fireEvent.click(
      screen
        .getAllByRole('button')
        .find((button) => button.textContent?.includes('index.tsx'))!,
    );
    expect(onOpenResource).toHaveBeenCalledWith({
      kind: 'file',
      target: '/home/user/1562087/src/index.tsx',
      line: 4,
    });
  });

  it('非会话沙箱路径按原样完整展示且不可点', () => {
    const onOpenResource = vi.fn();
    render(
      <ToolNodeDetail
        node={detailNode('read', AgentComponentTypeEnum.ToolCall, {
          kind: 'read',
          input: { file_path: '/home/user/Desktop/a.md' },
          data: 'content',
        })}
        onOpenResource={onOpenResource}
      />,
    );
    const detail = document.querySelector(
      '[data-tool-detail-kind="file-read"]',
    );
    expect(detail).toHaveTextContent('/home/user/Desktop/a.md');
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(onOpenResource).not.toHaveBeenCalled();
  });

  it('文件编辑展示统一 +/- Diff 与统计，不回显协议外壳', () => {
    render(
      <ToolNodeDetail
        node={detailNode('edit', AgentComponentTypeEnum.ToolCall, {
          kind: 'edit',
          input: { file_path: 'src/index.tsx' },
          data: [
            {
              type: 'diff',
              path: 'src/index.tsx',
              oldText: 'const oldValue = 1;',
              newText: 'const newValue = 2;',
            },
          ],
        })}
      />,
    );
    const detail = document.querySelector(
      '[data-tool-detail-kind="file-edit"]',
    );
    expect(detail).toHaveTextContent('+1');
    expect(detail).toHaveTextContent('-1');
    expect(detail).toHaveTextContent('- const oldValue = 1;');
    expect(detail).toHaveTextContent('+ const newValue = 2;');
    expect(detail).not.toHaveTextContent('"executeId"');
  });

  it('浏览器和 Skill 使用专属内容形态', () => {
    const view = render(
      <ToolNodeDetail
        node={detailNode('browser', AgentComponentTypeEnum.Page, {
          input: { url: 'https://example.com' },
          data: {
            title: 'Example Domain',
            summary: '页面加载完成',
            url: 'https://example.com',
          },
        })}
      />,
    );
    expect(
      document.querySelector('[data-tool-detail-kind="browser"]'),
    ).toHaveTextContent('Example Domain');
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'https://example.com',
    );

    view.rerender(
      <ToolNodeDetail
        node={detailNode('skill', AgentComponentTypeEnum.Skill, {
          input: { skill_content: '# Browser skill\n\nOpen a page.' },
        })}
      />,
    );
    expect(
      document.querySelector('[data-tool-detail-kind="skill"]'),
    ).toHaveTextContent('# Browser skill');
  });

  it('Plan 显示状态清单，Generic 只显示清洗后的输入和结果', () => {
    const view = render(
      <ToolNodeDetail
        node={detailNode('plan', AgentComponentTypeEnum.Plan, {
          input: {},
          data: [
            { status: 'completed', content: '完成分组' },
            { status: 'in_progress', content: '运行验收' },
          ],
        })}
      />,
    );
    expect(
      document.querySelector('[data-tool-detail-kind="todo"]'),
    ).toHaveTextContent('完成分组');

    view.rerender(
      <ToolNodeDetail
        node={detailNode('generic', AgentComponentTypeEnum.Plugin, {
          input: { target: 'mock-chat' },
          data: '同步完成',
        })}
      />,
    );
    const generic = document.querySelector('[data-tool-detail-kind="generic"]');
    expect(generic).toHaveTextContent('"target": "mock-chat"');
    expect(generic).toHaveTextContent('同步完成');
    expect(generic).not.toHaveTextContent('"executeId"');
  });
});

describe('V2 折叠行文件链接（FileResourceLink inline 变体）', () => {
  const rowNode = (result: Record<string, unknown>) =>
    ({
      id: 'row-tool',
      kind: 'tool',
      title: 'row-tool',
      summary: '',
      status: 'finished',
      failed: false,
      componentType: AgentComponentTypeEnum.ToolCall,
      processing: {
        executeId: 'row-tool',
        name: 'row-tool',
        status: ProcessingEnum.FINISHED,
        type: AgentComponentTypeEnum.ToolCall,
        result: { executeId: 'row-tool', success: true, ...result },
      },
    } as any);

  const renderRow = (result: Record<string, unknown>) => {
    const onToggle = vi.fn();
    const onOpenResource = vi.fn();
    const view = render(
      <ProcessNodeRow
        node={rowNode(result)}
        expanded={false}
        onToggle={onToggle}
        onOpenResource={onOpenResource}
      />,
    );
    return { onToggle, onOpenResource, ...view };
  };

  it('读取了文件：行内渲染徽标+文件名链接，点击打开文件但不触发行展开', () => {
    const { onToggle, onOpenResource } = renderRow({
      kind: 'read',
      input: { file_path: '/home/user/1562087/src/index.tsx' },
      data: 'content',
    });
    const link = document.querySelector(
      '.tool-file-link',
    ) as HTMLElement | null;
    if (!link) {
      throw new Error('行内未渲染 .tool-file-link');
    }
    // inline 变体隐藏目录段，只显示文件名（完整路径在 title）
    expect(link).not.toHaveTextContent('/home/user/1562087/');
    expect(link).toHaveTextContent('index.tsx');
    // inline 变体是 span（外层行本身是 button，不嵌套交互元素）
    expect(link.tagName).toBe('SPAN');

    fireEvent.click(link);
    expect(onOpenResource).toHaveBeenCalledWith({
      kind: 'file',
      target: '/home/user/1562087/src/index.tsx',
      line: undefined,
    });
    // stopPropagation：行展开不被触发
    expect(onToggle).not.toHaveBeenCalled();

    // 点行其他区域仍正常展开
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('编辑多个文件：计数 + 逐个文件链接', () => {
    const { onOpenResource } = renderRow({
      kind: 'edit',
      input: { file_path: '/home/user/1562087/a.ts' },
      data: [
        {
          type: 'diff',
          path: '/home/user/1562087/a.ts',
          oldText: 'const oldValue = 1;',
          newText: 'const newValue = 2;',
        },
        {
          type: 'diff',
          path: '/home/user/1562087/b.md',
          newText: 'hello',
        },
      ],
    });
    const links = document.querySelectorAll('.tool-file-link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent('a.ts');
    expect(links[1]).toHaveTextContent('b.md');
    // 行内同时保留「N 个文件」计数与 +/- 统计
    expect(document.body.textContent).toContain('toolTargetFiles');
    expect(document.body.textContent).toContain('+2 -1');

    fireEvent.click(links[1] as HTMLElement);
    expect(onOpenResource).toHaveBeenCalledWith({
      kind: 'file',
      target: '/home/user/1562087/b.md',
      line: undefined,
    });
  });

  it('非会话沙箱路径：行内仍渲染徽标链接可点（能否打开由宿主判定），卡片内普通文本完整展示', () => {
    const { onOpenResource } = renderRow({
      kind: 'read',
      input: { file_path: '/home/user/Desktop/a.md' },
      data: 'content',
    });
    const link = document.querySelector(
      '.tool-file-link',
    ) as HTMLElement | null;
    if (!link) {
      throw new Error('行内未渲染 .tool-file-link');
    }
    expect(link).toHaveTextContent('a.md');
    fireEvent.click(link);
    // 行内不拦截非沙箱路径：照常回调，由宿主 handler 决定打开或提示
    expect(onOpenResource).toHaveBeenCalledWith({
      kind: 'file',
      target: '/home/user/Desktop/a.md',
      line: undefined,
    });

    // 卡片头部同一路径则回落普通文本完整展示、不可点
    render(
      <ToolNodeDetail
        node={rowNode({
          kind: 'read',
          input: { file_path: '/home/user/Desktop/a.md' },
          data: 'content',
        })}
        onOpenResource={vi.fn()}
      />,
    );
    const plain = document.querySelector('.tool-file-plain');
    expect(plain).toHaveTextContent('/home/user/Desktop/a.md');
  });
});
