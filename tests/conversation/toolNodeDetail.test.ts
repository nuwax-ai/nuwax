import { normalizeV2ToolDetail } from '@/features/conversation/presentation-v2/toolDetail';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { describe, expect, it } from 'vitest';

describe('V2 真实工具详情归一化', () => {
  it('将真实 execute/content.text 协议归一化为终端命令和纯输出', () => {
    const detail = normalizeV2ToolDetail({
      componentType: AgentComponentTypeEnum.ToolCall,
      name: "终端执行 nuwa-browser <<'EOF'",
      result: {
        kind: 'execute',
        success: false,
        input: {
          command: "nuwa-browser <<'EOF'\nconsole.log('title')\nEOF",
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
    });

    expect(detail).toMatchObject({
      kind: 'terminal',
      command: "nuwa-browser <<'EOF'\nconsole.log('title')\nEOF",
      description: '打开 example.com 并读取标题',
      output: 'Exit code 1\ncannot connect to app socket',
      success: false,
    });
    expect(detail.output).not.toContain('```');
    expect(detail.output).not.toContain('"type"');
  });

  it('识别真实 read 协议并保留文件路径和文本内容', () => {
    const detail = normalizeV2ToolDetail({
      componentType: AgentComponentTypeEnum.ToolCall,
      name: 'Read troubleshooting.md',
      result: {
        kind: 'read',
        input: { file_path: '/workspace/troubleshooting.md' },
        data: [
          {
            type: 'content',
            content: { type: 'text', text: '```\n1 # Troubleshooting\n```' },
          },
        ],
      },
    });

    expect(detail.kind).toBe('file-read');
    expect(detail.filePath).toBe('/workspace/troubleshooting.md');
    expect(detail.output).toBe('1 # Troubleshooting');
  });

  it('提取终端退出码、文件行范围以及浏览器结构化结果', () => {
    const terminal = normalizeV2ToolDetail({
      result: {
        kind: 'execute',
        input: { command: 'npm test' },
        data: [{ type: 'terminal', content: 'ok', exitCode: 0 }],
      },
    });
    expect(terminal.exitCode).toBe(0);

    const read = normalizeV2ToolDetail({
      result: {
        kind: 'read',
        input: { file_path: 'src/a.ts', line_start: 4, line_end: 18 },
        data: 'content',
      },
    });
    expect(read).toMatchObject({ lineStart: 4, lineEnd: 18 });

    const browser = normalizeV2ToolDetail({
      componentType: AgentComponentTypeEnum.Page,
      result: {
        input: { url: 'https://example.com' },
        data: { title: 'Example Domain', summary: 'Example result' },
      },
    });
    expect(browser).toMatchObject({
      kind: 'browser',
      url: 'https://example.com',
      resultTitle: 'Example Domain',
      resultSummary: 'Example result',
    });
  });

  it('兼容 ToolCall 的 kind + rawInput 嵌套协议', () => {
    const detail = normalizeV2ToolDetail({
      componentType: AgentComponentTypeEnum.ToolCall,
      name: '执行测试',
      result: {
        input: {
          kind: 'execute',
          rawInput: {
            command: 'npm run test:conversation',
            description: '运行会话合同网',
          },
        },
        data: 'all green',
      },
    });
    expect(detail.kind).toBe('terminal');
    expect(detail.command).toBe('npm run test:conversation');
    expect(detail.description).toBe('运行会话合同网');
    expect(detail.inputText).toBeUndefined();

    const edit = normalizeV2ToolDetail({
      componentType: AgentComponentTypeEnum.ToolCall,
      result: {
        input: {
          kind: 'edit',
          rawInput: {
            file_path: 'src/app.tsx',
            old_string: 'const enabled = false;',
            new_string: 'const enabled = true;',
          },
        },
      },
    });
    expect(edit.kind).toBe('file-edit');
    expect(edit.diffs).toEqual([
      {
        path: 'src/app.tsx',
        oldText: 'const enabled = false;',
        newText: 'const enabled = true;',
      },
    ]);
  });
});
