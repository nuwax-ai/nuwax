/**
 * WorkflowProxyV3 单元测试
 *
 * 测试核心数据代理功能：
 * - 初始化/重置
 * - 节点增删改查
 * - 边增删
 * - 数据一致性验证
 */
import { NodeTypeEnum } from '@/types/enums/common';
import { ChildNode } from '@/types/interfaces/graph';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EdgeV3, WorkflowDataV3 } from '../../types/interfaces';
import WorkflowProxyV3 from '../workflowProxyV3';

// ========== 测试数据 ==========

const createMockNode = (overrides: Partial<ChildNode>): ChildNode => ({
  id: 1,
  type: NodeTypeEnum.Start,
  name: '测试节点',
  description: '',
  workflowId: 12345,
  shape: 'custom-react',
  icon: '',
  nextNodeIds: [],
  nodeConfig: {
    extension: { x: 100, y: 200, width: 200, height: 100 },
  },
  ...overrides,
});

const createMockWorkflowData = (): WorkflowDataV3 => ({
  workflowId: 12345,
  nodes: [
    createMockNode({
      id: 1,
      type: NodeTypeEnum.Start,
      name: '开始',
      nextNodeIds: [2],
      nodeConfig: {
        extension: { x: 100, y: 200, width: 200, height: 100 },
        inputArgs: [],
      },
    }),
    createMockNode({
      id: 2,
      type: NodeTypeEnum.LLM,
      name: '大模型',
      nextNodeIds: [3],
      nodeConfig: {
        extension: { x: 300, y: 200, width: 200, height: 150 },
        modelId: 'gpt-4',
        skillComponentConfigs: [],
      },
    }),
    createMockNode({
      id: 3,
      type: NodeTypeEnum.End,
      name: '结束',
      nextNodeIds: [],
      nodeConfig: {
        extension: { x: 500, y: 200, width: 200, height: 100 },
        outputArgs: [],
      },
    }),
  ],
  edges: [
    { source: '1', target: '2' },
    { source: '2', target: '3' },
  ],
  modified: '2025-12-17T00:00:00Z',
});

const createMockConditionWorkflowData = (): WorkflowDataV3 => ({
  workflowId: 12346,
  nodes: [
    createMockNode({
      id: 1,
      type: NodeTypeEnum.Start,
      name: '开始',
      nextNodeIds: [2],
    }),
    createMockNode({
      id: 2,
      type: NodeTypeEnum.Condition,
      name: '条件分支',
      nextNodeIds: [],
      nodeConfig: {
        extension: { x: 300, y: 200 },
        conditionBranchConfigs: [
          { uuid: 'branch-1', conditionArgs: [], nextNodeIds: [3] },
          { uuid: 'branch-2', conditionArgs: [], nextNodeIds: [4] },
        ],
      },
    }),
    createMockNode({
      id: 3,
      type: NodeTypeEnum.LLM,
      name: '分支1',
      nextNodeIds: [5],
    }),
    createMockNode({
      id: 4,
      type: NodeTypeEnum.LLM,
      name: '分支2',
      nextNodeIds: [5],
    }),
    createMockNode({
      id: 5,
      type: NodeTypeEnum.End,
      name: '结束',
      nextNodeIds: [],
    }),
  ],
  edges: [
    { source: '1', target: '2' },
    { source: '2', target: '3', sourcePort: '2-branch-1-out' },
    { source: '2', target: '4', sourcePort: '2-branch-2-out' },
    { source: '3', target: '5' },
    { source: '4', target: '5' },
  ],
  modified: '2025-12-17T00:00:00Z',
});

// ========== 测试用例 ==========

