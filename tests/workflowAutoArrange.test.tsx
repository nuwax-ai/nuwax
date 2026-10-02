import { SaveStatusEnum } from '@/models/workflowV3';
import Workflow from '@/pages/Antv-X6/v3/indexV3';
import { workflowProxy } from '@/pages/Antv-X6/v3/services/workflowProxyV3';
import { workflowSaveService } from '@/pages/Antv-X6/v3/services/WorkflowSaveService';
import AgentFlowCanvas from '@/pages/EditAgent/AgentFlowCanvas';
import AgentHeader from '@/pages/EditAgent/AgentHeader';
import type { IgetDetails } from '@/services/workflow';
import { NodeShapeEnum, NodeTypeEnum } from '@/types/enums/common';
import type {
  ChildNode,
  GraphContainerProps,
  GraphContainerRef,
} from '@/types/interfaces/graph';
import type { Graph } from '@antv/x6';
import { Edge, Model, Node } from '@antv/x6';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  graph: null as Graph | null,
  mounted: true,
  getGraphRef: vi.fn(),
  saveWorkflow: vi.fn(),
  sendBeacon: vi.fn(),
  setInfo: vi.fn(),
  model: {
    getWorkflow: () => ({ id: 0 }),
    storeWorkflow: vi.fn(),
    clearWorkflow: vi.fn(),
    visible: false,
    setVisible: vi.fn(),
    handleInitLoading: vi.fn(),
    globalLoadingTime: 0,
    setTestRun: vi.fn(),
    setReferenceList: vi.fn(),
    setIsModified: vi.fn(),
    skillChange: false,
    setSkillChange: vi.fn(),
    isModified: false,
    setSaveStatus: vi.fn(),
    setLastSaveTime: vi.fn(),
    setSaveError: vi.fn(),
  },
}));

// 与动画回归相同：只读内存打包真实 X6，保留 Model/Node/Edge 的连接和位置语义。
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
    globalName: 'X6LayoutTestRuntime',
  });
  return new Function(
    `${bundle.outputFiles[0].text}\nreturn X6LayoutTestRuntime;`,
  )() as typeof import('@antv/x6');
});

