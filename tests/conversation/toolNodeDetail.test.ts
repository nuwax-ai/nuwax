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
});
