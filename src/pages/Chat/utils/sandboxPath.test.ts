import { describe, expect, it } from 'vitest';

import {
  parseSandboxAbsolutePath,
  parseSandboxExternalPath,
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

describe('parseSandboxExternalPath', () => {
  it('工作区外的沙箱家目录文件解析为家目录锚点 + 相对路径', () => {
    expect(parseSandboxExternalPath('/home/user/Desktop/a.md')).toEqual({
      targetDir: '/home/user',
      relativePath: 'Desktop/a.md',
    });
    expect(
      parseSandboxExternalPath('/home/user/Desktop/sub/deep/b.md'),
    ).toEqual({
      targetDir: '/home/user',
      relativePath: 'Desktop/sub/deep/b.md',
    });
  });

  it('家目录一层路径（无文件段）返回 null', () => {
    expect(parseSandboxExternalPath('/home/user/Desktop')).toBeNull();
  });

  it('路径穿越段返回 null', () => {
    expect(
      parseSandboxExternalPath('/home/user/Desktop/../1562087/secret.md'),
    ).toBeNull();
  });

  it('非沙箱家目录前缀返回 null', () => {
    expect(parseSandboxExternalPath('/etc/hosts')).toBeNull();
    expect(parseSandboxExternalPath('')).toBeNull();
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

  it('工作区外的沙箱家目录文件走 open-external', () => {
    expect(resolveSandboxFileOpen('/home/user/Desktop/a.md', 1562087)).toEqual({
      type: 'open-external',
      targetDir: '/home/user',
      relativePath: 'Desktop/a.md',
    });
    expect(
      resolveSandboxFileOpen('/home/user/Desktop/sub/b.md', 1562087),
    ).toEqual({
      type: 'open-external',
      targetDir: '/home/user',
      relativePath: 'Desktop/sub/b.md',
    });
  });

  it('家目录之外或无法解析的路径以 unsupported-path 拒绝', () => {
    expect(resolveSandboxFileOpen('/etc/hosts', 1562087)).toEqual({
      type: 'reject',
      reason: 'unsupported-path',
    });
    expect(resolveSandboxFileOpen('src/index.ts', 1562087)).toEqual({
      type: 'reject',
      reason: 'unsupported-path',
    });
    expect(resolveSandboxFileOpen('/home/user/Desktop', 1562087)).toEqual({
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