vi.mock('umi', () => ({
  useLocation: () => ({ search: '' }),
  useParams: () => ({}),
  history: { back: vi.fn() },
  useModel: () => state.model,
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) =>
    key === 'PC.Pages.AntvX6Header.autoArrange' ? '自动布局' : key,
  getCurrentLang: () => 'zh-CN',
}));
vi.mock('@/services/workflow', () => ({
  default: { saveWorkflow: state.saveWorkflow },
}));
vi.mock('@/utils/logger', () => ({
  workflowLogger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('@/constants/common.constants', () => ({ CREATED_TABS: [] }));
vi.mock('@/constants/space.constants', () => ({
  APPLICATION_MORE_ACTION_DETAIL: [],
}));
vi.mock('@/pages/Antv-X6/v3/indexV3.less', () => ({ default: {} }));
vi.mock('@/pages/EditAgent/AgentHeader/index.less', () => ({ default: {} }));
vi.mock('@/hooks/useDisableSaveShortcut', () => ({ default: () => {} }));
vi.mock('@/hooks/useDrawerScroll', () => ({ default: () => {} }));
vi.mock('@/hooks/useStyle3WorkbenchHost', () => ({ default: () => false }));
vi.mock('@/hooks/useThrottledCallback', () => ({
  useThrottledCallback: (callback: unknown) => callback,
}));
vi.mock('@/utils/router', () => ({ jumpBack: vi.fn() }));
vi.mock('@/utils/updateNode', () => ({
  changeNodeConfig: vi.fn(),
  updateCurrentNode: vi.fn(),
  updateSkillComponentConfigs: vi.fn(),
}));
vi.mock('@/pages/Antv-X6/v3/utils/graphV3', () => ({
  calculateNodePosition: vi.fn(),
}));
vi.mock('@/pages/Antv-X6/v3/utils/workflowV3', () => ({
  checkNodeModified: () => false,
  setFormDefaultValues: vi.fn(),
  returnBackgroundColor: () => '#fff',
  returnImg: () => null,
  getImg: () => '',
}));
vi.mock('@/pages/Antv-X6/v3/utils/variableReferenceV3', () => ({
  calculateNodePreviousArgs: vi.fn(),
}));
vi.mock('@/pages/Antv-X6/v3/hooks/useRegisterWorkflowRefresh', () => ({
  useRegisterWorkflowRefresh: () => {},
}));
vi.mock('@/pages/Antv-X6/v3/hooks/useModifiedSaveUpdateV3', () => ({
  default: () => {},
}));
vi.mock('@/pages/Antv-X6/v3/hooks/useWorkflowLifecycle', () => ({
  useWorkflowLifecycle: () => ({
    info: { id: 1 },
    setInfo: state.setInfo,
    graphParams: { nodeList: [], edgeList: [] },
    setGraphParams: vi.fn(),
    onConfirm: vi.fn(),
    refreshGraphData: vi.fn(),
  }),
}));
vi.mock('@/pages/Antv-X6/v3/hooks/useGraphInteraction', () => ({
  useGraphInteraction: () => ({ nodeChangeEdge: vi.fn(), changeNode: vi.fn() }),
}));
vi.mock('@/pages/Antv-X6/v3/hooks/useNodeOperations', () => ({
  useNodeOperations: () => ({
    deleteNode: vi.fn(),
    copyNode: vi.fn(),
    dragChild: vi.fn(),
    insertNodeBetween: vi.fn(),
    onAdded: vi.fn(),
  }),
}));
vi.mock('@/pages/Antv-X6/v3/hooks/useTestRun', () => ({
  useTestRun: () => ({
    testRunAll: vi.fn(),
    runTest: vi.fn(),
    handleClearRunResult: vi.fn(),
    setTestRunResult: vi.fn(),
  }),
}));
vi.mock('@/pages/Antv-X6/v3/hooks/useWorkflowValidation', () => ({
  useWorkflowValidation: () => ({
    isValidLoading: false,
    validWorkflow: vi.fn(),
    handleShowPublish: vi.fn(),
    setShowPublish: vi.fn(),
    handleConfirmPublishWorkflow: vi.fn(),
  }),
}));
vi.mock('@/pages/Antv-X6/v3/component/graph', () => ({
  setHistoryProcessing: vi.fn(),
}));

// 真实 Layout、Header 和 ControlPanel 保留，只隔离不参与布局的面板与图 DOM。
vi.mock('@/components/base', () => ({
  SvgIcon: ({ name }: { name: string }) => (
    <span role="img" aria-label={name} />
  ),
}));
vi.mock('@/components/base/SvgIcon', () => ({ default: () => <span /> }));
vi.mock('@/utils/hostBridge', () => ({ immersiveHeaderCompact: () => ({}) }));
vi.mock('@/utils', () => ({ getTime: () => '12:00' }));
vi.mock('@/components/Created', () => ({ default: () => null }));
vi.mock('@/components/CreateWorkflow', () => ({ default: () => null }));
vi.mock('@/components/FoldWrap', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock('@/components/OtherAction', () => ({ default: () => null }));
vi.mock('@/components/PublishComponentModal', () => ({ default: () => null }));
vi.mock('@/components/TestRun', () => ({ default: () => null }));
vi.mock('@/components/VersionHistory', () => ({ default: () => null }));
vi.mock('@/pages/Antv-X6/components/VersionAction', () => ({
  default: () => null,
}));
vi.mock('@/pages/Antv-X6/v3/components/panels/PropertyPanel', () => ({
  default: () => null,
}));
vi.mock('@/pages/Antv-X6/v3/components/layout/ErrorList', () => ({
  default: () => null,
}));
vi.mock('@/pages/Antv-X6/v3/components/layout/Sidebar', () => ({
  default: () => null,
}));
vi.mock('@/pages/Antv-X6/v3/components/graph/GraphContainer', async () => {
  const { forwardRef, useImperativeHandle } = await import('react');
  return {
    default: forwardRef<GraphContainerRef, GraphContainerProps>(
      function GraphDomShell(_props, ref) {
        // 故意只提供正式 getter，无 getGraph 兼容别名。
        useImperativeHandle(ref, () =>
          state.mounted
            ? ({
                getGraphRef: state.getGraphRef,
              } as unknown as GraphContainerRef)
            : (null as unknown as GraphContainerRef),
        );
        return <div data-testid="graph-dom-shell" />;
      },
    ),
  };
});

const renderAgentFlowCanvas = () =>
  render(<AgentFlowCanvas workflowId={1} spaceId={2} />);

const models: Model[] = [];
const createGraph = (
  ids: string[],
  connections: [string, string][] = [],
  startId = ids[0],
) => {
  const model = new Model();
  models.push(model);
  const nodes = ids.map((id): Node => {
    const data: ChildNode = {
      id: Number(id),
      name: id,
      description: '',
      workflowId: 1,
      type: id === startId ? NodeTypeEnum.Start : NodeTypeEnum.Agent,
      shape: NodeShapeEnum.General,
      icon: '',
      nextNodeIds: [],
      nodeConfig: {},
    };
    return new Node({ id, x: 999, y: 777, width: 200, height: 100, data });
  });
  model.addCells([
    ...nodes,
    ...connections.map(
      ([source, target], index) =>
        new Edge({ id: `e${index}`, source, target }),
    ),
  ]);
  // 仅隔离 Graph 的 DOM/View；连接查找、节点移动和保存提取都消费真实 X6 Model。
  state.graph = {
    getNodes: () => model.getNodes(),
    getEdges: () => model.getEdges(),
    getCellById: (id: string) => model.getCell(id),
    getOutgoingEdges: (id: string) => model.getOutgoingEdges(id),
    canUndo: () => false,
    canRedo: () => false,
    on: model.on.bind(model),
  } as unknown as Graph;
  const nodeData = nodes.map((node) => node.getData<ChildNode>());
  const details = {
    id: 1,
    name: 'layout',
    description: '',
    nodes: nodeData,
    startNode: nodeData.find((node) => node.type === NodeTypeEnum.Start),
    editVersion: 7,
  } as IgetDetails;
  workflowSaveService.initialize(details);
  workflowProxy.initialize({
    workflowId: 1,
    nodes: nodeData,
    edges: connections.map(([source, target]) => ({ source, target })),
    systemVariables: [],
    modified: '',
  });
  workflowProxy.setWorkflowInfo(details);
  return { model, nodes, graph: state.graph };
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  workflowSaveService.reset();
  workflowProxy.reset();
  state.graph = null;
  state.mounted = true;
  state.getGraphRef.mockReset().mockImplementation(() => state.graph);
  state.saveWorkflow.mockReset().mockResolvedValue({ code: '0000', data: 8 });
  state.sendBeacon.mockReset().mockReturnValue(true);
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true,
    value: state.sendBeacon,
  });
});
afterEach(() => {
  workflowProxy.clearPendingUpdates();
  workflowSaveService.clearDirty();
  cleanup();
  models.forEach((model) => model.dispose());
  models.length = 0;
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('indexV3 自动布局按钮入口', () => {
  it('通过真实按钮按 BFS 布局，标脏后防抖保存最新坐标并在成功后清除脏状态', async () => {
    const { nodes, model } = createGraph(
      ['1', '2', '3', '4'],
      [
        ['1', '2'],
        ['1', '3'],
        ['2', '4'],
        ['3', '4'],
      ],
    );
    const moved = vi.fn();
    model.on('node:moved', moved);
    const markDirty = vi.spyOn(workflowSaveService, 'markDirty');
    let completeSave!: (value: { code: string; data: number }) => void;
    state.saveWorkflow.mockReturnValueOnce(
      new Promise((resolve) => {
        completeSave = resolve;
      }),
    );
    renderAgentFlowCanvas();
    fireEvent.click(screen.getByRole('button', { name: '自动布局' }));
    expect(state.getGraphRef).toHaveBeenCalledTimes(1);
    expect(nodes.map((node) => node.getPosition())).toEqual([
      { x: 80, y: 100 },
      { x: 80, y: 220 },
      { x: 80, y: 340 },
      { x: 80, y: 460 },
    ]);
    expect(moved).not.toHaveBeenCalled();
    expect(markDirty).toHaveBeenCalledTimes(1);
    expect(workflowSaveService.hasPendingChanges()).toBe(true);
    expect(workflowProxy.hasPendingChanges()).toBe(true);
    expect(
      workflowProxy.getNodes().map((node) => ({
        x: node.nodeConfig.extension?.x,
        y: node.nodeConfig.extension?.y,
      })),
    ).toEqual(nodes.map((node) => node.getPosition()));
    expect(state.saveWorkflow).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1499);
    });
    expect(state.saveWorkflow).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(state.saveWorkflow).toHaveBeenCalledTimes(1);
    expect(state.model.setSaveStatus).toHaveBeenLastCalledWith(
      SaveStatusEnum.Saving,
    );
    expect(workflowSaveService.hasPendingChanges()).toBe(true);
    expect(workflowProxy.hasPendingChanges()).toBe(true);
    const payload = state.saveWorkflow.mock.calls[0][0]
      .workflowConfig as IgetDetails;
    expect(payload.editVersion).toBe(7);
    expect(
      payload.nodes.map((node) => ({
        x: node.nodeConfig.extension?.x,
        y: node.nodeConfig.extension?.y,
      })),
    ).toEqual(nodes.map((node) => node.getPosition()));
    await act(async () => {
      completeSave({ code: '0000', data: 8 });
    });
    expect(workflowSaveService.hasPendingChanges()).toBe(false);
    expect(workflowProxy.hasPendingChanges()).toBe(false);
    expect(workflowSaveService.getEditVersion()).toBe(8);
    expect(state.model.setSaveStatus).toHaveBeenLastCalledWith(
      SaveStatusEnum.Saved,
    );
  });

  it('循环边不重复移动节点或阻塞遍历', () => {
    const { nodes } = createGraph(
      ['1', '2', '3'],
      [
        ['1', '2'],
        ['2', '3'],
        ['3', '2'],
        ['3', '1'],
      ],
    );
    const setPositions = nodes.map((node) => vi.spyOn(node, 'setPosition'));
    renderAgentFlowCanvas();
    fireEvent.click(screen.getByRole('button', { name: '自动布局' }));
    expect(nodes.map((node) => node.getPosition())).toEqual([
      { x: 80, y: 100 },
      { x: 80, y: 220 },
      { x: 80, y: 340 },
    ]);
    setPositions.forEach((setPosition) =>
      expect(setPosition).toHaveBeenCalledTimes(1),
    );
  });

  it('断连分量保留原 280 横向步长和 100 起始 y 坐标', () => {
    const { nodes } = createGraph(
      ['1', '2', '3', '4', '5'],
      [
        ['1', '2'],
        ['3', '4'],
      ],
    );
    renderAgentFlowCanvas();
    fireEvent.click(screen.getByRole('button', { name: '自动布局' }));
    expect(nodes.map((node) => node.getPosition())).toEqual([
      { x: 80, y: 100 },
      { x: 80, y: 220 },
      { x: 360, y: 100 },
      { x: 360, y: 220 },
      { x: 640, y: 100 },
    ]);
  });

  it('重复布局没有坐标变化时不重新标脏、延后防抖或再次请求保存', async () => {
    const { nodes } = createGraph(['1', '2'], [['1', '2']]);
    const markDirty = vi.spyOn(workflowSaveService, 'markDirty');
    const setPositions = nodes.map((node) => vi.spyOn(node, 'setPosition'));
    // 代理中的最新配置不能被画布中较旧的节点数据覆盖。
    workflowProxy.updateNode({
      ...workflowProxy.getNodeById(2)!,
      description: '尚未提交的最新描述',
    });
    workflowProxy.clearPendingUpdates();
    renderAgentFlowCanvas();
    fireEvent.click(screen.getByRole('button', { name: '自动布局' }));
    expect(workflowProxy.getNodeById(2)?.description).toBe(
      '尚未提交的最新描述',
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    fireEvent.click(screen.getByRole('button', { name: '自动布局' }));
    expect(markDirty).toHaveBeenCalledTimes(1);
    setPositions.forEach((setPosition) =>
      expect(setPosition).toHaveBeenCalledTimes(1),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(state.saveWorkflow).toHaveBeenCalledTimes(1);
    expect(workflowSaveService.hasPendingChanges()).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: '自动布局' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(markDirty).toHaveBeenCalledTimes(1);
    expect(state.saveWorkflow).toHaveBeenCalledTimes(1);
    expect(workflowSaveService.hasPendingChanges()).toBe(false);
    expect(workflowProxy.hasPendingChanges()).toBe(false);
  });

  it('布局尚未保存时离开保护生效，保存成功后不再拦截', async () => {
    createGraph(['1', '2'], [['1', '2']]);
    renderAgentFlowCanvas();
    fireEvent.click(screen.getByRole('button', { name: '自动布局' }));
    const beforeSave = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(beforeSave);
    expect(beforeSave.defaultPrevented).toBe(true);
    expect(state.sendBeacon).toHaveBeenCalledTimes(1);
    expect(state.sendBeacon).toHaveBeenCalledWith(
      '/api/workflow/save',
      expect.any(Blob),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    const afterSave = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(afterSave);
    expect(afterSave.defaultPrevented).toBe(false);
    expect(state.sendBeacon).toHaveBeenCalledTimes(1);
  });

  it('布局保存失败后保留脏状态和离开保护', async () => {
    createGraph(['1', '2'], [['1', '2']]);
    state.saveWorkflow.mockResolvedValueOnce({
      code: '1000',
      message: '保存失败',
    });
    renderAgentFlowCanvas();
    fireEvent.click(screen.getByRole('button', { name: '自动布局' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(state.saveWorkflow).toHaveBeenCalledTimes(1);
    expect(state.model.setSaveStatus).toHaveBeenLastCalledWith(
      SaveStatusEnum.Failed,
    );
    expect(workflowSaveService.hasPendingChanges()).toBe(true);
    expect(workflowProxy.hasPendingChanges()).toBe(true);
    const beforeUnload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(beforeUnload);
    expect(beforeUnload.defaultPrevented).toBe(true);
    expect(state.sendBeacon).toHaveBeenCalledTimes(1);
  });

  it('布局后在防抖前卸载，沿用 SPA 离开保存并取消延迟重复请求', async () => {
    const { nodes } = createGraph(['1', '2'], [['1', '2']]);
    const mounted = renderAgentFlowCanvas();
    // 等待现有 history hook 缓存持久图引用，模拟已初始化的真实画布。
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    fireEvent.click(screen.getByRole('button', { name: '自动布局' }));
    expect(workflowProxy.hasPendingChanges()).toBe(true);
    expect(state.saveWorkflow).not.toHaveBeenCalled();
    await act(async () => {
      mounted.unmount();
    });
    expect(state.saveWorkflow).toHaveBeenCalledTimes(1);
    const payload = state.saveWorkflow.mock.calls[0][0]
      .workflowConfig as IgetDetails;
    expect(
      payload.nodes.map((node) => ({
        x: node.nodeConfig.extension?.x,
        y: node.nodeConfig.extension?.y,
      })),
    ).toEqual(nodes.map((node) => node.getPosition()));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(state.saveWorkflow).toHaveBeenCalledTimes(1);
    expect(workflowSaveService.hasPendingChanges()).toBe(false);
    expect(workflowProxy.hasPendingChanges()).toBe(false);
  });

  it('空图安全返回且不标脏、不请求保存', async () => {
    createGraph([]);
    renderAgentFlowCanvas();
    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: '自动布局' })),
    ).not.toThrow();
    expect(state.getGraphRef).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(state.saveWorkflow).not.toHaveBeenCalled();
    expect(workflowSaveService.hasPendingChanges()).toBe(false);
    expect(workflowProxy.hasPendingChanges()).toBe(false);
  });

  it('未挂载和 getter 尚未返回图时均安全返回', () => {
    state.mounted = false;
    const mounted = renderAgentFlowCanvas();
    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: '自动布局' })),
    ).not.toThrow();
    expect(state.getGraphRef).not.toHaveBeenCalled();
    mounted.unmount();
    state.mounted = true;
    renderAgentFlowCanvas();
    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: '自动布局' })),
    ).not.toThrow();
    expect(state.getGraphRef).toHaveBeenCalledTimes(1);
  });

  it('没有 Start 的图保持原位置且不标脏、不请求保存', async () => {
    const { nodes } = createGraph(['1', '2'], [['1', '2']], 'absent-start');
    renderAgentFlowCanvas();
    fireEvent.click(screen.getByRole('button', { name: '自动布局' }));
    expect(nodes.map((node) => node.getPosition())).toEqual([
      { x: 999, y: 777 },
      { x: 999, y: 777 },
    ]);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(state.saveWorkflow).not.toHaveBeenCalled();
    expect(workflowSaveService.hasPendingChanges()).toBe(false);
    expect(workflowProxy.hasPendingChanges()).toBe(false);
  });

  it('Agent 编辑页内嵌与全屏均可点击，保持单个外部 Header', () => {
    const { nodes } = createGraph(['1', '2'], [['1', '2']]);
    const { container } = render(
      <>
        <AgentHeader
          onToggleShowStand={vi.fn()}
          onToggleVersionHistory={vi.fn()}
          onEditAgent={vi.fn()}
          onPublish={vi.fn()}
          onOtherAction={vi.fn()}
        />
        <AgentFlowCanvas workflowId={1} spaceId={2} />
      </>,
    );
    expect(container.querySelectorAll('header')).toHaveLength(1);
    expect(container.querySelector('.fold-header-style')).toBeNull();
    expect(container.querySelector('.absolute-box-compact')).not.toBeNull();
    expect(screen.getAllByRole('button', { name: '自动布局' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: '自动布局' }));
    expect(nodes.map((node) => node.getPosition())).toEqual([
      { x: 80, y: 100 },
      { x: 80, y: 220 },
    ]);

    fireEvent.click(
      screen
        .getByRole('img', { name: 'icons-common-zoom_in' })
        .closest('button')!,
    );
    expect(container.querySelector('.absolute-box-compact')).toBeNull();
    expect(screen.getAllByRole('button', { name: '自动布局' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: '自动布局' }));
    expect(state.getGraphRef).toHaveBeenCalledTimes(2);
    expect(container.querySelectorAll('header')).toHaveLength(1);
    expect(container.querySelector('.fold-header-style')).toBeNull();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(container.querySelector('.absolute-box-compact')).not.toBeNull();
    expect(screen.getAllByRole('button', { name: '自动布局' })).toHaveLength(1);
  });

  it('普通 Workflow 保留实际 Header 且不展示 AgentFlow 自动布局', () => {
    createGraph(['1', '2'], [['1', '2']]);
    const { container } = render(
      <Workflow workflowIdOverride={1} spaceIdOverride={2} />,
    );
    expect(container.querySelectorAll('.fold-header-style')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: '自动布局' })).toBeNull();
    expect(state.getGraphRef).not.toHaveBeenCalled();
  });
});
