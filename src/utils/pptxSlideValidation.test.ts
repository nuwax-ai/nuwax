import { afterEach, describe, expect, it } from 'vitest';
import { validateAndOrderPptxSlides } from './pptxSlideValidation';

function makePages(names: Array<string | undefined>) {
  const host = document.createElement('div');
  const parent = document.createElement('div');
  host.append(parent);
  const pages = names.map(() => {
    const page = document.createElement('div');
    page.className = 'pptx-preview-slide-wrapper';
    parent.append(page);
    return page;
  });
  return {
    host,
    parent,
    pages,
    previewer: { pptx: { slides: names.map((name) => ({ name })) } },
  };
}

afterEach(() => document.body.replaceChildren());

describe('共享 PPTX 页数和页序校验', () => {
  it('按关系顺序移动已有页并记录真实路径', () => {
    const { previewer, host, parent, pages } = makePages([
      '/ppt/slides/slide1.xml',
      'ppt/slides/slide2.xml',
    ]);
    const order = ['ppt/slides/slide2.xml', 'ppt/slides/slide1.xml'];

    validateAndOrderPptxSlides(previewer, host, order);

    expect(Array.from(parent.children)).toEqual([pages[1], pages[0]]);
    expect(pages.map((page) => page.dataset.pptxSlidePath)).toEqual([
      order[1],
      order[0],
    ]);
  });

  it.each([
    { names: [], paths: [] },
    { names: ['ppt/slides/slide1.xml'], paths: [] },
    { names: ['ppt/slides/slide1.xml'], paths: ['ppt/slides/slide2.xml'] },
    { names: [undefined], paths: ['ppt/slides/slide1.xml'] },
    {
      names: ['ppt/slides/slide1.xml', 'ppt/slides/slide1.xml'],
      paths: ['ppt/slides/slide1.xml', 'ppt/slides/slide2.xml'],
    },
  ])('不完整或重复的解析页拒绝作为成功预览：$names', ({ names, paths }) => {
    const { previewer, host } = makePages(names);
    expect(() => validateAndOrderPptxSlides(previewer, host, paths)).toThrow(
      expect.objectContaining({ code: 'incomplete' }),
    );
  });

  it('渲染少一页时抛出 incomplete', () => {
    const { previewer, host, pages } = makePages([
      'ppt/slides/slide1.xml',
      'ppt/slides/slide2.xml',
    ]);
    pages[1].remove();
    expect(() =>
      validateAndOrderPptxSlides(previewer, host, [
        'ppt/slides/slide1.xml',
        'ppt/slides/slide2.xml',
      ]),
    ).toThrow(expect.objectContaining({ code: 'incomplete' }));
  });

  it('页位于不同父容器时拒绝移动，避免错误归并', () => {
    const { previewer, host, pages, parent } = makePages([
      'ppt/slides/slide1.xml',
      'ppt/slides/slide2.xml',
    ]);
    const other = document.createElement('div');
    host.append(other);
    other.append(pages[1]);

    expect(() =>
      validateAndOrderPptxSlides(previewer, host, [
        'ppt/slides/slide1.xml',
        'ppt/slides/slide2.xml',
      ]),
    ).toThrow(expect.objectContaining({ code: 'incomplete' }));
    expect(pages[0].parentElement).toBe(parent);
    expect(pages[1].parentElement).toBe(other);
  });
});
