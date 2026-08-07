import { describe, expect, it } from 'vitest';
import { fixCjkAutolinks } from '../remarkFixCjkAutolinks';

const createBareUrlTree = (source: string, url: string) => {
  const startOffset = source.indexOf(url);

  return {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          { type: 'text', value: source.slice(0, startOffset) },
          {
            type: 'link',
            url,
            children: [{ type: 'text', value: url }],
            position: {
              start: { offset: startOffset },
              end: { offset: startOffset + url.length },
            },
          },
        ],
      },
    ],
  };
};

describe('fixCjkAutolinks', () => {
  it('将中文句号及后续正文移出裸 URL 链接', () => {
    const source = '已打开 https://www.baidu.com。需要我做什么操作？';
    const tree = createBareUrlTree(
      source,
      'https://www.baidu.com。需要我做什么操作？',
    );

    fixCjkAutolinks(tree, source);

    expect(tree.children[0].children).toEqual([
      { type: 'text', value: '已打开 ' },
      expect.objectContaining({
        type: 'link',
        url: 'https://www.baidu.com',
        children: [
          expect.objectContaining({
            type: 'text',
            value: 'https://www.baidu.com',
          }),
        ],
      }),
      { type: 'text', value: '。需要我做什么操作？' },
    ]);
  });

  it('没有中文边界时保留完整路径、查询参数和锚点', () => {
    const url = 'https://example.com/a/b?q=hello#result';
    const source = `结果：${url}`;
    const tree = createBareUrlTree(source, url);

    fixCjkAutolinks(tree, source);

    expect(tree.children[0].children[1]).toEqual(
      expect.objectContaining({ url }),
    );
    expect(tree.children[0].children).toHaveLength(2);
  });

  it('不会把国际化域名截断成不完整协议', () => {
    const url = 'https://百度.com';
    const source = `结果：${url}`;
    const tree = createBareUrlTree(source, url);

    fixCjkAutolinks(tree, source);

    expect(tree.children[0].children[1]).toEqual(
      expect.objectContaining({ url }),
    );
    expect(tree.children[0].children).toHaveLength(2);
  });

  it('不改写显式 Markdown 链接', () => {
    const url = 'https://example.com/中文路径';
    const source = `[查看页面](${url})`;
    const tree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              url,
              children: [{ type: 'text', value: url }],
              position: {
                start: { offset: 0 },
                end: { offset: source.length },
              },
            },
          ],
        },
      ],
    };

    fixCjkAutolinks(tree, source);

    expect(tree.children[0].children).toEqual([
      expect.objectContaining({ url }),
    ]);
  });
});
