/**
 * Workflow 节点操作集成测试
 *
 * 测试场景：
 * - 节点添加与删除
 * - 节点复制粘贴
 * - 节点位置更新
 * - 节点配置更新
 * - 边的添加与删除
 */
import WorkflowProxyV3 from '@/pages/Antv-X6/v3/services/workflowProxyV3';
import type { WorkflowDataV3 } from '@/pages/Antv-X6/v3/types/interfaces';
import { NodeShapeEnum, NodeTypeEnum } from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 测试数据工厂
const createMockNode = (overrides: Partial<ChildNode> = {}): ChildNode => ({
  id: 1,
  type: NodeTypeEnum.Start,
  name: 'Test Node',
  description: '',
  workflowId: 12345,
  shape: NodeShapeEnum.General,
  icon: '',
  nextNodeIds: [],
  nodeConfig: {
    extension: { x: 100, y: 200, width: 200, height: 100 },
  },
  ...overrides,
});

const createLinearWorkflow = (): WorkflowDataV3 => ({
  workflowId: 12345,
  nodes: [
    createMockNode({
      id: 1,
      type: NodeTypeEnum.Start,
      name: '开始',
      nextNodeIds: [2],
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
    }),
  ],
  edges: [
    { source: '1', target: '2' },
    { source: '2', target: '3' },
  ],
  modified: '2025-12-17T00:00:00Z',
});

