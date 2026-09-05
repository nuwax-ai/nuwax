/**
 * fileDataSource 纯函数测试（#5a 文件树懒加载收尾）
 *
 * 覆盖降级链路：网关未透传单层参数（响应 recursive 回显非 false）时，
 * 从全量递归扁平列表裁出当前目录层。
 */
import { describe, expect, it, vi } from 'vitest';

import {
  filterDirectoryLevel,
  resolveDirectoryLevelFiles,
} from './fileDataSource';

describe('filterDirectoryLevel（全量扁平列表裁当前层）', () => {
  const flat = [
    { name: 'README.md', isDir: false },
    { name: 'docs/a.md', isDir: false },
    { name: 'docs/sub/b.md', isDir: false },
    { name: 'empty-dir', isDir: true },
    { name: '.gitignore', isDir: false },
  ];

  it('根层级：直接子文件直取、非空子目录从深层路径合成、空目录条目保留', () => {
    const level = filterDirectoryLevel(flat, '');
    expect(level.map((item) => item.name).sort()).toEqual(
      ['.gitignore', 'README.md', 'docs', 'empty-dir'].sort(),
    );
    expect(level.find((item) => item.name === 'docs')?.isDir).toBe(true);
    expect(level.find((item) => item.name === 'empty-dir')?.isDir).toBe(true);
  });

  it('子目录层级：直接子文件 + 合成的更深层目录', () => {
    expect(filterDirectoryLevel(flat, 'docs').map((item) => item.name)).toEqual(
      ['docs/a.md', 'docs/sub'],
    );
    expect(
      filterDirectoryLevel(flat, 'docs/sub').map((item) => item.name),
    ).toEqual(['docs/sub/b.md']);
  });

  it('前缀不匹配的路径不进入结果（docs2 不等于 docs）', () => {
    expect(
      filterDirectoryLevel(
        [
          { name: 'docs2/x.md', isDir: false },
          { name: 'docs/x.md', isDir: false },
        ],
        'docs',
      ).map((item) => item.name),
    ).toEqual(['docs/x.md']);
  });
});

describe('resolveDirectoryLevelFiles（recursive 回显检测）', () => {
  const flat = [
    { name: 'README.md', isDir: false },
    { name: 'docs/a.md', isDir: false },
    { name: 'docs/sub/b.md', isDir: false },
  ];

  it('回显 false（单层透传生效）时原样返回', () => {
    expect(resolveDirectoryLevelFiles(flat, false, 'docs')).toBe(flat);
  });

  it('回显缺省/true 时降级裁剪当前层并仅告警一次', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(
        resolveDirectoryLevelFiles(flat, undefined, 'docs').map(
          (item) => item.name,
        ),
      ).toEqual(['docs/a.md', 'docs/sub']);
      expect(resolveDirectoryLevelFiles(flat, true, '').length).toBeGreaterThan(
        0,
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
    } finally {
      warnSpy.mockRestore();
    }
  });
});
