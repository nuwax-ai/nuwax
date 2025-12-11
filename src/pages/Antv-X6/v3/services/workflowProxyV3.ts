/**
 * V3 工作流数据代理服务
 *
 * 核心功能：
 * 1. 代理所有节点/边操作
 * 2. 维护本地数据副本
 * 3. 组装全量工作流数据
 * 4. 暂存待发送数据（后端接口 ready 后发送）
 *
 * 解决问题：V1 中每个操作都独立调用后端接口，导致前后端数据不同步
 * 解决方案：统一在前端组装完整数据，全量发送给后端
 */

import type { ChildNode, Edge } from '@/types/interfaces/graph';
import { cloneDeep } from '@/utils/common';

// ==================== 类型定义 ====================

export interface WorkflowDataV3 {
  workflowId: number;
  nodes: ChildNode[];
  edges: Edge[];
  modified: string;
}

export interface PendingUpdate {
  type: 'node' | 'edge';
  action: 'add' | 'update' | 'delete' | 'move';
  data: ChildNode | Edge;
  timestamp: number;
}

export interface ProxyResult {
  success: boolean;
  message?: string;
  data?: WorkflowDataV3;
}

// ==================== 代理服务类 ====================

class WorkflowProxyV3 {
  private workflowData: WorkflowDataV3 | null = null;
  private pendingUpdates: PendingUpdate[] = [];
  private isBackendReady = false;
  private isDirty = false;

  // ==================== 初始化 ====================

  /**
   * 初始化工作流数据
   * @param data 工作流数据
   */
  initialize(data: WorkflowDataV3): void {
    this.workflowData = cloneDeep(data);
    this.pendingUpdates = [];
    this.isDirty = false;
    console.log('[V3 Proxy] 工作流数据初始化完成:', data.workflowId);
    console.log(
      '[V3 Proxy] 节点数量:',
      data.nodes.length,
      '边数量:',
      data.edges.length,
    );

    // 调试：打印节点的 nextNodeIds
    data.nodes.forEach((node) => {
      if (node.nextNodeIds && node.nextNodeIds.length > 0) {
        console.log(
          '[V3 Proxy] 节点',
          node.id,
          node.name,
          'nextNodeIds:',
          node.nextNodeIds,
        );
      }
    });
  }

  /**
   * 重置代理状态
   */
  reset(): void {
    this.workflowData = null;
    this.pendingUpdates = [];
    this.isDirty = false;
  }

  // ==================== 数据获取 ====================

  /**
   * 获取当前完整的工作流数据
   */
  getFullWorkflowData(): WorkflowDataV3 | null {
    return this.workflowData ? cloneDeep(this.workflowData) : null;
  }

  /**
   * 获取节点列表
   */
  getNodes(): ChildNode[] {
    return this.workflowData ? cloneDeep(this.workflowData.nodes) : [];
  }

  /**
   * 获取边列表
   */
  getEdges(): Edge[] {
    return this.workflowData ? cloneDeep(this.workflowData.edges) : [];
  }

  /**
   * 根据 ID 获取节点
   */
  getNodeById(nodeId: number): ChildNode | null {
    if (!this.workflowData) return null;
    const node = this.workflowData.nodes.find((n) => n.id === nodeId);
    return node ? cloneDeep(node) : null;
  }

  /**
   * 检查是否有未保存的更改
   */
  hasPendingChanges(): boolean {
    return this.isDirty || this.pendingUpdates.length > 0;
  }

  // ==================== 节点操作代理 ====================

  /**
   * 更新节点（配置变更、位置变更等）
   * @param node 节点数据
   */
  updateNode(node: ChildNode): ProxyResult {
    if (!this.workflowData) {
      return { success: false, message: '工作流数据未初始化' };
    }

    const index = this.workflowData.nodes.findIndex((n) => n.id === node.id);
    if (index >= 0) {
      this.workflowData.nodes[index] = cloneDeep(node);
    } else {
      // 节点不存在，作为新增处理
      this.workflowData.nodes.push(cloneDeep(node));
    }

    this.recordUpdate({
      type: 'node',
      action: 'update',
      data: node,
      timestamp: Date.now(),
    });
    this.markDirty();

    console.log('[V3 Proxy] 节点更新:', node.id, node.name);
    return { success: true, data: this.getFullWorkflowData()! };
  }

