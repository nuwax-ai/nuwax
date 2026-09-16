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

describe('titlebarDragRegionSync', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('只收集显式标记并裁剪到顶部 48px', () => {
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
    const marked = document.createElement('div');
    marked.dataset.nuwaxTitlebarDrag = 'true';
    mockRect(marked, 0, 0, 1000, 36);
    document.body.append(marked);

    // 右上角头像簇：与带纵向相交（部分高出带上沿），应整段挖洞
    const avatar = document.createElement('button');
    avatar.setAttribute('aria-label', '用户头像');
    mockRect(avatar, 900, 12, 60, 40);
    document.body.append(avatar);

    // 页头按钮：完全在带内
    const headerBtn = document.createElement('button');
    mockRect(headerBtn, 400, 8, 32, 20);
    document.body.append(headerBtn);

    const regions = collectTitlebarDragRegions();
    // 空隙：[0,396) [436,896) [964,1000)，外扩 4px 边距已计入洞
    expect(regions).toEqual([
      { x: 0, y: 0, width: 396, height: 36 },
      { x: 436, y: 0, width: 460, height: 36 },
      { x: 964, y: 0, width: 36, height: 36 },
    ]);
  });

  it('带外的交互元素不挖洞；窄于 MIN_GAP_WIDTH 的碎片被丢弃', () => {
    const marked = document.createElement('div');
    marked.dataset.nuwaxTitlebarDrag = 'true';
    mockRect(marked, 0, 0, 600, 36);
    document.body.append(marked);

    // 带下方元素：不挖洞
    const below = document.createElement('button');
    mockRect(below, 100, 36, 80, 24);
    document.body.append(below);

    // 带内按钮贴右缘：右侧空隙 8px 恰好达标，左侧整段保留
    const rightBtn = document.createElement('button');
    mockRect(rightBtn, 580, 4, 12, 16);
    document.body.append(rightBtn);

    const regions = collectTitlebarDragRegions();
    // 右缘洞 [576,596)：其后空隙 600-596=4 < MIN_GAP_WIDTH(8)，整段丢弃
    expect(regions).toEqual([{ x: 0, y: 0, width: 576, height: 36 }]);
  });
});
