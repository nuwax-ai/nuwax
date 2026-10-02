import {
  startEdgeFlowAnimation,
  stopEdgeFlowAnimation,
} from '@/pages/Antv-X6/v3/utils/graphV3';
import { Edge } from '@antv/x6';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 发布包的 CJS/ESM 入口都不能被 Node 直接加载；仅在内存打包同包真实实现，不写依赖或产物。
vi.mock('@antv/x6', async () => {
  const { createRequire } = await import('node:module');
  const { build } = await import('esbuild');
  const require = createRequire(import.meta.url);
  const bundle = await build({
    entryPoints: [require.resolve('@antv/x6/es/index.js')],
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'iife',
    globalName: 'X6AnimationTestRuntime',
  });
  return new Function(
    `${bundle.outputFiles[0].text}\nreturn X6AnimationTestRuntime;`,
  )() as typeof import('@antv/x6');
});
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
  getCurrentLang: () => 'zh-CN',
}));
vi.mock('@/pages/Antv-X6/v3/utils/workflowV3', () => ({
  getWidthAndHeight: () => ({ width: 200, height: 100 }),
}));

let timelineTime = 0;
let nextFrameId = 1;
const pendingFrames = new Map<number, FrameRequestCallback>();
const testEdges: Edge[] = [];
let originalTimeline: PropertyDescriptor | undefined;

const tickAt = (time: number) => {
  timelineTime = time;
  const callbacks = [...pendingFrames.values()];
  pendingFrames.clear();
  callbacks.forEach((callback) => callback(time));
};

const createEdge = (port: string = '1-out') => {
  const edge = new Edge({
    source: { cell: '1', port },
    target: '2',
    attrs: { line: { strokeDashoffset: 7 } },
  });
  testEdges.push(edge);
  return edge;
};

beforeEach(() => {
  timelineTime = 0;
  nextFrameId = 1;
  pendingFrames.clear();
  originalTimeline = Object.getOwnPropertyDescriptor(document, 'timeline');
  Object.defineProperty(document, 'timeline', {
    configurable: true,
    value: {
      get currentTime() {
        return timelineTime;
      },
    },
  });
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    pendingFrames.set(id, callback);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) =>
    pendingFrames.delete(id),
  );
});

afterEach(() => {
  testEdges.forEach((edge) => {
    stopEdgeFlowAnimation(edge);
    edge.dispose();
  });
  testEdges.length = 0;
  pendingFrames.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalTimeline)
    Object.defineProperty(document, 'timeline', originalTimeline);
  else Reflect.deleteProperty(document, 'timeline');
});

describe('工作流边动画与 X6 实际动画 API', () => {
  it('首启动使虚线位移，并按 600ms 周期持续循环', () => {
    const edge = createEdge();
    startEdgeFlowAnimation(edge);
    const animation = edge.getAnimations()[0];
    expect(animation.playState).toBe('running');
    expect(edge.attr('line/strokeDasharray')).toBe('8 4');
    expect(edge.attr('line/strokeDashoffset')).toBe(20);

    // 由 X6 KeyframeEffect 的真实插值写入 attrs，回调形式的旧 API 在此没有任何位移。
    tickAt(150);
    expect(edge.attr('line/strokeDashoffset')).toBe(15);
    tickAt(300);
    expect(edge.attr('line/strokeDashoffset')).toBe(10);
    tickAt(450);
    expect(edge.attr('line/strokeDashoffset')).toBe(5);
    tickAt(600);
    expect(edge.attr('line/strokeDashoffset')).toBe(20);
    tickAt(900);
    expect(edge.attr('line/strokeDashoffset')).toBe(10);
    expect(animation.playState).toBe('running');
  });

  it('重复启动复用当前动画，不新增 RAF 或动画实例', () => {
    const edge = createEdge();
    const animate = vi.spyOn(edge, 'animate');
    startEdgeFlowAnimation(edge);
    const firstAnimation = edge.getAnimations()[0];
    startEdgeFlowAnimation(edge);
    expect(animate).toHaveBeenCalledTimes(1);
    expect(edge.getAnimations()).toEqual([firstAnimation]);
    expect(pendingFrames.size).toBe(1);
    tickAt(300);
    expect(edge.attr('line/strokeDashoffset')).toBe(10);
  });

  it('取消恢复原位移与普通线样式，取消后可启动新动画', () => {
    const edge = createEdge();
    startEdgeFlowAnimation(edge);
    const firstAnimation = edge.getAnimations()[0];
    const cancel = vi.spyOn(firstAnimation, 'cancel');
    tickAt(300);
    stopEdgeFlowAnimation(edge);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(firstAnimation.playState).toBe('idle');
    expect(pendingFrames.size).toBe(0);
    expect(edge.attr('line/strokeDashoffset')).toBe(7);
    expect(edge.attr('line/strokeDasharray')).toBe('');
    expect(edge.attr('line/strokeWidth')).toBe(1);
    tickAt(600);
    expect(edge.attr('line/strokeDashoffset')).toBe(7);
    stopEdgeFlowAnimation(edge);
    expect(cancel).toHaveBeenCalledTimes(1);

    startEdgeFlowAnimation(edge);
    const restartedAnimation = edge.getAnimations()[1];
    expect(restartedAnimation).not.toBe(firstAnimation);
    expect(restartedAnimation.playState).toBe('running');
    expect(edge.attr('line/strokeDashoffset')).toBe(20);
    tickAt(900);
    expect(edge.attr('line/strokeDashoffset')).toBe(10);
  });

  it.each([
    { port: '1-out', color: '#5147FF' },
    { port: '1-route-default-out', color: '#5147FF' },
    {
      port: '1-route-9f9d9478-8b79-4201-b995-93f339d7dce8-out',
      color: '#fa8c16',
    },
  ])('启动和取消均保持 $port 的分支颜色', ({ port, color }) => {
    const edge = createEdge(port);
    startEdgeFlowAnimation(edge);
    expect(edge.attr('line/stroke')).toBe(color);
    expect(edge.attr('line/strokeWidth')).toBe(2);
    tickAt(300);
    stopEdgeFlowAnimation(edge);
    expect(edge.attr('line/stroke')).toBe(color);
    expect(edge.attr('line/strokeWidth')).toBe(1);
  });
});
