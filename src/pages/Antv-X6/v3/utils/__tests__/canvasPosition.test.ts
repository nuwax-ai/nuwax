/**
 * canvasPosition 单元测试
 */

import { describe, expect, it, vi } from 'vitest';
import {
  elementClientCenter,
  getPortClientCenter,
  isClientCoordinate,
  resolveQuickAddAnchorClient,
} from '../canvasPosition';

function createMockGraph(overrides: Record<string, unknown> = {}) {
  return {
    graphToLocal: vi.fn((p: { x: number; y: number }) => ({
      x: p.x + 1,
      y: p.y + 2,
    })),
    localToClient: vi.fn((p: { x: number; y: number }) => ({
      x: p.x + 10,
      y: p.y + 20,
    })),
    clientToGraph: vi.fn((p: { x: number; y: number }) => ({
      x: p.x - 10,
      y: p.y - 20,
    })),
    getCellById: vi.fn(),
    ...overrides,
  } as any;
}

function mockDomRect(
  left: number,
  top: number,
  width: number,
  height: number,
): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

describe('isClientCoordinate', () => {
  it('点在容器 rect 内应返回 true', () => {
    const container = {
      getBoundingClientRect: () => ({
        left: 100,
        right: 500,
        top: 50,
        bottom: 400,
      }),
    } as HTMLElement;
    expect(isClientCoordinate({ x: 200, y: 100 }, container)).toBe(true);
  });

  it('点在容器外应返回 false', () => {
    const container = {
      getBoundingClientRect: () => ({
        left: 100,
        right: 500,
        top: 50,
        bottom: 400,
      }),
    } as HTMLElement;
    expect(isClientCoordinate({ x: 80, y: 100 }, container)).toBe(false);
  });
});

describe('elementClientCenter', () => {
  it('应返回元素 rect 中心点', () => {
    const el = document.createElement('div');
    el.getBoundingClientRect = () => mockDomRect(100, 200, 20, 10);
    expect(elementClientCenter(el)).toEqual({ x: 110, y: 205 });
  });
});

describe('getPortClientCenter', () => {
  it('应根据节点位置与 port layout 计算 client 中心', () => {
    const graph = createMockGraph({
      getCellById: vi.fn(() => ({
        isNode: () => true,
        hasPort: () => true,
        getPort: () => ({ group: 'special' }),
        getPosition: () => ({ x: 300, y: 400 }),
        getPortsPosition: () => ({
          '1-route-a-out': { position: { x: 220, y: 78 } },
        }),
      })),
    });

    const center = getPortClientCenter(graph, '1', '1-route-a-out');
    expect(center).toEqual({ x: 530, y: 498 });
  });

  it('节点或端口不存在时返回 null', () => {
    const graph = createMockGraph({
      getCellById: vi.fn(() => null),
    });
    expect(getPortClientCenter(graph, '1', '1-in')).toBeNull();
  });
});

describe('resolveQuickAddAnchorClient', () => {
  it('有 magnetEl 时优先使用 DOM 中心，忽略 X6 端口中心', () => {
    const graph = createMockGraph({
      getCellById: vi.fn(() => ({
        isNode: () => true,
        hasPort: () => true,
        getPort: () => ({ group: 'out' }),
        getPosition: () => ({ x: 0, y: 0 }),
        getPortsPosition: () => ({
          '9-out': { position: { x: 220, y: 22 } },
        }),
      })),
    });
    const magnet = document.createElement('div');
    magnet.getBoundingClientRect = () => mockDomRect(500, 300, 6, 6);

    const anchor = resolveQuickAddAnchorClient({
      graph,
      nodeId: '9',
      portId: '9-out',
      event: { clientX: 1, clientY: 1 },
      magnetEl: magnet,
    });

    expect(anchor).toEqual({ x: 503, y: 303 });
  });

  it('无 magnet 时使用 event.target DOM 中心', () => {
    const graph = createMockGraph({
      getCellById: vi.fn(() => ({
        isNode: () => true,
        hasPort: () => true,
        getPort: () => ({ group: 'out' }),
        getPosition: () => ({ x: 0, y: 0 }),
        getPortsPosition: () => ({
          '9-out': { position: { x: 220, y: 22 } },
        }),
      })),
    });
    const target = document.createElement('circle');
    target.getBoundingClientRect = () => mockDomRect(400, 250, 8, 8);

    const anchor = resolveQuickAddAnchorClient({
      graph,
      nodeId: '9',
      portId: '9-out',
      event: { target, clientX: 1, clientY: 1 },
    });

    expect(anchor).toEqual({ x: 404, y: 254 });
  });

  it('无 DOM 锚点时使用 clientX/clientY', () => {
    const graph = createMockGraph({
      getCellById: vi.fn(() => null),
    });

    const anchor = resolveQuickAddAnchorClient({
      graph,
      nodeId: '9',
      portId: '9-out',
      event: { clientX: 320, clientY: 180 },
    });

    expect(anchor).toEqual({ x: 320, y: 180 });
  });

  it('无 DOM 与 client 坐标时回退到 X6 端口中心', () => {
    const graph = createMockGraph({
      getCellById: vi.fn(() => ({
        isNode: () => true,
        hasPort: () => true,
        getPort: () => ({ group: 'out' }),
        getPosition: () => ({ x: 0, y: 0 }),
        getPortsPosition: () => ({
          '9-out': { position: { x: 220, y: 22 } },
        }),
      })),
    });

    const anchor = resolveQuickAddAnchorClient({
      graph,
      nodeId: '9',
      portId: '9-out',
    });

    expect(anchor).toEqual({ x: 230, y: 42 });
  });

  it('全部失败时返回原点', () => {
    const graph = createMockGraph({
      getCellById: vi.fn(() => null),
    });

    const anchor = resolveQuickAddAnchorClient({
      graph,
      nodeId: '9',
      portId: '9-out',
    });

    expect(anchor).toEqual({ x: 0, y: 0 });
  });
});
