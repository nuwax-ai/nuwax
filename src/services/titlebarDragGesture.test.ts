import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initTitlebarDragGesture } from './titlebarDragGesture';
import { hostBridge } from '@/utils/hostBridge';

vi.mock('@/utils/hostBridge', () => ({
  hostBridge: {
    titlebar: {
      beginDrag: vi.fn(),
      endDrag: vi.fn(),
      toggleMaximize: vi.fn(),
    },
  },
  isImmersiveShell: () => true,
  isMac: () => true,
  shellAvoid: { TOP: 36, CONTENT_TOP: 28 },
}));

const titlebar = () => (hostBridge as any).titlebar;

/** 在顶部带内派发 mousedown/dblclick（jsdom 不含坐标语义，手动带 clientY）。 */
function fire(type: string, y: number, target: Element, button = 0) {
  target.dispatchEvent(
    new MouseEvent(type, { bubbles: true, composed: true, button, clientY: y }),
  );
}

describe('titlebarDragGesture', () => {
  let dispose: () => void;

  beforeEach(() => {
    document.body.innerHTML = '';
    (titlebar() as any).beginDrag.mockClear();
    (hostBridge as any).titlebar.endDrag.mockClear();
    (hostBridge as any).titlebar.toggleMaximize.mockClear();
    dispose = initTitlebarDragGesture();
  });

  afterEach(() => {
    dispose?.();
    document.body.innerHTML = '';
  });

  it('顶部带内空白 mousedown→beginDrag，mouseup→endDrag', () => {
    const blank = document.createElement('div');
    document.body.append(blank);
    fire('mousedown', 18, blank);
    expect((hostBridge as any).titlebar.beginDrag).toHaveBeenCalledTimes(1);

    fire('mouseup', 18, blank);
    expect((hostBridge as any).titlebar.endDrag).toHaveBeenCalledTimes(1);
  });

  it('交互元素（button / pointer 光标 div）不发起拖拽', () => {
    const btn = document.createElement('button');
    document.body.append(btn);
    fire('mousedown', 18, btn);
    expect((hostBridge as any).titlebar.beginDrag).not.toHaveBeenCalled();

    const fakeBtn = document.createElement('div');
    fakeBtn.style.cursor = 'pointer';
    document.body.append(fakeBtn);
    fire('mousedown', 18, fakeBtn);
    expect((hostBridge as any).titlebar.beginDrag).not.toHaveBeenCalled();
  });

  it('带外 y（含负值与 28 以下安全带外）不发起拖拽；非左键不发起', () => {
    const blank = document.createElement('div');
    document.body.append(blank);
    fire('mousedown', 60, blank);
    fire('mousedown', -4, blank);
    fire('mousedown', 18, blank, 2);
    expect((hostBridge as any).titlebar.beginDrag).not.toHaveBeenCalled();
  });

  it('快速甩出窗口丢 mouseup 时，mousemove buttons=0 兜底 endDrag', () => {
    const blank = document.createElement('div');
    document.body.append(blank);
    fire('mousedown', 18, blank);
    // 模拟光标已回到窗口且左键已松开
    const move = new MouseEvent('mousemove', { buttons: 0, clientY: 18 });
    window.dispatchEvent(move);
    expect((hostBridge as any).titlebar.endDrag).toHaveBeenCalledTimes(1);
  });

  it('空白双击→toggleMaximize；交互元素双击不触发', () => {
    const blank = document.createElement('div');
    const btn = document.createElement('button');
    document.body.append(blank, btn);
    fire('dblclick', 18, blank);
    expect((hostBridge as any).titlebar.toggleMaximize).toHaveBeenCalledTimes(1);
    fire('dblclick', 18, btn);
    expect((hostBridge as any).titlebar.toggleMaximize).toHaveBeenCalledTimes(1);
  });
});
