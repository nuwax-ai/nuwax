import { bindEventHandlersV2 } from '@/pages/Antv-X6/v2/components/EventHandlersV2';
import type { ChildNodeV2 } from '@/pages/Antv-X6/v2/types';
import { NodeTypeEnumV2 } from '@/pages/Antv-X6/v2/types';
import { describe, expect, test, vi } from 'vitest';

// 创建简单的 graph mock，支持选中/撤销/重做/复制/粘贴等调用
const createGraphMock = () => {
  const graph: any = {
    bindKey: vi.fn(),
    getSelectedCells: vi.fn().mockReturnValue([]),
    copy: vi.fn(),
    paste: vi.fn(),
    cleanSelection: vi.fn(),
    isClipboardEmpty: vi.fn().mockReturnValue(false),
    canUndo: vi.fn().mockReturnValue(true),
    canRedo: vi.fn().mockReturnValue(true),
    undo: vi.fn(),
    redo: vi.fn(),
  };
  return graph;
};

const startNode: ChildNodeV2 = {
  id: 1,
  name: 'Start',
  type: NodeTypeEnumV2.Start,
  icon: '',
  nodeConfig: {},
};

const normalNode: ChildNodeV2 = {
  id: 2,
  name: 'Code',
  type: NodeTypeEnumV2.Code,
  icon: '',
  nodeConfig: {},
};

describe('EventHandlersV2', () => {
  test('copy/paste shortcuts copy selection and clean selection', () => {
    const graph = createGraphMock();
    const onNodeCopy = vi.fn();
    graph.getSelectedCells.mockReturnValue([
      { isNode: () => true, getData: () => normalNode },
    ]);

    bindEventHandlersV2({
      graph,
      onNodeCopy,
      onNodeDelete: vi.fn(),
      onEdgeDelete: vi.fn(),
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      modal: { confirm: vi.fn() } as any,
      message: { error: vi.fn(), warning: vi.fn() } as any,
    });

    const copyHandler = graph.bindKey.mock.calls.find((c: any) =>
      c[0].includes('ctrl+c'),
    )?.[1];
    expect(copyHandler).toBeTruthy();
    copyHandler();
    expect(graph.copy).toHaveBeenCalled();
  });

  test('delete prevents removing Start/End', () => {
    const graph = createGraphMock();
    const onNodeDelete = vi.fn();
    const message = { warning: vi.fn(), error: vi.fn() } as any;

    // 选中 Start 节点
    graph.getSelectedCells.mockReturnValue([
      { isNode: () => true, isEdge: () => false, getData: () => startNode },
    ]);

    bindEventHandlersV2({
      graph,
      onNodeCopy: vi.fn(),
      onNodeDelete,
      onEdgeDelete: vi.fn(),
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      modal: { confirm: vi.fn() } as any,
      message,
    });

    const delHandler = graph.bindKey.mock.calls.find((c: any) =>
      c[0].includes('delete'),
    )?.[1];
    delHandler();
    expect(onNodeDelete).not.toHaveBeenCalled();
    expect(message.warning).toHaveBeenCalled();
  });

  test('undo/redo shortcuts call graph undo/redo and notify', () => {
    const graph = createGraphMock();
    const onUndo = vi.fn();
    const onRedo = vi.fn();

    bindEventHandlersV2({
      graph,
      onNodeCopy: vi.fn(),
      onNodeDelete: vi.fn(),
      onEdgeDelete: vi.fn(),
      onUndo,
      onRedo,
      modal: { confirm: vi.fn() } as any,
      message: { warning: vi.fn(), error: vi.fn() } as any,
    });

    const undoHandler = graph.bindKey.mock.calls.find((c: any) =>
      c[0].includes('ctrl+z'),
    )?.[1];
    const redoHandler = graph.bindKey.mock.calls.find((c: any) =>
      c[0].includes('ctrl+shift+z'),
    )?.[1];

    undoHandler();
    redoHandler();

    expect(graph.undo).toHaveBeenCalled();
    expect(graph.redo).toHaveBeenCalled();
    expect(onUndo).toHaveBeenCalled();
    expect(onRedo).toHaveBeenCalled();
  });
});
