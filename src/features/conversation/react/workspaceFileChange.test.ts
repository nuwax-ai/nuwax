import { describe, expect, it } from 'vitest';
import { latestRoundChangedWorkspaceFiles } from './workspaceFileChange';

const user = { role: 'USER' };
const readFile = {
  type: 'ToolCall',
  name: '读取文件',
  status: 'FINISHED',
  result: { kind: 'read', input: { filePath: 'a.ts' } },
};
const writeFile = {
  type: 'ToolCall',
  name: 'write_file',
  status: 'FINISHED',
  result: { kind: 'write', input: { filePath: 'a.ts', content: 'next' } },
};

describe('latestRoundChangedWorkspaceFiles', () => {
  it('本轮改过文件时返回 true', () => {
    expect(
      latestRoundChangedWorkspaceFiles([
        user,
        { role: 'ASSISTANT', processingList: [readFile] },
        user,
        { role: 'ASSISTANT', processingList: [writeFile] },
      ]),
    ).toBe(true);
  });

  it('本轮只查阅文件时返回 false，且不把上一轮的修改算进来', () => {
    expect(
      latestRoundChangedWorkspaceFiles([
        user,
        { role: 'ASSISTANT', processingList: [writeFile] },
        user,
        { role: 'ASSISTANT', processingList: [readFile] },
      ]),
    ).toBe(false);
  });

  it('工具还在执行时不算已经改完文件', () => {
    expect(
      latestRoundChangedWorkspaceFiles([
        user,
        {
          role: 'ASSISTANT',
          processingList: [{ ...writeFile, status: 'EXECUTING' }],
        },
      ]),
    ).toBe(false);
  });

  it('终态执行结果里的新增文件也算文件变化', () => {
    expect(
      latestRoundChangedWorkspaceFiles([
        { messageType: 'USER' },
        {
          role: 'ASSISTANT',
          finalResult: {
            componentExecuteResults: [
              {
                type: 'ToolCall',
                name: '创建文件',
                success: true,
                kind: 'create',
                input: { filePath: 'new.ts' },
              },
            ],
          },
        },
      ]),
    ).toBe(true);
  });
});