describe('WorkflowProxyV3', () => {
  let proxy: WorkflowProxyV3;

  beforeEach(() => {
    proxy = new WorkflowProxyV3();
    // Suppress console.log in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初始化与重置', () => {
    it('should initialize with workflow data', () => {
      const mockData = createMockWorkflowData();
      proxy.initialize(mockData);

      expect(proxy.getNodes()).toHaveLength(3);
      expect(proxy.getEdges()).toHaveLength(2);
      expect(proxy.hasPendingChanges()).toBe(false);
    });

    it('should reset proxy state', () => {
      const mockData = createMockWorkflowData();
      proxy.initialize(mockData);

      proxy.reset();

      expect(proxy.getNodes()).toHaveLength(0);
      expect(proxy.getEdges()).toHaveLength(0);
      expect(proxy.getFullWorkflowData()).toBeNull();
    });

    it('should return null when not initialized', () => {
      expect(proxy.getFullWorkflowData()).toBeNull();
      expect(proxy.getNodes()).toHaveLength(0);
      expect(proxy.getNodeById(1)).toBeNull();
    });
  });

  describe('节点查询', () => {
    beforeEach(() => {
      proxy.initialize(createMockWorkflowData());
    });

    it('should get node by id', () => {
      const node = proxy.getNodeById(2);
      expect(node).not.toBeNull();
      expect(node?.name).toBe('大模型');
      expect(node?.type).toBe(NodeTypeEnum.LLM);
    });

    it('should return null for non-existent node', () => {
      const node = proxy.getNodeById(999);
      expect(node).toBeNull();
    });

    it('should return deep cloned nodes', () => {
      const nodes = proxy.getNodes();
      nodes[0].name = 'Modified';

      const nodesAgain = proxy.getNodes();
      expect(nodesAgain[0].name).toBe('开始'); // Original unchanged
    });
  });

  describe('节点添加', () => {
    beforeEach(() => {
      proxy.initialize(createMockWorkflowData());
    });

    it('should add a new node', () => {
      const newNode = createMockNode({
        id: 100,
        type: NodeTypeEnum.Code,
        name: '代码节点',
        nextNodeIds: [],
        nodeConfig: { extension: { x: 400, y: 300 } },
      });

      const result = proxy.addNode(newNode);

      expect(result.success).toBe(true);
      expect(proxy.getNodes()).toHaveLength(4);
      expect(proxy.getNodeById(100)?.name).toBe('代码节点');
      expect(proxy.hasPendingChanges()).toBe(true);
    });

    it('should fail when adding duplicate node', () => {
      const duplicateNode = createMockNode({
        id: 1, // Already exists
        type: NodeTypeEnum.Code,
        name: '重复节点',
      });

      const result = proxy.addNode(duplicateNode);

      expect(result.success).toBe(false);
      expect(result.message).toContain('已存在');
      expect(proxy.getNodes()).toHaveLength(3);
    });

    it('should fail when not initialized', () => {
      const freshProxy = new WorkflowProxyV3();
      const result = freshProxy.addNode(
        createMockNode({
          id: 1,
          type: NodeTypeEnum.Code,
          name: 'Test',
        }),
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('未初始化');
    });
  });

  describe('节点更新', () => {
    beforeEach(() => {
      proxy.initialize(createMockWorkflowData());
    });

    it('should update existing node', () => {
      const updatedNode = createMockNode({
        id: 2,
        type: NodeTypeEnum.LLM,
        name: '更新后的大模型',
        nextNodeIds: [3],
        nodeConfig: {
          extension: { x: 350, y: 250 },
          modelId: 'gpt-4-turbo',
        },
      });

      const result = proxy.updateNode(updatedNode);

      expect(result.success).toBe(true);
      const node = proxy.getNodeById(2);
      expect(node?.name).toBe('更新后的大模型');
      expect(node?.nodeConfig?.modelId).toBe('gpt-4-turbo');
    });

    it('should add node if not exists (via update)', () => {
      const newNode = createMockNode({
        id: 999,
        type: NodeTypeEnum.Variable,
        name: '变量节点',
      });

      const result = proxy.updateNode(newNode);

      expect(result.success).toBe(true);
      expect(proxy.getNodes()).toHaveLength(4);
      expect(proxy.getNodeById(999)?.name).toBe('变量节点');
    });
  });

  describe('节点删除', () => {
    beforeEach(() => {
      proxy.initialize(createMockWorkflowData());
    });

    it('should delete node and related edges', () => {
      const result = proxy.deleteNode(2);

      expect(result.success).toBe(true);
      expect(proxy.getNodes()).toHaveLength(2);
      expect(proxy.getNodeById(2)).toBeNull();
      // Edges connected to node 2 should be removed
      const edges = proxy.getEdges();
      expect(edges.some((e) => e.source === '2' || e.target === '2')).toBe(
        false,
      );
    });

    it('should clean up nextNodeIds references', () => {
      proxy.deleteNode(2);

      const startNode = proxy.getNodeById(1);
      expect(startNode?.nextNodeIds).not.toContain(2);
    });

    it('should fail for non-existent node', () => {
      const result = proxy.deleteNode(999);

      expect(result.success).toBe(false);
      expect(result.message).toContain('不存在');
    });
  });

  describe('节点复制', () => {
    beforeEach(() => {
      proxy.initialize(createMockWorkflowData());
    });

    it('should copy node with new id and offset position', () => {
      const result = proxy.copyNode(2);

      expect(result.success).toBe(true);
      expect(result.newNode).toBeDefined();
      expect(result.newNode?.id).not.toBe(2);
      expect(result.newNode?.name).toContain('copy');
      expect(proxy.getNodes()).toHaveLength(4);
    });

    it('should fail for non-existent node', () => {
      const result = proxy.copyNode(999);

      expect(result.success).toBe(false);
      expect(result.newNode).toBeUndefined();
    });
  });

  describe('节点位置更新', () => {
    beforeEach(() => {
      proxy.initialize(createMockWorkflowData());
    });

    it('should update node position', () => {
      const result = proxy.updateNodePosition(2, 400, 300);

      expect(result.success).toBe(true);
      const node = proxy.getNodeById(2);
      expect(node?.nodeConfig?.extension?.x).toBe(400);
      expect(node?.nodeConfig?.extension?.y).toBe(300);
    });

    it('should update node size if provided', () => {
      const result = proxy.updateNodePosition(2, 400, 300, 250, 180);

      expect(result.success).toBe(true);
      const node = proxy.getNodeById(2);
      expect(node?.nodeConfig?.extension?.width).toBe(250);
      expect(node?.nodeConfig?.extension?.height).toBe(180);
    });
  });

  describe('边操作', () => {
    beforeEach(() => {
      proxy.initialize(createMockWorkflowData());
    });

    it('should add edge and update nextNodeIds', () => {
      // Add new node first
      proxy.addNode(
        createMockNode({
          id: 100,
          type: NodeTypeEnum.Code,
          name: '代码节点',
          nodeConfig: { extension: { x: 400, y: 400 } },
        }),
      );

      const edge: EdgeV3 = { source: '2', target: '100' };
      const result = proxy.addEdge(edge);

      expect(result.success).toBe(true);
      expect(proxy.getEdges()).toHaveLength(3);

      const sourceNode = proxy.getNodeById(2);
      expect(sourceNode?.nextNodeIds).toContain(100);
    });

    it('should fail for duplicate edge', () => {
      const edge: EdgeV3 = { source: '1', target: '2' }; // Already exists
      const result = proxy.addEdge(edge);

      expect(result.success).toBe(false);
      expect(result.message).toContain('已存在');
    });
  });

  describe('条件分支节点', () => {
    beforeEach(() => {
      proxy.initialize(createMockConditionWorkflowData());
    });

    it('should handle condition branch edges', () => {
      const conditionNode = proxy.getNodeById(2);
      expect(conditionNode?.type).toBe(NodeTypeEnum.Condition);

      const branches = conditionNode?.nodeConfig?.conditionBranchConfigs;
      expect(branches).toHaveLength(2);
      expect(branches?.[0].nextNodeIds).toContain(3);
      expect(branches?.[1].nextNodeIds).toContain(4);
    });

    it('should clean up branch nextNodeIds when deleting target node', () => {
      proxy.deleteNode(3);

      const conditionNode = proxy.getNodeById(2);
      const branches = conditionNode?.nodeConfig?.conditionBranchConfigs;
      expect(branches?.[0].nextNodeIds).not.toContain(3);
    });
  });

  describe('数据一致性', () => {
    beforeEach(() => {
      proxy.initialize(createMockWorkflowData());
    });

    it('should return cloned data to prevent external mutation', () => {
      const data = proxy.getFullWorkflowData();
      data!.nodes.push(
        createMockNode({
          id: 999,
          type: NodeTypeEnum.Code,
          name: '外部添加',
        }),
      );

      expect(proxy.getNodes()).toHaveLength(3); // Original unchanged
    });

    it('should track pending changes correctly', () => {
      expect(proxy.hasPendingChanges()).toBe(false);

      proxy.updateNodePosition(1, 150, 250);
      expect(proxy.hasPendingChanges()).toBe(true);
    });
  });
});
