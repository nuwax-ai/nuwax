/**
 * resolveGitignoreWritePlan 纯函数测试
 *
 * 核心回归点：.gitignore 已存在但内容为空时必须走 modify（d86fe8dc5 曾按
 * 「内容非空」选操作，空文件误走 create 被 file-server 静默跳过形成假成功）；
 * 拉取失败必须中止（旧实现基于空串 modify 会覆写整个文件）。
 */
import { describe, expect, it } from 'vitest';

import { resolveGitignoreWritePlan } from './gitignoreWritePlan';

describe('resolveGitignoreWritePlan（三态 → 写入决策）', () => {
  it('ok + 非空内容：modify 追加，保留原内容并去重复尾换行', () => {
    expect(
      resolveGitignoreWritePlan(
        { status: 'ok', content: 'node_modules\n' },
        'dist',
      ),
    ).toEqual({
      action: 'write',
      operation: 'modify',
      contents: 'node_modules\ndist',
    });
    expect(
      resolveGitignoreWritePlan(
        { status: 'ok', content: 'node_modules' },
        'dist',
      ),
    ).toEqual({
      action: 'write',
      operation: 'modify',
      contents: 'node_modules\ndist',
    });
  });

  it('ok + 空文件：仍走 modify 且内容仅为新条目（不再误判 create）', () => {
    expect(
      resolveGitignoreWritePlan({ status: 'ok', content: '' }, 'dist'),
    ).toEqual({
      action: 'write',
      operation: 'modify',
      contents: 'dist',
    });
  });

  it('ok + 条目已存在（精确/带空白/原 fileId 带斜杠变体）：跳过', () => {
    expect(
      resolveGitignoreWritePlan(
        { status: 'ok', content: 'dist\nlogs' },
        'dist',
      ),
    ).toEqual({ action: 'skip-duplicate' });
    expect(
      resolveGitignoreWritePlan(
        { status: 'ok', content: '  dist  \nlogs' },
        'dist',
      ),
    ).toEqual({ action: 'skip-duplicate' });
    expect(
      resolveGitignoreWritePlan(
        { status: 'ok', content: '/dist\nlogs' },
        '/dist',
      ),
    ).toEqual({ action: 'skip-duplicate' });
  });

  it('missing（404）：create 新建，条目去前导斜杠并补尾换行', () => {
    expect(resolveGitignoreWritePlan({ status: 'missing' }, 'dist')).toEqual({
      action: 'write',
      operation: 'create',
      contents: 'dist\n',
    });
    expect(resolveGitignoreWritePlan({ status: 'missing' }, '/dist')).toEqual({
      action: 'write',
      operation: 'create',
      contents: 'dist\n',
    });
  });

  it('error（网络/非 404 失败）：中止，绝不产生写入负载', () => {
    expect(resolveGitignoreWritePlan({ status: 'error' }, 'dist')).toEqual({
      action: 'abort-fetch-error',
    });
  });

  it('ok 路径的条目同样去前导斜杠', () => {
    expect(
      resolveGitignoreWritePlan(
        { status: 'ok', content: 'node_modules\n' },
        '/dist',
      ),
    ).toEqual({
      action: 'write',
      operation: 'modify',
      contents: 'node_modules\ndist',
    });
  });
});
