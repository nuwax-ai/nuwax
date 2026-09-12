import { describe, expect, it } from 'vitest';

import {
  parseSandboxAbsolutePath,
  resolveSandboxFileOpen,
} from './sandboxPath';

describe('parseSandboxAbsolutePath', () => {
  it('标准沙箱绝对路径解析出会话 ID 与相对路径', () => {
    expect(
      parseSandboxAbsolutePath('/home/user/1562087/markdown-style-test.md'),
    ).toEqual({
      conversationId: '1562087',
      relativePath: 'markdown-style-test.md',
    });
  });

  it('多级子目录完整保留相对路径', () => {
    expect(
      parseSandboxAbsolutePath('/home/user/1562087/demoSrc/sub/a.png'),
    ).toEqual({
      conversationId: '1562087',
      relativePath: 'demoSrc/sub/a.png',
    });
  });

  it('非沙箱家目录前缀返回 null', () => {
    expect(parseSandboxAbsolutePath('/etc/hosts')).toBeNull();
    expect(parseSandboxAbsolutePath('src/index.ts')).toBeNull();
    expect(parseSandboxAbsolutePath('')).toBeNull();
  });

  it('会话段非数字返回 null（与渲染层同口径）', () => {
    expect(parseSandboxAbsolutePath('/home/user/Desktop/a.md')).toBeNull();
  });

  it('缺会话 ID 段或缺相对路径返回 null', () => {
    expect(parseSandboxAbsolutePath('/home/user/')).toBeNull();
    expect(parseSandboxAbsolutePath('/home/user/1562087')).toBeNull();
    expect(parseSandboxAbsolutePath('/home/user//file.md')).toBeNull();
  });

  it('路径穿越段返回 null', () => {
    expect(
      parseSandboxAbsolutePath('/home/user/1562087/../1562088/secret.md'),
    ).toBeNull();
  });

  it('容忍相对路径结尾斜杠', () => {
    expect(parseSandboxAbsolutePath('/home/user/1562087/dir/')).toEqual({
      conversationId: '1562087',
      relativePath: 'dir',
    });
  });
});

describe('resolveSandboxFileOpen', () => {
  it('当前会话的沙箱路径放行并给出相对路径', () => {
    expect(resolveSandboxFileOpen('/home/user/1562087/a.md', 1562087)).toEqual({
      type: 'open',
      relativePath: 'a.md',
    });
    expect(
      resolveSandboxFileOpen('/home/user/1562087/sub/b.ts', '1562087'),
    ).toEqual({ type: 'open', relativePath: 'sub/b.ts' });
  });

  it('非沙箱路径以 unsupported-path 拒绝', () => {
    expect(resolveSandboxFileOpen('/home/user/Desktop/a.md', 1562087)).toEqual({
      type: 'reject',
      reason: 'unsupported-path',
    });
    expect(resolveSandboxFileOpen('src/index.ts', 1562087)).toEqual({
      type: 'reject',
      reason: 'unsupported-path',
    });
  });

  it('其他会话的沙箱路径以 not-in-conversation 拒绝', () => {
    expect(resolveSandboxFileOpen('/home/user/9999/a.md', 1562087)).toEqual({
      type: 'reject',
      reason: 'not-in-conversation',
    });
  });

  it('当前会话 ID 缺失时一律拒绝', () => {
    expect(
      resolveSandboxFileOpen('/home/user/1562087/a.md', undefined),
    ).toEqual({ type: 'reject', reason: 'not-in-conversation' });
    expect(resolveSandboxFileOpen('/home/user/1562087/a.md', '')).toEqual({
      type: 'reject',
      reason: 'not-in-conversation',
    });
  });
});
