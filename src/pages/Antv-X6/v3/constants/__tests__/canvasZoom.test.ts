import type { Graph } from '@antv/x6';
import { describe, expect, it, vi } from 'vitest';
import { CANVAS_ZOOM_TO_FIT_OPTIONS, zoomGraphToFit } from '../canvasZoom';

describe('zoomGraphToFit', () => {
  it('graph 为空时不调用', () => {
    expect(() => zoomGraphToFit(null)).not.toThrow();
  });

  it('先 resize 再 zoomToFit', () => {
    const resize = vi.fn();
    const zoomToFit = vi.fn();
    const getCells = vi.fn(() => [{ id: '1' }]);
    const getAllCellsBBox = vi.fn(() => ({ width: 100, height: 80 }));

    const graph = {
      container: { clientWidth: 800, clientHeight: 460 },
      resize,
      zoomToFit,
      getCells,
      getAllCellsBBox,
    } as unknown as Graph;

    zoomGraphToFit(graph);

    expect(resize).toHaveBeenCalledWith(800, 460);
    expect(zoomToFit).toHaveBeenCalledTimes(1);
    expect(zoomToFit).toHaveBeenCalledWith(CANVAS_ZOOM_TO_FIT_OPTIONS);
  });

  it('cell geometry bbox 为空时回退 useCellGeometry: false', () => {
    const zoomToFit = vi.fn();
    const graph = {
      container: { clientWidth: 400, clientHeight: 300 },
      resize: vi.fn(),
      zoomToFit,
      getCells: vi.fn(() => [{ id: '1' }]),
      getAllCellsBBox: vi.fn(() => ({ width: 0, height: 0 })),
    } as unknown as Graph;

    zoomGraphToFit(graph);

    expect(zoomToFit).toHaveBeenCalledTimes(2);
    expect(zoomToFit).toHaveBeenNthCalledWith(2, {
      ...CANVAS_ZOOM_TO_FIT_OPTIONS,
      useCellGeometry: false,
    });
  });
});
