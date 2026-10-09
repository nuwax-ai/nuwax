import { describe, expect, it } from 'vitest';
import { fixCjkAutolinks } from '../remarkFixCjkAutolinks';

const createBareUrlTree = (
  source: string,
  url: string,
  displayText: string = url,
) => {
  const startOffset = source.indexOf(displayText);

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
            children: [{ type: 'text', value: displayText }],
            position: {
              start: { offset: startOffset },
              end: { offset: startOffset + displayText.length },
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

  it('将不带协议地址后的中文标点和正文移出链接', () => {
    const displayText = 'www.nuwax.com，当前可免费使用';
    const source = `官网是 ${displayText}`;
    const tree = createBareUrlTree(
      source,
      'http://www.nuwax.com，当前可免费使用',
      displayText,
    );

    fixCjkAutolinks(tree, source);

    expect(tree.children[0].children).toEqual([
      { type: 'text', value: '官网是 ' },
      expect.objectContaining({
        type: 'link',
        url: 'http://www.nuwax.com',
        children: [expect.objectContaining({ value: 'www.nuwax.com' })],
      }),
      { type: 'text', value: '，当前可免费使用' },
    ]);
  });

  it('将域名后的数字参考文献尾标移出链接', () => {
    const displayText = 'www.nuwax.com[1]，更多内容';
    const source = `参考地址：${displayText}`;
    const tree = createBareUrlTree(
      source,
      'http://www.nuwax.com[1]，更多内容',
      displayText,
    );

    fixCjkAutolinks(tree, source);

    expect(tree.children[0].children).toEqual([
      { type: 'text', value: '参考地址：' },
      expect.objectContaining({
        type: 'link',
        url: 'http://www.nuwax.com',
        children: [expect.objectContaining({ value: 'www.nuwax.com' })],
      }),
      { type: 'text', value: '[1]，更多内容' },
    ]);
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
