import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';

type Point = { line: number; column: number; offset: number };
type Location = {
  toPoint: (offset: unknown) => Point | undefined;
  toOffset: (point: { line: number; column: number }) => number | undefined;
};

let location: (value: string) => Location;

beforeAll(async () => {
  // 沿真实依赖链加载，避免把 pnpm 虚拟仓库路径写死在回归测试里。
  const require = createRequire(import.meta.url);
  const rawRequire = createRequire(require.resolve('rehype-raw'));
  const hastRawRequire = createRequire(rawRequire.resolve('hast-util-raw'));
  const parse5Require = createRequire(
    hastRawRequire.resolve('hast-util-from-parse5'),
  );
  ({ location } = await import(
    /* @vite-ignore */ pathToFileURL(parse5Require.resolve('vfile-location'))
      .href
  ));
});

// 保留 5.0.3 原版双 indexOf 的换行定义，作为补丁的独立语义参照。
function referenceLineEnds(value: string): number[] {
  const ends: number[] = [];
  let from = 0;
  while (true) {
    const cr = value.indexOf('\r', from);
    const lf = value.indexOf('\n', from);
    const eol =
      lf === -1 ? cr : cr === -1 || cr + 1 === lf ? lf : Math.min(cr, lf);
    if (eol === -1) return [...ends, value.length + 1];
    from = eol + 1;
    ends.push(from);
  }
}

function referencePoint(value: string, offset: number): Point {
  const ends = referenceLineEnds(value);
  const index = ends.findIndex((end) => end > offset);
  return {
    line: index + 1,
    column: offset - (index ? ends[index - 1] : 0) + 1,
    offset,
  };
}

describe('vfile-location 5.0.3 换行扫描补丁', () => {
  it('长 LF 文档不会为每一行重新搜索剩余全文中的 CR', () => {
    const value = 'abcdefghij\n'.repeat(500);
    const originalIndexOf = String.prototype.indexOf;
    let searchedCharacters = 0;
    const indexOf = vi
      .spyOn(String.prototype, 'indexOf')
      .mockImplementation(function (
        this: string,
        search: string,
        position?: number,
      ) {
        if (String(this) === value && search === '\r') {
          searchedCharacters += value.length - (position || 0);
        }
        return originalIndexOf.call(this, search, position);
      });
    try {
      expect(location(value).toPoint(value.length)?.line).toBe(501);
    } finally {
      indexOf.mockRestore();
    }
    // 检查真实依赖的工作量上界，避免仅有正确结果却没有应用性能补丁。
    expect(searchedCharacters).toBeLessThanOrEqual(value.length * 2);
  });

  it.each([
    '',
    'abc',
    '\n',
    '\r',
    '\r\n',
    '\n\r',
    '\r\r\n',
    '甲\n乙\r\n丙\r丁',
    '😀\r\n汉字\n𝄞',
    'a\u2028b\u2029c',
  ])('保留换行及 UTF-16 偏移语义：%j', (value) => {
    const index = location(value);
    for (let offset = 0; offset <= value.length; offset++) {
      const expected = referencePoint(value, offset);
      expect(index.toPoint(offset)).toEqual(expected);
      expect(index.toOffset(expected)).toBe(offset);
    }
  });

  it('CRLF 中间仍属于上一行，结尾换行之后产生空行', () => {
    const index = location('a\r\nb\n');
    expect(index.toPoint(1)).toEqual({ line: 1, column: 2, offset: 1 });
    expect(index.toPoint(2)).toEqual({ line: 1, column: 3, offset: 2 });
    expect(index.toPoint(3)).toEqual({ line: 2, column: 1, offset: 3 });
    expect(index.toPoint(5)).toEqual({ line: 3, column: 1, offset: 5 });
    expect(index.toOffset({ line: 1, column: 3 })).toBe(2);
    expect(index.toOffset({ line: 1, column: 4 })).toBeUndefined();
    expect(index.toOffset({ line: 4, column: 1 })).toBeUndefined();
  });

  it('非法 offset 返回 undefined，合法小数偏移保持原有行为', () => {
    const index = location('a\r\nb');
    for (const offset of [
      -1,
      5,
      NaN,
      Infinity,
      -Infinity,
      null,
      undefined,
      '1',
    ]) {
      expect(index.toPoint(offset)).toBeUndefined();
    }
    expect(index.toPoint(2.5)).toEqual({ line: 1, column: 3.5, offset: 2.5 });
    expect(index.toOffset({ line: NaN, column: 1 })).toBeUndefined();
    expect(index.toOffset({ line: 1, column: NaN })).toBeUndefined();
  });

  it('确定性混合换行文档支持逆序和交错查询，且两种访问器共享索引', () => {
    const fragments = ['ab', '\r', '\n', '\r\n', '😀', '汉字', '\n\r'];
    let seed = 12345;
    for (let document = 0; document < 24; document++) {
      let value = '';
      for (let part = 0; part < 24; part++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        value += fragments[seed % fragments.length];
      }
      const index = location(value);
      const ends = referenceLineEnds(value);
      expect(index.toOffset({ line: ends.length, column: 1 })).toBe(
        ends.length > 1 ? ends[ends.length - 2] : 0,
      );
      for (let offset = value.length; offset >= 0; offset--) {
        const expected = referencePoint(value, offset);
        expect(index.toPoint(offset)).toEqual(expected);
        expect(index.toOffset(expected)).toBe(offset);
        const forward = value.length - offset;
        expect(index.toPoint(forward)).toEqual(referencePoint(value, forward));
      }
    }
  });
});
