import {
  flashNode,
  highlightNode,
  pulseNode,
  runningNode,
} from '@/pages/Antv-X6/v2/utils/nodeAnimationV2';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const createNodeMock = () => {
  const attrs: any = { body: { stroke: '#000' } };
  return {
    attr: vi.fn(),
    setAttrs: vi.fn((next) => Object.assign(attrs, next)),
    getAttrs: vi.fn(() => ({ ...attrs })),
    resize: vi.fn(),
    getSize: vi.fn(() => ({ width: 100, height: 50 })),
  } as any;
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('nodeAnimationV2', () => {
  test('highlightNode 应应用高亮并在超时后恢复', () => {
    const node = createNodeMock();
    const onComplete = vi.fn();
    highlightNode(node as any, { duration: 100, color: '#f00', onComplete });

    expect(node.attr).toHaveBeenCalled();
    vi.runAllTimers();
    expect(node.setAttrs).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  test('flashNode 循环闪烁后清理', () => {
    const node = createNodeMock();
    const onComplete = vi.fn();
    const cleanup = flashNode(node as any, {
      duration: 100,
      repeat: 2,
      onComplete,
    });

    vi.advanceTimersByTime(200);
    cleanup();
    expect(node.setAttrs).toHaveBeenCalled();
  });

  test('pulseNode 在 cleanup 时恢复大小与样式', () => {
    const node = createNodeMock();
    const onComplete = vi.fn();
    const cleanup = pulseNode(node as any, { duration: 100, onComplete });

    vi.advanceTimersByTime(150);
    cleanup();
    expect(node.resize).toHaveBeenCalledWith(100, 50);
    expect(node.setAttrs).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  test('runningNode cleanup 恢复样式', () => {
    const node = createNodeMock();
    const cleanup = runningNode(node as any, { color: '#0f0' });
    vi.advanceTimersByTime(200);
    cleanup();
    expect(node.setAttrs).toHaveBeenCalled();
  });
});
