import { describe, expect, it } from 'vitest';
import {
  latestRoundChangedWorkspaceFiles,
  latestRoundNeedsPreviewRebuild,
} from './workspaceFileChange';

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

describe('latestRoundNeedsPreviewRebuild', () => {
  const user = { role: 'USER' };
  const changed = (filePath: string, kind = 'write') => ({
    role: 'ASSISTANT',
    processingList: [
      {
        type: 'ToolCall',
        name: 'write_file',
        status: 'FINISHED',
        result: { kind, input: { filePath } },
      },
    ],
  });

  it('改了代码或资源时需要重新打包', () => {
    expect(latestRoundNeedsPreviewRebuild([user, changed('src/App.tsx')])).toBe(
      true,
    );
    expect(
      latestRoundNeedsPreviewRebuild([
        user,
        changed('assets/logo.png', 'create'),
      ]),
    ).toBe(true);
  });

  it('只改 md、txt、json 等常见文本时不重新打包', () => {
    expect(
      latestRoundNeedsPreviewRebuild([
        user,
        changed('README.md'),
        changed('notes/readme.TXT', 'edit'),
        changed('config/app.json', 'delete'),
      ]),
    ).toBe(false);
  });

  it('文本和代码一起改时仍然重新打包', () => {
    expect(
      latestRoundNeedsPreviewRebuild([
        user,
        changed('README.md'),
        changed('src/main.ts'),
      ]),
    ).toBe(true);
  });

  it('本轮没有文件变化时不重新打包', () => {
    expect(latestRoundNeedsPreviewRebuild([user])).toBe(false);
  });
});
