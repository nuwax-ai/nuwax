import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { describe, expect, it } from 'vitest';
import { isFileMutatingToolCall } from './fileMutatingToolCall';

describe('isFileMutatingToolCall', () => {
  it('有文件对比或编辑/写入语义时刷新', () => {
    expect(
      isFileMutatingToolCall({
        componentType: AgentComponentTypeEnum.ToolCall,
        name: '编辑文件',
        result: {
          data: [{ type: 'diff', path: 'a.ts', oldText: 'a', newText: 'b' }],
        },
      }),
    ).toBe(true);
    expect(
      isFileMutatingToolCall({
        componentType: AgentComponentTypeEnum.ToolCall,
        name: 'write_file',
        result: {
          kind: 'write',
          input: { filePath: 'README.md', content: '# hi' },
        },
      }),
    ).toBe(true);
    expect(
      isFileMutatingToolCall({
        name: 'apply_patch',
        result: {
          input: {
            filePath: 'src/index.ts',
            oldString: 'const a = 1',
            newString: 'const a = 2',
          },
        },
      }),
    ).toBe(true);
  });

  it('删除文件即使没有 diff 也刷新', () => {
    expect(
      isFileMutatingToolCall({
        name: 'delete_file',
        result: { kind: 'delete', input: { filePath: 'tmp.txt' } },
      }),
    ).toBe(true);
  });

  it('读取和普通工具调用不刷新', () => {
    expect(
      isFileMutatingToolCall({
        componentType: AgentComponentTypeEnum.ToolCall,
        name: '读取文件',
        result: { kind: 'read', input: { filePath: 'a.ts' } },
      }),
    ).toBe(false);
    expect(
      isFileMutatingToolCall({
        componentType: AgentComponentTypeEnum.ToolCall,
        name: 'search',
        result: {},
      }),
    ).toBe(false);
  });
});
