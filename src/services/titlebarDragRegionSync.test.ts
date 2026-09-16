import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  collectTitlebarDragRegions,
  TITLEBAR_DRAG_REGION_SELECTOR,
} from './titlebarDragRegionSync';

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
});