  /**
   * 添加节点
   * @param node 节点数据
   */
  addNode(node: ChildNode): ProxyResult {
    if (!this.workflowData) {
      return { success: false, message: '工作流数据未初始化' };
    }

    // 检查节点是否已存在
    const exists = this.workflowData.nodes.find((n) => n.id === node.id);
    if (exists) {
      return { success: false, message: `节点 ${node.id} 已存在` };
    }

    this.workflowData.nodes.push(cloneDeep(node));
    this.recordUpdate({
      type: 'node',
      action: 'add',
      data: node,
      timestamp: Date.now(),
    });
    this.markDirty();

    console.log('[V3 Proxy] 节点新增:', node.id, node.name);
    return { success: true, data: this.getFullWorkflowData()! };
  }

  /**
   * 删除节点
   * @param nodeId 节点 ID
   */
  deleteNode(nodeId: number): ProxyResult {
    if (!this.workflowData) {
      return { success: false, message: '工作流数据未初始化' };
    }

    const index = this.workflowData.nodes.findIndex((n) => n.id === nodeId);
    if (index < 0) {
      return { success: false, message: `节点 ${nodeId} 不存在` };
    }

    const deleted = this.workflowData.nodes.splice(index, 1)[0];

    // 同时删除与该节点相关的边
    this.workflowData.edges = this.workflowData.edges.filter(
      (e) => e.source !== String(nodeId) && e.target !== String(nodeId),
    );

    // 同时更新其他节点的 nextNodeIds
    this.workflowData.nodes.forEach((node) => {
      if (node.nextNodeIds && node.nextNodeIds.includes(nodeId)) {
        node.nextNodeIds = node.nextNodeIds.filter((id) => id !== nodeId);
      }
    });

    this.recordUpdate({
      type: 'node',
      action: 'delete',
      data: deleted,
      timestamp: Date.now(),
    });
    this.markDirty();

    console.log('[V3 Proxy] 节点删除:', nodeId);
    return { success: true, data: this.getFullWorkflowData()! };
  }

  /**
   * 更新节点位置
   * @param nodeId 节点 ID
   * @param x X 坐标
   * @param y Y 坐标
   */
  updateNodePosition(
    nodeId: number,
    x: number,
    y: number,
    width?: number,
    height?: number,
  ): ProxyResult {
    if (!this.workflowData) {
      return { success: false, message: '工作流数据未初始化' };
    }

    const node = this.workflowData.nodes.find((n) => n.id === nodeId);
    if (!node) {
      return { success: false, message: `节点 ${nodeId} 不存在` };
    }

    // 更新节点扩展信息中的位置
    if (!node.nodeConfig) {
      node.nodeConfig = {} as any;
    }
    if (!node.nodeConfig.extension) {
      node.nodeConfig.extension = {} as any;
    }
    node.nodeConfig.extension!.x = x;
    node.nodeConfig.extension!.y = y;
    if (width !== undefined) {
      node.nodeConfig.extension!.width = width;
    }
    if (height !== undefined) {
      node.nodeConfig.extension!.height = height;
    }

    this.recordUpdate({
      type: 'node',
      action: 'move',
      data: node,
      timestamp: Date.now(),
    });
    this.markDirty();

    console.log('[V3 Proxy] 节点位置更新:', nodeId, { x, y });
    return { success: true, data: this.getFullWorkflowData()! };
  }

  // ==================== 边操作代理 ====================

  /**
   * 添加边
   * @param edge 边数据
   */
  addEdge(edge: Edge): ProxyResult {
    if (!this.workflowData) {
      return { success: false, message: '工作流数据未初始化' };
    }

    // 检查边是否已存在
    const exists = this.workflowData.edges.find(
      (e) => e.source === edge.source && e.target === edge.target,
    );
    if (exists) {
      return { success: false, message: '边已存在' };
    }

    this.workflowData.edges.push(cloneDeep(edge));

    // 同步更新源节点的 nextNodeIds
    const sourceNodeId = Number(edge.source);
    const targetNodeId = Number(edge.target);
    const sourceNode = this.workflowData.nodes.find(
      (n) => n.id === sourceNodeId,
    );
    if (sourceNode) {
      if (!sourceNode.nextNodeIds) {
        sourceNode.nextNodeIds = [];
      }
      if (!sourceNode.nextNodeIds.includes(targetNodeId)) {
        sourceNode.nextNodeIds.push(targetNodeId);
      }
    }

    this.recordUpdate({
      type: 'edge',
      action: 'add',
      data: edge,
      timestamp: Date.now(),
    });
    this.markDirty();

    console.log('[V3 Proxy] 边新增:', edge.source, '->', edge.target);
    return { success: true, data: this.getFullWorkflowData()! };
  }

