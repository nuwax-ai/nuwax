import { shouldRefreshWorkspaceFiles } from '@/features/conversation/domain/workspaceFileChange';
import { describe, expect, it } from 'vitest';

describe('workspace file refresh semantics', () => {
  const tool = (result: unknown, overrides: Record<string, unknown> = {}) => ({
    type: 'ToolCall',
    status: 'FINISHED',
    name: 'unknown',
    result,
    ...overrides,
  });

  it.each(['read', 'search', 'browser'])(
    'does not refresh a completed %s tool with a file path',
    (kind) =>
      expect(
        shouldRefreshWorkspaceFiles(
          tool({ kind, input: { file_path: '/src/index.ts' } }),
        ),
      ).toBe(false),
  );
  it.each(['edit', 'write', 'create', 'delete', 'rename', 'move', 'copy'])(
    'refreshes a completed %s and skips its EXECUTING start',
    (kind) => {
      expect(shouldRefreshWorkspaceFiles(tool({ kind }))).toBe(true);
      expect(
        shouldRefreshWorkspaceFiles(tool({ kind }, { status: 'EXECUTING' })),
      ).toBe(false);
    },
  );
  it('recognizes output diff and raw input edit contracts without guessing from a path', () => {
    expect(
      shouldRefreshWorkspaceFiles(
        tool({
          data: [
            { type: 'diff', path: 'src/a.ts', oldText: '', newText: 'new' },
          ],
        }),
      ),
    ).toBe(true);
    expect(
      shouldRefreshWorkspaceFiles(
        tool({
          input: { rawInput: { file_path: 'src/a.ts', new_string: '' } },
        }),
      ),
    ).toBe(true);
    expect(
      shouldRefreshWorkspaceFiles(tool({ input: { file_path: 'src/a.ts' } })),
    ).toBe(false);
  });
  it.each([
    'pwd',
    'ls -la src',
    'cat src/a.ts',
    'head -n 5 README.md',
    'tail -n 5 output.log',
    'git status',
    'npm test',
    'echo hello',
    'python build.py',
    'echo hello > new.txt',
    'mkdir -p generated',
  ])('does not refresh a terminal command: %s', (command) =>
    expect(
      shouldRefreshWorkspaceFiles(
        tool({ kind: 'execute', input: { command } }),
      ),
    ).toBe(false),
  );
  it('does not refresh an execute tool without a command or a failed command', () => {
    expect(shouldRefreshWorkspaceFiles(tool({ kind: 'execute' }))).toBe(false);
    expect(
      shouldRefreshWorkspaceFiles(
        tool(
          { kind: 'execute', input: { command: 'git status' }, success: false },
          { status: 'FAILED' },
        ),
      ),
    ).toBe(false);
    expect(
      shouldRefreshWorkspaceFiles(tool({}, { name: '终端' })),
    ).toBe(false);
  });
  it.each([
    'write_file',
    'apply_patch',
    'Backend.Sandbox.Tool.EditFile',
    '删除文件',
    'create_directory',
  ])('uses explicit legacy mutation tool names: %s', (name) =>
    expect(shouldRefreshWorkspaceFiles(tool({}, { name }))).toBe(true),
  );
  it('skips unrelated plan/search/browser and malformed data', () => {
    for (const value of [
      null,
      {},
      tool({}, { name: 'TodoWrite' }),
      tool({}, { name: 'search' }),
      tool({ kind: 'write' }, { type: 'Page' }),
    ]) {
      expect(shouldRefreshWorkspaceFiles(value)).toBe(false);
    }
  });
});
