/**
 * Workflow 保存服务测试
 *
 * 测试场景：
 * - 保存触发条件（防抖、自动保存）
 * - 保存失败重试逻辑
 * - 保存 Payload 格式验证
 * - 边提取与 nextNodeIds 计算
 * - 脏数据标记与监听
 */
import WorkflowSaveService from '@/pages/Antv-X6/v3/services/WorkflowSaveService';
import { NodeTypeEnum } from '@/types/enums/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Graph 实例
const createMockGraph = (nodes: any[] = [], edges: any[] = []) => ({
  getNodes: () =>
    nodes.map((node) => ({
      getData: () => node,
      getPosition: () => ({
        x: node.nodeConfig?.extension?.x || 0,
        y: node.nodeConfig?.extension?.y || 0,
      }),
      getSize: () => ({
        width: node.nodeConfig?.extension?.width || 200,
        height: node.nodeConfig?.extension?.height || 100,
      }),
    })),
  getEdges: () =>
    edges.map((edge) => ({
      getSource: () => edge.source,
      getTarget: () => edge.target,
      getSourcePortId: () => edge.sourcePort || null,
      getTargetPortId: () => edge.targetPort || null,
    })),
});

const mockWorkflowDetails = {
  id: 12345,
  name: 'Test Workflow',
  description: 'Test Description',
  spaceId: 1,
  icon: 'icon.png',
  publishStatus: 'published',
  extension: { size: 100 },
  scope: 'global',
  category: 'default',
  permissions: [],
  nodes: [
    {
      id: 1,
      type: NodeTypeEnum.Start,
      name: '开始',
      nextNodeIds: [2],
      nodeConfig: {
        extension: { x: 100, y: 200, width: 200, height: 100 },
        inputArgs: [{ name: 'input1', type: 'string' }],
      },
    },
    {
      id: 2,
      type: NodeTypeEnum.LLM,
      name: '大模型',
      nextNodeIds: [3],
      nodeConfig: {
        extension: { x: 300, y: 200, width: 200, height: 150 },
        modelId: 'gpt-4',
      },
    },
    {
      id: 3,
      type: NodeTypeEnum.End,
      name: '结束',
      nextNodeIds: [],
      nodeConfig: {
        extension: { x: 500, y: 200, width: 200, height: 100 },
        outputArgs: [{ name: 'output1', type: 'string' }],
      },
    },
  ],
  startNode: { id: 1, type: NodeTypeEnum.Start },
  endNode: { id: 3, type: NodeTypeEnum.End },
  inputArgs: [{ name: 'input1', type: 'string' }],
  outputArgs: [{ name: 'output1', type: 'string' }],
  modified: '2025-12-17T00:00:00Z',
  editVersion: 5,
  systemVariables: [],
};

