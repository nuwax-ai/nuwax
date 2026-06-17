import GraphContainerV2 from '@/pages/Antv-X6/v2/components/GraphContainerV2';
import { __getGraph } from '@/pages/Antv-X6/v2/components/GraphV2';
import type {
  ChildNodeV2,
  GraphContainerRefV2,
  WorkflowDataV2,
} from '@/pages/Antv-X6/v2/types';
import { NodeTypeEnumV2 } from '@/pages/Antv-X6/v2/types';
import { render } from '@testing-library/react';
import React, { act, createRef } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { getLastMenuProps, setMenu } from './helpers/antdDropdownHelper';

vi.mock('@/pages/Antv-X6/v2/components/registerCustomNodesV2', () => ({
  registerCustomNodesV2: vi.fn(),
}));

vi.mock('@/pages/Antv-X6/v2/utils/nodeAnimationV2', () => ({
  resetAllAnimations: vi.fn(),
  injectAnimationStyles: vi.fn(),
  runningNode: vi.fn(() => vi.fn()),
  errorNode: vi.fn(() => vi.fn()),
  highlightNode: vi.fn(() => vi.fn()),
}));

vi.mock('@/pages/Antv-X6/v2/utils/graphV2', () => ({
  createBaseNodeData: (node: ChildNodeV2) => ({
    ...node,
    id: node.id?.toString?.(),
  }),
  createEdgeData: (edge: any) => edge,
  createLoopChildNodeData: (_loopId: number, child: ChildNodeV2) => child,
  adjustLoopNodeSize: vi.fn(() => ({ width: 100, height: 40 })),
  calculateNodeSize: vi.fn(() => ({ width: 100, height: 40 })),
  generatePorts: vi.fn(() => []),
  extractEdgesFromNodes: vi.fn(() => []),
}));

const createGraphMock = () => {
  const handlers: Record<string, (payload: any) => void> = {};
  return {
    on: vi.fn((event: string, handler: any) => {
      handlers[event] = handler;
    }),
    off: vi.fn(),
    trigger: vi.fn((event: string, payload: any) => {
      handlers[event]?.(payload);
    }),
    getGraphArea: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 80 })),
    addNode: vi.fn(),
    addEdge: vi.fn(),
    removeCell: vi.fn(),
    clearCells: vi.fn(),
    fromJSON: vi.fn(),
    getNodes: vi.fn(() => []),
    getEdges: vi.fn(() => []),
    getCellById: vi.fn(),
    cleanSelection: vi.fn(),
    select: vi.fn(),
    zoomTo: vi.fn(),
    zoomToFit: vi.fn(),
    canUndo: vi.fn(() => false),
    canRedo: vi.fn(() => false),
    undo: vi.fn(),
    redo: vi.fn(),
    dispose: vi.fn(),
  };
};

let graphInstance: ReturnType<typeof createGraphMock> | null = null;

vi.mock('@/pages/Antv-X6/v2/components/GraphV2', () => {
  return {
    initGraphV2: vi.fn(() => {
      graphInstance = createGraphMock();
      return graphInstance;
    }),
    __getGraph: () => graphInstance,
  };
});

vi.mock('@/pages/Antv-X6/v2/components/EventHandlersV2', () => ({
  bindEventHandlersV2: vi.fn(() => vi.fn()),
}));

// antd mock with Dropdown helper to access menu props
vi.mock('antd', () => {
  const message = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  };

  const Dropdown = ({
    menu,
    children,
  }: {
    menu: any;
    children: React.ReactNode;
  }) => {
    setMenu(menu);
    return <div data-testid="dropdown">{children}</div>;
  };

  return {
    Dropdown,
    App: {
      useApp: () => ({ modal: {}, message }),
    },
    message,
  };
});

const emptyWorkflow: WorkflowDataV2 = {
  nodeList: [],
  edgeList: [],
  lastSavedVersion: '',
  isDirty: false,
};

const baseProps = () => ({
  workflowData: emptyWorkflow,
  onNodeChange: vi.fn(),
  onNodeAdd: vi.fn(),
  onNodeDelete: vi.fn(),
  onNodeCopy: vi.fn(),
  onNodeSelect: vi.fn(),
  onEdgeAdd: vi.fn(),
  onEdgeDelete: vi.fn(),
  onZoomChange: vi.fn(),
  onHistoryChange: vi.fn(),
  onClickBlank: vi.fn(),
  createNodeByPortOrEdge: vi.fn(),
});

afterEach(() => {
  graphInstance = null;
});

describe('GraphContainerV2 context menu & zoom', () => {
  test('右键节点 copy/paste/delete 调用对应回调', () => {
    const onNodeCopy = vi.fn();
    const onNodeDelete = vi.fn();
    const props = { ...baseProps(), onNodeCopy, onNodeDelete };

    render(<GraphContainerV2 {...props} />);
    const graph = __getGraph();
    expect(graph).toBeTruthy();

    const nodeData: ChildNodeV2 = {
      id: 10,
      name: 'Variable',
      type: NodeTypeEnumV2.Variable,
      icon: '',
      nodeConfig: {},
    } as ChildNodeV2;

    act(() => {
      graph!.trigger('node:contextmenu', {
        e: { preventDefault: vi.fn(), clientX: 10, clientY: 20 },
        node: { getData: () => nodeData },
      });
    });

    const menu = getLastMenuProps();
    expect(menu).toBeTruthy();

    act(() => {
      menu.onClick?.({ key: 'copy' });
    });
    expect(onNodeCopy).toHaveBeenCalledWith(nodeData);

    act(() => {
      graph!.trigger('blank:contextmenu', {
        preventDefault: vi.fn(),
        clientX: 0,
        clientY: 0,
      });
    });
    const blankMenu = getLastMenuProps();
    act(() => {
      blankMenu.onClick?.({ key: 'paste' });
    });
    expect(onNodeCopy).toHaveBeenCalledTimes(2);

    const deletable: ChildNodeV2 = {
      ...nodeData,
      id: 20,
      name: 'Normal',
    };
    act(() => {
      graph!.trigger('node:contextmenu', {
        e: { preventDefault: vi.fn(), clientX: 5, clientY: 6 },
        node: { getData: () => deletable },
      });
    });
    const delMenu = getLastMenuProps();
    act(() => {
      delMenu.onClick?.({ key: 'delete' });
    });
    expect(onNodeDelete).toHaveBeenCalledWith(20, deletable);
    expect(graph!.removeCell).toHaveBeenCalledWith('20');
  });

  test('缩放调用 graph zoomTo / zoomToFit', () => {
    const ref = createRef<GraphContainerRefV2>();
    render(<GraphContainerV2 ref={ref} {...baseProps()} />);
    const graph = __getGraph();
    expect(graph).toBeTruthy();

    act(() => {
      ref.current?.graphChangeZoom(1.5);
    });
    expect(graph!.zoomTo).toHaveBeenCalledWith(1.5);

    act(() => {
      ref.current?.graphChangeZoomToFit();
    });
    expect(graph!.zoomToFit).toHaveBeenCalledTimes(1);
  });
});
