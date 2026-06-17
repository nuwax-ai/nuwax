import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('umi', () => ({
  useParams: () => ({ workflowId: '1', spaceId: '2' }),
  history: { push: vi.fn() },
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual<any>('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
    Modal: Object.assign(
      (props: any) => <div data-testid="modal">{props.children}</div>,
      { confirm: vi.fn() },
    ),
  };
});

vi.mock('@/utils/fetchEventSource', () => ({
  createSSEConnection: vi.fn(() => ({ close: vi.fn() })),
}));

vi.mock('@/pages/Antv-X6/v2/hooks/useWorkflowDataV2', () => ({
  useWorkflowDataV2: () => ({
    workflowData: {
      nodeList: [],
      edgeList: [],
      lastSavedVersion: '',
      isDirty: false,
    },
    isLoading: false,
    isSaving: false,
    isDirty: false,
    addNode: vi.fn(),
    updateNode: vi.fn(),
    deleteNode: vi.fn(),
    addEdge: vi.fn(),
    deleteEdge: vi.fn(),
    batchUpdate: vi.fn(),
    getNodeById: vi.fn(),
    getEdgesByNodeId: vi.fn(),
    refreshData: vi.fn(),
    saveNow: vi.fn(),
    canUndo: vi.fn(() => false),
    canRedo: vi.fn(() => false),
    undo: vi.fn(),
    redo: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('@/pages/Antv-X6/v2/utils/graphV2', () => ({
  calculateNewNodePosition: () => ({ x: 0, y: 0 }),
  getNodeShape: () => ({ width: 100, height: 50 }),
}));

vi.mock('@/pages/Antv-X6/v2/utils/variableReferenceV2', () => ({
  calculateNodePreviousArgs: vi.fn(() => ({})),
}));

vi.mock('@/pages/Antv-X6/v2/utils/workflowValidatorV2', () => ({
  validateWorkflow: vi.fn(() => ({ valid: true, errors: [] })),
  ValidationError: class {},
}));

vi.mock('@/pages/Antv-X6/v2/components/drawer/NodeDrawerV2', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="drawer" {...props} />,
}));

vi.mock('@/pages/Antv-X6/v2/components/error/ErrorListV2', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="error-list">{props.errors?.length || 0}</div>
  ),
}));

vi.mock('@/pages/Antv-X6/v2/components/GraphContainerV2', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="graph">{props.workflowData?.nodeList?.length}</div>
  ),
}));

vi.mock('@/pages/Antv-X6/v2/components/layout/ControlPanelV2', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="control">{props.zoom}</div>,
}));

vi.mock('@/pages/Antv-X6/v2/components/layout/HeaderV2', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="header">
      {props.workflowId}-{props.spaceId}
    </div>
  ),
}));

vi.mock('@/pages/Antv-X6/v2/components/layout/StencilContentV2', () => ({
  __esModule: true,
  default: () => <div data-testid="stencil" />,
}));

vi.mock('@/pages/Antv-X6/v2/components/modal', () => ({
  CreateComponentModalV2: (props: any) => (
    <div data-testid="create-modal">{String(props.open)}</div>
  ),
  EditWorkflowModalV2: (props: any) => (
    <div data-testid="edit-modal">{String(props.open)}</div>
  ),
  PublishModalV2: (props: any) => (
    <div data-testid="publish-modal">{String(props.open)}</div>
  ),
  TestRunModalV2: (props: any) => (
    <div data-testid="test-run-modal">{String(props.open)}</div>
  ),
}));

vi.mock('@/pages/Antv-X6/v2/components/version', () => ({
  VersionHistoryV2: (props: any) => (
    <div data-testid="version">{String(props.open)}</div>
  ),
}));

vi.mock('@/pages/Antv-X6/v2/services/workflowV2', () => ({
  __esModule: true,
  default: { isSuccess: () => true, extractData: () => null },
  TEST_RUN_ENDPOINT: '/api/workflow/test/execute',
}));

import WorkflowV2 from '@/pages/Antv-X6/v2/indexV2';

describe('indexV2 smoke', () => {
  test('渲染主容器且不抛异常', () => {
    render(<WorkflowV2 />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('graph')).toBeInTheDocument();
    expect(screen.getByTestId('control')).toBeInTheDocument();
  });
});