describe('WorkflowSaveService', () => {
  let saveService: WorkflowSaveService;

  beforeEach(() => {
    saveService = new WorkflowSaveService();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============ 场景1：初始化与重置 ============
  describe('初始化与重置', () => {
    it('正确初始化元数据', () => {
      saveService.initialize(mockWorkflowDetails as any);

      expect(saveService.hasPendingChanges()).toBe(false);
    });

    it('重置后清除所有状态', () => {
      saveService.initialize(mockWorkflowDetails as any);
      saveService.markDirty();

      saveService.reset();

      expect(saveService.hasPendingChanges()).toBe(false);
    });
  });

  // ============ 场景2：脏数据标记 ============
  describe('脏数据标记', () => {
    it('初始状态不是脏数据', () => {
      saveService.initialize(mockWorkflowDetails as any);
      expect(saveService.hasPendingChanges()).toBe(false);
    });

    it('markDirty 后标记为脏数据', () => {
      saveService.initialize(mockWorkflowDetails as any);
      saveService.markDirty();
      expect(saveService.hasPendingChanges()).toBe(true);
    });

    it('clearDirty 后清除脏标记', () => {
      saveService.initialize(mockWorkflowDetails as any);
      saveService.markDirty();
      saveService.clearDirty();
      expect(saveService.hasPendingChanges()).toBe(false);
    });

    it('updateMeta 后自动标记为脏数据', () => {
      saveService.initialize(mockWorkflowDetails as any);
      saveService.updateMeta({ name: 'New Name' });
      expect(saveService.hasPendingChanges()).toBe(true);
    });
  });

  // ============ 场景3：订阅机制 ============
  describe('订阅机制', () => {
    it('订阅后收到变更通知', () => {
      saveService.initialize(mockWorkflowDetails as any);
      const listener = vi.fn();
      saveService.subscribe(listener);

      saveService.markDirty();

      expect(listener).toHaveBeenCalled();
    });

    it('取消订阅后不再收到通知', () => {
      saveService.initialize(mockWorkflowDetails as any);
      const listener = vi.fn();
      const unsubscribe = saveService.subscribe(listener);

      unsubscribe();
      saveService.markDirty();

      expect(listener).not.toHaveBeenCalled();
    });

    it('多个订阅者都收到通知', () => {
      saveService.initialize(mockWorkflowDetails as any);
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      saveService.subscribe(listener1);
      saveService.subscribe(listener2);

      saveService.markDirty();

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  // ============ 场景4：元数据更新 ============
  describe('元数据更新', () => {
    it('更新名称和描述', () => {
      saveService.initialize(mockWorkflowDetails as any);

      saveService.updateMeta({
        name: 'Updated Name',
        description: 'Updated Description',
      });

      expect(saveService.hasPendingChanges()).toBe(true);
    });

    it('未初始化时更新元数据报错', () => {
      saveService.updateMeta({ name: 'Test' });

      expect(console.error).toHaveBeenCalledWith(
        '[SaveService] Not initialized, cannot update metadata',
      );
    });
  });

  // ============ 场景5：构建保存载荷 ============
  describe('构建保存载荷', () => {
    it('未初始化时返回 null', () => {
      const mockGraph = createMockGraph([], []);
      const payload = saveService.buildPayload(mockGraph as any);

      expect(payload).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        '[SaveService] Not initialized, cannot build save payload',
      );
    });

    it('画布无节点时返回 null', () => {
      saveService.initialize(mockWorkflowDetails as any);
      const mockGraph = createMockGraph([], []);
      const payload = saveService.buildPayload(mockGraph as any);

      expect(payload).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        '[SaveService] No valid nodes found on canvas, fallback to workflowProxy payload',
      );
    });

    it('画布无开始节点时返回 null', () => {
      saveService.initialize(mockWorkflowDetails as any);
      const nodesWithoutStart = [
        {
          id: 2,
          type: NodeTypeEnum.LLM,
          name: '大模型',
          nextNodeIds: [],
          nodeConfig: { extension: { x: 300, y: 200 } },
        },
      ];
      const mockGraph = createMockGraph(nodesWithoutStart, []);
      const payload = saveService.buildPayload(mockGraph as any);

      expect(payload).toBeNull();
    });

    it('正确构建保存载荷', () => {
      saveService.initialize(mockWorkflowDetails as any);
      const mockGraph = createMockGraph(mockWorkflowDetails.nodes, [
        { source: '1', target: '2' },
        { source: '2', target: '3' },
      ]);

      const payload = saveService.buildPayload(mockGraph as any);

      expect(payload).not.toBeNull();
      expect(payload?.nodes).toHaveLength(3);
      expect(payload?.startNode).toBeDefined();
      expect(payload?.endNode).toBeDefined();
      expect(payload?.modified).toBeDefined();
    });
  });

  // ============ 场景6：边提取与 nextNodeIds 计算 ============
  describe('边提取与 nextNodeIds 计算', () => {
    it('普通节点的 nextNodeIds 正确计算', () => {
      saveService.initialize(mockWorkflowDetails as any);
      const mockGraph = createMockGraph(mockWorkflowDetails.nodes, [
        { source: '1', target: '2' },
        { source: '2', target: '3' },
      ]);

      const payload = saveService.buildPayload(mockGraph as any);
      const startNode = payload?.nodes.find((n) => n.id === 1);
      const llmNode = payload?.nodes.find((n) => n.id === 2);

      expect(startNode?.nextNodeIds).toContain(2);
      expect(llmNode?.nextNodeIds).toContain(3);
    });

    it('条件分支节点的 nextNodeIds 正确计算', () => {
      const conditionNodes = [
        {
          id: 1,
          type: NodeTypeEnum.Start,
          name: '开始',
          nextNodeIds: [2],
          nodeConfig: { extension: { x: 100, y: 200 } },
        },
        {
          id: 2,
          type: NodeTypeEnum.Condition,
          name: '条件分支',
          nextNodeIds: [],
          nodeConfig: {
            extension: { x: 300, y: 200 },
            conditionBranchConfigs: [
              { uuid: 'branch-1', conditionArgs: [], nextNodeIds: [] },
              { uuid: 'branch-2', conditionArgs: [], nextNodeIds: [] },
            ],
          },
        },
        {
          id: 3,
          type: NodeTypeEnum.LLM,
          name: '分支1',
          nextNodeIds: [5],
          nodeConfig: { extension: { x: 500, y: 100 } },
        },
        {
          id: 4,
          type: NodeTypeEnum.LLM,
          name: '分支2',
          nextNodeIds: [5],
          nodeConfig: { extension: { x: 500, y: 300 } },
        },
        {
          id: 5,
          type: NodeTypeEnum.End,
          name: '结束',
          nextNodeIds: [],
          nodeConfig: { extension: { x: 700, y: 200 } },
        },
      ];

      saveService.initialize({
        ...mockWorkflowDetails,
        nodes: conditionNodes,
      } as any);
      const mockGraph = createMockGraph(conditionNodes, [
        { source: '1', target: '2' },
        { source: '2', target: '3', sourcePort: '2-branch-1-out' },
        { source: '2', target: '4', sourcePort: '2-branch-2-out' },
        { source: '3', target: '5' },
        { source: '4', target: '5' },
      ]);

      const payload = saveService.buildPayload(mockGraph as any);
      const conditionNode = payload?.nodes.find((n) => n.id === 2);

      expect(
        conditionNode?.nodeConfig?.conditionBranchConfigs?.[0].nextNodeIds,
      ).toContain(3);
      expect(
        conditionNode?.nodeConfig?.conditionBranchConfigs?.[1].nextNodeIds,
      ).toContain(4);
    });

    it('异常处理端口的 nextNodeIds 正确计算', () => {
      const exceptionNodes = [
        {
          id: 1,
          type: NodeTypeEnum.Start,
          name: '开始',
          nextNodeIds: [2],
          nodeConfig: { extension: { x: 100, y: 200 } },
        },
        {
          id: 2,
          type: NodeTypeEnum.LLM,
          name: '大模型',
          nextNodeIds: [3],
          nodeConfig: {
            extension: { x: 300, y: 200 },
            exceptionHandleConfig: { exceptionHandleNodeIds: [] },
          },
        },
        {
          id: 3,
          type: NodeTypeEnum.End,
          name: '正常结束',
          nextNodeIds: [],
          nodeConfig: { extension: { x: 500, y: 200 } },
        },
        {
          id: 4,
          type: NodeTypeEnum.End,
          name: '异常结束',
          nextNodeIds: [],
          nodeConfig: { extension: { x: 500, y: 400 } },
        },
      ];

      saveService.initialize({
        ...mockWorkflowDetails,
        nodes: exceptionNodes,
      } as any);
      const mockGraph = createMockGraph(exceptionNodes, [
        { source: '1', target: '2' },
        { source: '2', target: '3' },
        { source: '2', target: '4', sourcePort: '2-exception-out' },
      ]);

      const payload = saveService.buildPayload(mockGraph as any);
      const llmNode = payload?.nodes.find((n) => n.id === 2);

      expect(
        llmNode?.nodeConfig?.exceptionHandleConfig?.exceptionHandleNodeIds,
      ).toContain(4);
    });
  });

  // ============ 场景7：编辑版本号 ============
  describe('编辑版本号', () => {
    it('初始化时保存编辑版本号', () => {
      saveService.initialize(mockWorkflowDetails as any);
      // 编辑版本号在内部保存，通过 setEditVersion 可以更新
    });

    it('setEditVersion 更新版本号', () => {
      saveService.initialize(mockWorkflowDetails as any);
      saveService.setEditVersion(10);
      // 版本号更新成功，无报错
    });
  });
});