const createBranchWorkflow = (): WorkflowDataV3 => ({
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

describe('Workflow 节点操作集成', () => {
  let proxy: WorkflowProxyV3;

  beforeEach(() => {
    proxy = new WorkflowProxyV3();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============ 场景1：节点添加 ============
  describe('节点添加', () => {
    it('在两个节点之间添加新节点', () => {
      proxy.initialize(createLinearWorkflow());

      // 在节点1和节点2之间添加代码节点
      const codeNode = createMockNode({
        id: 100,
        type: NodeTypeEnum.Code,
        name: '代码节点',
        nextNodeIds: [2],
        nodeConfig: { extension: { x: 200, y: 200 } },
      });

      const addResult = proxy.addNode(codeNode);
      expect(addResult.success).toBe(true);

      // 添加边：1 -> 100
      const edgeResult = proxy.addEdge({ source: '1', target: '100' });
      expect(edgeResult.success).toBe(true);

      // 更新节点1的 nextNodeIds：移除2，添加100
      const node1 = proxy.getNodeById(1)!;
      node1.nextNodeIds = [100];
      proxy.updateNode(node1);

      // 验证节点列表
      expect(proxy.getNodes()).toHaveLength(4);
      expect(proxy.getNodeById(100)?.name).toBe('代码节点');

      // 验证连接关系
      expect(proxy.getEdges()).toHaveLength(3);
    });

    it('添加重复 ID 节点失败', () => {
      proxy.initialize(createLinearWorkflow());

      const duplicateNode = createMockNode({
        id: 1, // 已存在
        type: NodeTypeEnum.Code,
        name: '重复节点',
      });

      const result = proxy.addNode(duplicateNode);
      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists');
    });

    it('未初始化时添加节点失败', () => {
      const node = createMockNode({ id: 1, name: '测试' });
      const result = proxy.addNode(node);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not initialized');
    });
  });

  // ============ 场景2：节点删除 ============
  describe('节点删除', () => {
    it('删除中间节点并清理连线', () => {
      proxy.initialize(createLinearWorkflow());

      // 删除节点2（LLM）
      const result = proxy.deleteNode(2);
      expect(result.success).toBe(true);

      // 验证节点已删除
      expect(proxy.getNodes()).toHaveLength(2);
      expect(proxy.getNodeById(2)).toBeNull();

      // 验证相关边已清理
      const edges = proxy.getEdges();
      expect(edges.some((e) => e.source === '2' || e.target === '2')).toBe(
        false,
      );

      // 验证节点1的 nextNodeIds 已清理
      const node1 = proxy.getNodeById(1)!;
      expect(node1.nextNodeIds).not.toContain(2);
    });

    it('删除条件分支节点清理所有分支边', () => {
      proxy.initialize(createBranchWorkflow());

      // 删除条件分支节点
      const result = proxy.deleteNode(2);
      expect(result.success).toBe(true);

      // 验证所有相关边已清理
      const edges = proxy.getEdges();
      expect(edges.some((e) => e.source === '2' || e.target === '2')).toBe(
        false,
      );
    });

    it('删除不存在的节点失败', () => {
      proxy.initialize(createLinearWorkflow());

      const result = proxy.deleteNode(999);
      expect(result.success).toBe(false);
      expect(result.message).toContain('does not exist');
    });

    it('删除节点后清理分支节点的 nextNodeIds', () => {
      proxy.initialize(createBranchWorkflow());

      // 删除分支1的目标节点
      proxy.deleteNode(3);

      // 验证条件分支的 nextNodeIds 已清理
      const conditionNode = proxy.getNodeById(2)!;
      const branch1 = conditionNode.nodeConfig?.conditionBranchConfigs?.[0];
      expect(branch1?.nextNodeIds).not.toContain(3);
    });
  });

  // ============ 场景3：节点复制 ============
  describe('节点复制', () => {
    it('复制节点并生成新 ID', () => {
      proxy.initialize(createLinearWorkflow());

      const result = proxy.copyNode(2); // 复制 LLM 节点
      expect(result.success).toBe(true);
      expect(result.newNode).toBeDefined();
      expect(result.newNode?.id).not.toBe(2);
      expect(result.newNode?.name).toContain('copy');
      expect(proxy.getNodes()).toHaveLength(4);
    });

    it('复制节点时位置偏移', () => {
      proxy.initialize(createLinearWorkflow());

      const originalNode = proxy.getNodeById(2)!;
      const originalX = originalNode.nodeConfig?.extension?.x;
      const originalY = originalNode.nodeConfig?.extension?.y;

      // 传入 offset 参数
      const result = proxy.copyNode(2, { x: 50, y: 50 });
      const newNode = result.newNode!;

      // 位置应该有偏移
      expect(newNode.nodeConfig?.extension?.x).toBe(originalX! + 50);
      expect(newNode.nodeConfig?.extension?.y).toBe(originalY! + 50);
    });

    it('复制不存在的节点失败', () => {
      proxy.initialize(createLinearWorkflow());

      const result = proxy.copyNode(999);
      expect(result.success).toBe(false);
      expect(result.newNode).toBeUndefined();
    });
  });

  // ============ 场景4：节点位置更新 ============
  describe('节点位置更新', () => {
    it('更新节点位置', () => {
      proxy.initialize(createLinearWorkflow());

      const result = proxy.updateNodePosition(2, 400, 300);
      expect(result.success).toBe(true);

      const node = proxy.getNodeById(2)!;
      expect(node.nodeConfig?.extension?.x).toBe(400);
      expect(node.nodeConfig?.extension?.y).toBe(300);
    });

    it('更新节点位置和大小', () => {
      proxy.initialize(createLinearWorkflow());

      const result = proxy.updateNodePosition(2, 400, 300, 250, 180);
      expect(result.success).toBe(true);

      const node = proxy.getNodeById(2)!;
      expect(node.nodeConfig?.extension?.x).toBe(400);
      expect(node.nodeConfig?.extension?.y).toBe(300);
      expect(node.nodeConfig?.extension?.width).toBe(250);
      expect(node.nodeConfig?.extension?.height).toBe(180);
    });

    it('更新位置后标记为脏数据', () => {
      proxy.initialize(createLinearWorkflow());
      expect(proxy.hasPendingChanges()).toBe(false);

      proxy.updateNodePosition(2, 400, 300);
      expect(proxy.hasPendingChanges()).toBe(true);
    });
  });

  // ============ 场景5：节点配置更新 ============
  describe('节点配置更新', () => {
    it('更新 LLM 节点配置', () => {
      proxy.initialize(createLinearWorkflow());

      const updatedNode = createMockNode({
        id: 2,
        type: NodeTypeEnum.LLM,
        name: '更新的大模型',
        nextNodeIds: [3],
        nodeConfig: {
          extension: { x: 300, y: 200, width: 200, height: 150 },
          modelId: 'gpt-4-turbo',
          skillComponentConfigs: [{ typeId: 1, name: '插件1' }] as any,
        },
      });

      const result = proxy.updateNode(updatedNode);
      expect(result.success).toBe(true);

      const node = proxy.getNodeById(2)!;
      expect(node.name).toBe('更新的大模型');
      expect(node.nodeConfig?.modelId).toBe('gpt-4-turbo');
      expect(node.nodeConfig?.skillComponentConfigs).toHaveLength(1);
    });

    it('更新不存在的节点会自动添加', () => {
      proxy.initialize(createLinearWorkflow());

      const newNode = createMockNode({
        id: 999,
        type: NodeTypeEnum.Code,
        name: '新代码节点',
      });

      const result = proxy.updateNode(newNode);
      expect(result.success).toBe(true);
      expect(proxy.getNodes()).toHaveLength(4);
      expect(proxy.getNodeById(999)?.name).toBe('新代码节点');
    });
  });

  // ============ 场景6：边操作 ============
  describe('边操作', () => {
    it('添加新边并更新 nextNodeIds', () => {
      proxy.initialize(createLinearWorkflow());

      // 添加新节点
      proxy.addNode(
        createMockNode({
          id: 100,
          type: NodeTypeEnum.Code,
          name: '代码节点',
          nodeConfig: { extension: { x: 400, y: 400 } },
        }),
      );

      // 添加边：2 -> 100
      const result = proxy.addEdge({ source: '2', target: '100' });
      expect(result.success).toBe(true);

      // 验证 nextNodeIds 更新
      const node2 = proxy.getNodeById(2)!;
      expect(node2.nextNodeIds).toContain(100);
    });

    it('添加重复边失败', () => {
      proxy.initialize(createLinearWorkflow());

      const result = proxy.addEdge({ source: '1', target: '2' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists');
    });

    it('删除边并清理 nextNodeIds', () => {
      proxy.initialize(createLinearWorkflow());

      // 删除边：1 -> 2
      const result = proxy.deleteEdge('1', '2');
      expect(result.success).toBe(true);

      // 验证 nextNodeIds 已清理
      const node1 = proxy.getNodeById(1)!;
      expect(node1.nextNodeIds).not.toContain(2);
    });
  });

  // ============ 场景7：数据一致性 ============
  describe('数据一致性', () => {
    it('返回深拷贝防止外部修改', () => {
      proxy.initialize(createLinearWorkflow());

      const nodes = proxy.getNodes();
      nodes[0].name = '外部修改';

      const nodesAgain = proxy.getNodes();
      expect(nodesAgain[0].name).toBe('开始'); // 原始数据未变
    });

    it('批量操作后数据一致', () => {
      proxy.initialize(createLinearWorkflow());

      // 添加节点
      proxy.addNode(
        createMockNode({
          id: 100,
          type: NodeTypeEnum.Code,
          name: '代码节点',
        }),
      );

      // 添加边
      proxy.addEdge({ source: '2', target: '100' });

      // 更新位置
      proxy.updateNodePosition(100, 500, 500);

      // 验证最终状态
      const nodes = proxy.getNodes();
      const edges = proxy.getEdges();

      expect(nodes).toHaveLength(4);
      expect(edges).toHaveLength(3);
      expect(proxy.getNodeById(100)?.nodeConfig?.extension?.x).toBe(500);
    });

    it('重置后状态清空', () => {
      proxy.initialize(createLinearWorkflow());
      proxy.addNode(createMockNode({ id: 100, name: '测试' }));
      // 使用 updateNode 来标记脏数据
      proxy.updateNodePosition(1, 200, 300);

      proxy.reset();

      expect(proxy.getNodes()).toHaveLength(0);
      expect(proxy.getEdges()).toHaveLength(0);
      expect(proxy.hasPendingChanges()).toBe(false);
      expect(proxy.getFullWorkflowData()).toBeNull();
    });
  });

  // ============ 场景8：复杂工作流操作 ============
  describe('复杂工作流操作', () => {
    it('在分支工作流中添加新分支', () => {
      proxy.initialize(createBranchWorkflow());

      // 添加新分支节点
      const newBranchNode = createMockNode({
        id: 100,
        type: NodeTypeEnum.LLM,
        name: '分支3',
        nextNodeIds: [5],
      });
      proxy.addNode(newBranchNode);

      // 更新条件节点配置，添加新分支
      const conditionNode = proxy.getNodeById(2)!;
      if (conditionNode.nodeConfig?.conditionBranchConfigs) {
        conditionNode.nodeConfig.conditionBranchConfigs.push({
          uuid: 'branch-3',
          conditionArgs: [],
          nextNodeIds: [100],
          branchType: 'condition',
          conditionType: 'and',
        } as any);
      }
      proxy.updateNode(conditionNode);

      // 添加边：2 -> 100
      proxy.addEdge({
        source: '2',
        target: '100',
        sourcePort: '2-branch-3-out',
      });

      // 验证
      expect(proxy.getNodes()).toHaveLength(6);
      expect(proxy.getEdges()).toHaveLength(6);
    });

    it('删除分支节点后保留其他分支', () => {
      proxy.initialize(createBranchWorkflow());

      // 删除分支1的节点
      proxy.deleteNode(3);

      // 验证分支2仍然存在
      expect(proxy.getNodeById(4)).not.toBeNull();
      expect(proxy.getNodeById(5)).not.toBeNull();

      // 验证条件节点的分支配置已更新
      const conditionNode = proxy.getNodeById(2)!;
      const branch1 = conditionNode.nodeConfig?.conditionBranchConfigs?.[0];
      expect(branch1?.nextNodeIds).not.toContain(3);
    });
  });
});
