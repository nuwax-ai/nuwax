import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  collectTitlebarDragRegions,
  TITLEBAR_DRAG_REGION_SELECTOR,
} from './titlebarDragRegionSync';

/** jsdom 无布局：给元素挂固定 rect（与生产 getBoundingClientRect 等价的可测替身）。 */
function mockRect(el: Element, x: number, y: number, width: number, height: number) {
  el.getBoundingClientRect = vi.fn(() => ({
    x,
    y,
    left: x,
    top: y,
    right: x + width,
    bottom: y + height,
    width,
    height,
    toJSON: () => ({}),
  }));
}

/** 声明一个全宽顶部带。 */
function markBand(width: number, height = 36) {
  const marked = document.createElement('div');
  marked.dataset.nuwaxTitlebarDrag = 'true';
  mockRect(marked, 0, 0, width, height);
  document.body.append(marked);
  return marked;
}

/** 按区间桩 elementFromPoint（jsdom 无此 API，直接赋值）：命中区间返回对应交互元素，否则 null。 */
function stubHits(intervals: Array<{ from: number; to: number; el: Element }>) {
  (document as any).elementFromPoint = (x: number) =>
    intervals.find((i) => x >= i.from && x < i.to)?.el ?? null;
}

describe('titlebarDragRegionSync', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    delete (document as any).elementFromPoint;
    vi.restoreAllMocks();
  });

  it('只收集显式标记并裁剪到顶部 48px；无交互命中时整带保留', () => {
    const marked = document.createElement('div');
    marked.dataset.nuwaxTitlebarDrag = 'true';
    marked.getBoundingClientRect = vi.fn(() => ({
      x: -5,
      y: 20,
      left: -5,
      top: 20,
      right: 205,
      bottom: 70,
      width: 210,
      height: 50,
      toJSON: () => ({}),
    }));
    document.body.append(marked, document.createElement('button'));
    expect(document.querySelectorAll(TITLEBAR_DRAG_REGION_SELECTOR)).toHaveLength(1);
    expect(collectTitlebarDragRegions()).toEqual([
      { x: 0, y: 20, width: 205, height: 28 },
    ]);
  });

  it('带内交互元素挖洞：左右留空隙、洞内不放拖拽矩形', () => {
    markBand(1000);
    const avatar = document.createElement('button');
    const headerBtn = document.createElement('button');
    document.body.append(avatar, headerBtn);
    stubHits([
      { from: 900, to: 960, el: avatar },
      { from: 400, to: 432, el: headerBtn },
    ]);

    const regions = collectTitlebarDragRegions();
    // 洞外扩 4px：[396,436) 与 [896,964)；空隙 [0,396) [436,896) [964,1000)
    expect(regions).toEqual([
      { x: 0, y: 0, width: 396, height: 36 },
      { x: 436, y: 0, width: 460, height: 36 },
      { x: 964, y: 0, width: 36, height: 36 },
    ]);
  });

  it('非交互元素不挖洞：普通 div 覆盖处仍是拖拽区', () => {
    markBand(600);
    const plain = document.createElement('div');
    document.body.append(plain);
    stubHits([{ from: 100, to: 300, el: plain }]);

    expect(collectTitlebarDragRegions()).toEqual([
      { x: 0, y: 0, width: 600, height: 36 },
    ]);
  });

  it('自绘 onClick 控件（cursor:pointer 的 div）同样挖洞；右缘窄碎片丢弃', () => {
    markBand(600);
    const fakeButton = document.createElement('div');
    fakeButton.style.cursor = 'pointer';
    document.body.append(fakeButton);
    stubHits([{ from: 560, to: 592, el: fakeButton }]);

    const regions = collectTitlebarDragRegions();
    // 洞 [556,596)：其后空隙 600-596=4 < MIN_GAP_WIDTH(8)，整段丢弃
    expect(regions).toEqual([{ x: 0, y: 0, width: 556, height: 36 }]);
  });
});