  /**
   * 删除边
   * @param source 源节点 ID
   * @param target 目标节点 ID
   */
  deleteEdge(source: string, target: string): ProxyResult {
    if (!this.workflowData) {
      return { success: false, message: '工作流数据未初始化' };
    }

    const index = this.workflowData.edges.findIndex(
      (e) => e.source === source && e.target === target,
    );
    if (index < 0) {
      return { success: false, message: '边不存在' };
    }

    const deleted = this.workflowData.edges.splice(index, 1)[0];

    // 同步更新源节点的 nextNodeIds
    const sourceNodeId = Number(source);
    const targetNodeId = Number(target);
    const sourceNode = this.workflowData.nodes.find(
      (n) => n.id === sourceNodeId,
    );
    if (sourceNode && sourceNode.nextNodeIds) {
      sourceNode.nextNodeIds = sourceNode.nextNodeIds.filter(
        (id) => id !== targetNodeId,
      );
    }

    this.recordUpdate({
      type: 'edge',
      action: 'delete',
      data: deleted,
      timestamp: Date.now(),
    });
    this.markDirty();

    console.log('[V3 Proxy] 边删除:', source, '->', target);
    return { success: true, data: this.getFullWorkflowData()! };
  }

  /**
   * 更新节点的 nextNodeIds（用于边的批量更新）
   * @param nodeId 节点 ID
   * @param nextNodeIds 下游节点 ID 列表
   */
  updateNodeNextIds(nodeId: number, nextNodeIds: number[]): ProxyResult {
    if (!this.workflowData) {
      return { success: false, message: '工作流数据未初始化' };
    }

    const node = this.workflowData.nodes.find((n) => n.id === nodeId);
    if (!node) {
      return { success: false, message: `节点 ${nodeId} 不存在` };
    }

    node.nextNodeIds = [...nextNodeIds];
    this.markDirty();

    console.log('[V3 Proxy] 节点 nextNodeIds 更新:', nodeId, nextNodeIds);
    return { success: true, data: this.getFullWorkflowData()! };
  }

  // ==================== 内部方法 ====================

  /**
   * 记录待发送的更新
   */
  private recordUpdate(update: PendingUpdate): void {
    this.pendingUpdates.push(update);
  }

  /**
   * 标记数据已修改
   */
  private markDirty(): void {
    this.isDirty = true;
    if (this.workflowData) {
      this.workflowData.modified = new Date().toISOString();
    }
  }

  // ==================== 后端接口相关 ====================

  /**
   * 获取待发送的全量数据（后端接口 ready 后调用）
   */
  getPendingFullData(): WorkflowDataV3 | null {
    if (!this.isDirty) return null;
    return this.getFullWorkflowData();
  }

  /**
   * 获取待发送的更新记录
   */
  getPendingUpdates(): PendingUpdate[] {
    return [...this.pendingUpdates];
  }

  /**
   * 清除待发送记录（发送成功后调用）
   */
  clearPendingUpdates(): void {
    this.pendingUpdates = [];
    this.isDirty = false;
    console.log('[V3 Proxy] 待发送记录已清除');
  }

  /**
   * 设置后端是否 ready
   */
  setBackendReady(ready: boolean): void {
    this.isBackendReady = ready;
    console.log('[V3 Proxy] 后端状态:', ready ? 'ready' : 'not ready');
  }

  /**
   * 检查后端是否 ready
   */
  isReady(): boolean {
    return this.isBackendReady;
  }
}

// 导出单例实例
export const workflowProxy = new WorkflowProxyV3();
export default WorkflowProxyV3;
