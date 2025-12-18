/**
 * V3 工作流数据代理服务
 *
 * 核心功能：
 * 1. 代理所有节点/边操作
 * 2. 维护本地数据副本
 * 3. 组装全量工作流数据
 * 4. 暂存待发送数据（后端接口发送）
 *
 * 解决问题：V1 中每个操作都独立调用后端接口，导致前后端数据不同步
 * 解决方案：统一在前端组装完整数据，全量发送给后端
 *
 * 特殊端口处理：
 * - 条件节点 (Condition): conditionBranchConfigs[].nextNodeIds
 * - 意图节点 (IntentRecognition): intentConfigs[].nextNodeIds
 * - 问答节点 (QA): options[].nextNodeIds (仅 answerType === 'SELECT')
 * - 异常处理: exceptionHandleConfig.exceptionHandleNodeIds
 */

import type { IgetDetails } from '@/services/workflow';
import { AnswerTypeEnum, NodeTypeEnum } from '@/types/enums/common';
import type { ChildNode, Edge } from '@/types/interfaces/graph';
import { cloneDeep } from '@/utils/common';
import { SpecialPortType } from '../types/enums';
import type { EdgeV3, WorkflowDataV3 } from '../types/interfaces';
import { generateFallbackNodeId } from '../utils/nodeUtils';

// ==================== 类型定义 ====================

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

export type ProxyEventType = 'mutation' | 'history' | 'reset';

// Removed manual history interfaces and properties

// ==================== 代理服务类 ====================

class WorkflowProxyV3 {
  private workflowData: WorkflowDataV3 | null = null;
  private workflowInfo: IgetDetails | null = null; // 存储完整的工作流信息
  private pendingUpdates: PendingUpdate[] = [];
  private isBackendReady = false;
  private isDirty = false;

  // History
  private maxHistorySize = 50;
  private listeners: ((type: ProxyEventType) => void)[] = [];

  // ==================== 初始化 ====================

  /**
   * 初始化工作流数据
   * @param data 工作流数据
   */
  initialize(data: WorkflowDataV3): void {
    this.workflowData = cloneDeep(data);
    this.pendingUpdates = [];
    this.isDirty = false;

    this.notify('mutation');

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
    this.workflowInfo = null;
    this.pendingUpdates = [];
    this.isDirty = false;
    this.notify('reset');
  }

  /**
   * 设置完整的工作流信息（从 getDetails 接口返回的数据）
   * @param info 工作流完整信息
   */
  setWorkflowInfo(info: IgetDetails): void {
    this.workflowInfo = cloneDeep(info);
  }

  /**
   * 获取工作流信息
   */
  getWorkflowInfo(): IgetDetails | null {
    return this.workflowInfo ? cloneDeep(this.workflowInfo) : null;
  }

  /**
   * 构建完整的工作流配置（用于全量保存）
   * 将当前的节点数据合并到原始的工作流信息中
   */
  buildFullConfig(): IgetDetails | null {
    if (!this.workflowInfo || !this.workflowData) {
      return null;
    }

    // 在构建配置前验证数据一致性
    this.validateDataConsistency();

    const nodes = this.workflowData.nodes;
    const startNode = nodes.find((n) => n.type === 'Start');
    const endNode = nodes.find((n) => n.type === 'End');

    // 构建完整的工作流配置，符合 IgetDetails 结构
    const config: IgetDetails = {
      ...this.workflowInfo,
      nodes: cloneDeep(nodes),
      startNode: startNode ? cloneDeep(startNode) : this.workflowInfo.startNode,
      endNode: endNode ? cloneDeep(endNode) : this.workflowInfo.endNode,
      inputArgs:
        startNode?.nodeConfig?.inputArgs || this.workflowInfo.inputArgs,
      outputArgs:
        endNode?.nodeConfig?.outputArgs || this.workflowInfo.outputArgs,
      modified: new Date().toISOString(),
    };

    return config;
  }

  /**
   * 验证数据一致性
   * 检查节点和边的对应关系，确保数据完整
   */
  private validateDataConsistency(): void {
    if (!this.workflowData) return;

    const { nodes, edges } = this.workflowData;
    const nodeIds = new Set(nodes.map((n) => n.id));

    // 1. 验证所有边的 source/target 节点都存在
    const invalidEdges: EdgeV3[] = [];
    edges.forEach((edge) => {
      const sourceId = parseInt(edge.source, 10);
      const targetId = parseInt(edge.target, 10);

      if (!nodeIds.has(sourceId)) {
        console.warn(
          `[WorkflowProxy] 边的源节点不存在: ${edge.source}, 将移除此边`,
        );
        invalidEdges.push(edge);
      } else if (!nodeIds.has(targetId)) {
        console.warn(
          `[WorkflowProxy] 边的目标节点不存在: ${edge.target}, 将移除此边`,
        );
        invalidEdges.push(edge);
      }
    });

    // 移除无效的边
    if (invalidEdges.length > 0) {
      this.workflowData.edges = edges.filter((e) => !invalidEdges.includes(e));
      console.log(`[WorkflowProxy] 已移除 ${invalidEdges.length} 条无效边`);
    }

    // 2. 验证 nextNodeIds 与边的一致性（仅警告，不自动修复）
    nodes.forEach((node) => {
      // 跳过特殊分支节点（它们使用分支配置管理连线）
      if (
        node.type === NodeTypeEnum.Condition ||
        node.type === NodeTypeEnum.IntentRecognition ||
        node.type === NodeTypeEnum.QA
      ) {
        return;
      }

      // 获取画布上从该节点出发的边
      const nodeEdges = this.workflowData!.edges.filter(
        (e) => parseInt(e.source, 10) === node.id,
      );
      const expectedNextIds = new Set(
        nodeEdges
          .filter((e) => !e.sourcePort || !e.sourcePort.includes('-exception-'))
          .map((e) => parseInt(e.target, 10)),
      );

      const actualNextIds = new Set(node.nextNodeIds || []);

      // 检查画布上有边但 nextNodeIds 没有的情况
      expectedNextIds.forEach((id) => {
        if (!actualNextIds.has(id)) {
          console.warn(
            `[WorkflowProxy] 节点 ${node.id} (${node.name}) 画布有边到 ${id}，但 nextNodeIds 缺少此连接，已自动添加`,
          );
          if (!node.nextNodeIds) node.nextNodeIds = [];
          node.nextNodeIds.push(id);
        }
      });

      // 检查 nextNodeIds 有但画布上没边的情况（可能是历史遗留数据）
      actualNextIds.forEach((id) => {
        if (!expectedNextIds.has(id)) {
          console.warn(
            `[WorkflowProxy] 节点 ${node.id} (${node.name}) nextNodeIds 包含 ${id}，但画布无对应边，已自动移除`,
          );
          node.nextNodeIds = (node.nextNodeIds || []).filter(
            (nid) => nid !== id,
          );
        }
      });
    });
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
      console.log('[V3 Proxy] 节点更新成功:', node.id, node.name);
    } else {
      // 节点不存在，作为新增处理
      this.workflowData.nodes.push(cloneDeep(node));
      console.log('[V3 Proxy] 节点新增（通过更新）:', node.id, node.name);
    }

    this.recordUpdate({
      type: 'node',
      action: 'update',
      data: node,
      timestamp: Date.now(),
    });
    this.markDirty();
    this.notify('mutation');

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
    this.notify('mutation');

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

    // 清理其他节点中对该节点的引用
    this.workflowData.nodes.forEach((node) => {
      // 普通节点的 nextNodeIds
      if (node.nextNodeIds && node.nextNodeIds.includes(nodeId)) {
        node.nextNodeIds = node.nextNodeIds.filter((id) => id !== nodeId);
      }

      // 条件节点的分支配置
      if (
        node.type === NodeTypeEnum.Condition &&
        node.nodeConfig?.conditionBranchConfigs
      ) {
        node.nodeConfig.conditionBranchConfigs.forEach((branch) => {
          if (branch.nextNodeIds && branch.nextNodeIds.includes(nodeId)) {
            branch.nextNodeIds = branch.nextNodeIds.filter(
              (id) => id !== nodeId,
            );
          }
        });
      }

      // 意图节点的分支配置
      if (
        node.type === NodeTypeEnum.IntentRecognition &&
        node.nodeConfig?.intentConfigs
      ) {
        node.nodeConfig.intentConfigs.forEach((intent) => {
          if (intent.nextNodeIds && intent.nextNodeIds.includes(nodeId)) {
            intent.nextNodeIds = intent.nextNodeIds.filter(
              (id) => id !== nodeId,
            );
          }
        });
      }

      // 问答节点的选项配置
      if (
        node.type === NodeTypeEnum.QA &&
        node.nodeConfig?.answerType === AnswerTypeEnum.SELECT &&
        node.nodeConfig?.options
      ) {
        node.nodeConfig.options.forEach((option) => {
          if (option.nextNodeIds && option.nextNodeIds.includes(nodeId)) {
            option.nextNodeIds = option.nextNodeIds.filter(
              (id) => id !== nodeId,
            );
          }
        });
      }

      // 异常处理配置
      if (node.nodeConfig?.exceptionHandleConfig?.exceptionHandleNodeIds) {
        const exceptionIds =
          node.nodeConfig.exceptionHandleConfig.exceptionHandleNodeIds;
        if (exceptionIds.includes(nodeId)) {
          node.nodeConfig.exceptionHandleConfig.exceptionHandleNodeIds =
            exceptionIds.filter((id) => id !== nodeId);
        }
      }
    });

    this.recordUpdate({
      type: 'node',
      action: 'delete',
      data: deleted,
      timestamp: Date.now(),
    });
    this.markDirty();
    this.notify('mutation');

    return { success: true, data: this.getFullWorkflowData()! };
  }

  /**
   * 复制节点
   * @param nodeId 源节点 ID
   * @param offset 可选的偏移量，用于多次粘贴时的累积偏移
   */
  copyNode(
    nodeId: number,
    offset?: { x: number; y: number },
  ): ProxyResult & { newNode?: ChildNode } {
    if (!this.workflowData) {
      return { success: false, message: '工作流数据未初始化' };
    }

    const sourceNode = this.workflowData.nodes.find((n) => n.id === nodeId);
    if (!sourceNode) {
      return { success: false, message: `节点 ${nodeId} 不存在` };
    }

    // 1. Clone data
    const newNode = cloneDeep(sourceNode);

    // 2. Generate new ID (使用工具函数)
    newNode.id = generateFallbackNodeId(this.workflowData.workflowId);

    // 3. Update Name
    const existingNames = this.workflowData.nodes.map((n) => n.name);
    let newName = `${newNode.name}_copy`;
    let counter = 1;
    while (existingNames.includes(newName)) {
      newName = `${newNode.name}_copy${counter}`;
      counter++;
    }
    newNode.name = newName;

    // 4. Apply offset to position
    if (newNode.nodeConfig?.extension && offset) {
      newNode.nodeConfig.extension.x =
        (sourceNode.nodeConfig?.extension?.x || 0) + offset.x;
      newNode.nodeConfig.extension.y =
        (sourceNode.nodeConfig?.extension?.y || 0) + offset.y;
    }

    // 5. Reset status
    // newNode.waitStatus = 0; // Removed as not in type
    // newNode.excutionStatus = 0; // Removed as not in type

    // 6. Loop handling (if copies into same loop)
    // Inherit loopNodeId from source.

    this.workflowData.nodes.push(newNode);

    this.recordUpdate({
      type: 'node',
      action: 'add',
      data: newNode,
      timestamp: Date.now(),
    });
    this.markDirty();
    this.notify('mutation');

    return { success: true, data: this.getFullWorkflowData()!, newNode };
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
    this.notify('mutation');

    return { success: true, data: this.getFullWorkflowData()! };
  }

  // ==================== 边操作代理 ====================

  // ==================== 辅助方法：解析端口信息 ====================

  /**
   * 解析源端口类型
   * @param sourcePort 源端口 ID
   * @param sourceNode 源节点
   * @returns 端口类型和相关信息
   */
  private parseSourcePort(
    sourcePort: string | undefined,
    sourceNode: ChildNode,
  ): {
    type: SpecialPortType;
    uuid?: string; // 用于条件/意图/问答的分支 UUID
  } {
    if (!sourcePort) {
      return { type: SpecialPortType.Normal };
    }

    // 检查异常端口：格式为 ${nodeId}-exception-out
    if (sourcePort.includes('-exception-out')) {
      return { type: SpecialPortType.Exception };
    }

    // 检查循环节点特殊端口
    if (sourceNode.type === NodeTypeEnum.Loop && sourcePort.includes('-in')) {
      return { type: SpecialPortType.Loop };
    }

    // 检查条件/意图/问答节点的分支端口
    // 格式为 ${nodeId}-${uuid}-out
    if (
      sourceNode.type === NodeTypeEnum.Condition ||
      sourceNode.type === NodeTypeEnum.IntentRecognition ||
      (sourceNode.type === NodeTypeEnum.QA &&
        sourceNode.nodeConfig?.answerType === AnswerTypeEnum.SELECT)
    ) {
      // 从端口 ID 中提取 uuid
      // 格式：{nodeId}-{uuid}-out 或 {nodeId}-{uuid}
      const parts = sourcePort.split('-');
      if (parts.length >= 2) {
        // 移除 nodeId 和 out，剩余部分就是 uuid
        const nodeIdStr = String(sourceNode.id);
        let uuid = sourcePort;
        if (sourcePort.startsWith(nodeIdStr + '-')) {
          uuid = sourcePort.substring(nodeIdStr.length + 1);
        }
        if (uuid.endsWith('-out')) {
          uuid = uuid.substring(0, uuid.length - 4);
        }

        if (sourceNode.type === NodeTypeEnum.Condition) {
          return { type: SpecialPortType.Condition, uuid };
        } else if (sourceNode.type === NodeTypeEnum.IntentRecognition) {
          return { type: SpecialPortType.Intent, uuid };
        } else {
          return { type: SpecialPortType.QAOption, uuid };
        }
      }
    }

    return { type: SpecialPortType.Normal };
  }

  /**
   * 更新特殊节点的分支 nextNodeIds
   * @param sourceNode 源节点
   * @param portInfo 端口信息
   * @param targetNodeId 目标节点 ID
   * @param action 'add' 或 'remove'
   */
  private updateSpecialNodeConnection(
    sourceNode: ChildNode,
    portInfo: { type: SpecialPortType; uuid?: string },
    targetNodeId: number,
    action: 'add' | 'remove',
  ): boolean {
    const { type, uuid } = portInfo;

    switch (type) {
      case SpecialPortType.Condition: {
        const configs = sourceNode.nodeConfig?.conditionBranchConfigs;
        if (!configs) return false;
        const branch = configs.find((c) => c.uuid === uuid);
        if (!branch) return false;
        if (!branch.nextNodeIds) branch.nextNodeIds = [];

        if (action === 'add') {
          if (!branch.nextNodeIds.includes(targetNodeId)) {
            branch.nextNodeIds.push(targetNodeId);
          }
        } else {
          branch.nextNodeIds = branch.nextNodeIds.filter(
            (id) => id !== targetNodeId,
          );
        }
        return true;
      }

      case SpecialPortType.Intent: {
        const configs = sourceNode.nodeConfig?.intentConfigs;
        if (!configs) return false;
        const intent = configs.find((c) => c.uuid === uuid);
        if (!intent) return false;
        if (!intent.nextNodeIds) intent.nextNodeIds = [];

        if (action === 'add') {
          if (!intent.nextNodeIds.includes(targetNodeId)) {
            intent.nextNodeIds.push(targetNodeId);
          }
        } else {
          intent.nextNodeIds = intent.nextNodeIds.filter(
            (id) => id !== targetNodeId,
          );
        }
        return true;
      }

      case SpecialPortType.QAOption: {
        const options = sourceNode.nodeConfig?.options;
        if (!options) return false;
        const option = options.find((o) => o.uuid === uuid);
        if (!option) return false;
        if (!option.nextNodeIds) option.nextNodeIds = [];

        if (action === 'add') {
          if (!option.nextNodeIds.includes(targetNodeId)) {
            option.nextNodeIds.push(targetNodeId);
          }
        } else {
          option.nextNodeIds = option.nextNodeIds.filter(
            (id) => id !== targetNodeId,
          );
        }
        return true;
      }

      case SpecialPortType.Exception: {
        if (!sourceNode.nodeConfig) return false;
        if (!sourceNode.nodeConfig.exceptionHandleConfig) {
          sourceNode.nodeConfig.exceptionHandleConfig = {} as any;
        }
        const config = sourceNode.nodeConfig.exceptionHandleConfig!;
        if (!config.exceptionHandleNodeIds) {
          config.exceptionHandleNodeIds = [];
        }

        if (action === 'add') {
          if (!config.exceptionHandleNodeIds.includes(targetNodeId)) {
            config.exceptionHandleNodeIds.push(targetNodeId);
          }
        } else {
          config.exceptionHandleNodeIds = config.exceptionHandleNodeIds.filter(
            (id) => id !== targetNodeId,
          );
        }
        return true;
      }

      default:
        return false;
    }
  }

  /**
   * 添加边
   * @param edge 边数据（支持 sourcePort/targetPort）
   */
  addEdge(edge: EdgeV3): ProxyResult {
    if (!this.workflowData) {
      return { success: false, message: '工作流数据未初始化' };
    }

    // 检查边是否已存在（考虑 sourcePort）
    const exists = this.workflowData.edges.find(
      (e) =>
        e.source === edge.source &&
        e.target === edge.target &&
        (e.sourcePort || '') === (edge.sourcePort || ''),
    );
    if (exists) {
      return { success: false, message: '边已存在' };
    }

    this.workflowData.edges.push(cloneDeep(edge) as EdgeV3);

    // 同步更新源节点的连接关系
    const sourceNodeId = Number(edge.source);
    const targetNodeId = Number(edge.target);

    const sourceNode = this.workflowData.nodes.find(
      (n) => n.id === sourceNodeId,
    );

    if (sourceNode) {
      const portInfo = this.parseSourcePort(edge.sourcePort, sourceNode);

      if (portInfo.type !== SpecialPortType.Normal) {
        // 特殊端口：更新相应的分支配置
        this.updateSpecialNodeConnection(
          sourceNode,
          portInfo,
          targetNodeId,
          'add',
        );
        console.log(
          '[V3 Proxy] 特殊端口连线添加:',
          portInfo.type,
          'uuid:',
          portInfo.uuid,
          '->',
          targetNodeId,
        );
      } else {
        // 普通端口：更新 nextNodeIds
        if (!sourceNode.nextNodeIds) {
          sourceNode.nextNodeIds = [];
        }
        if (!sourceNode.nextNodeIds.includes(targetNodeId)) {
          sourceNode.nextNodeIds.push(targetNodeId);
        }
      }
    }

    this.recordUpdate({
      type: 'edge',
      action: 'add',
      data: edge,
      timestamp: Date.now(),
    });
    this.markDirty();
    this.notify('mutation');

    return { success: true, data: this.getFullWorkflowData()! };
  }

  /**
   * 删除边
   * @param source 源节点 ID
   * @param target 目标节点 ID
   * @param sourcePort 可选的源端口 ID（用于特殊节点的分支连线）
   */
  deleteEdge(source: string, target: string, sourcePort?: string): ProxyResult {
    if (!this.workflowData) {
      return { success: false, message: '工作流数据未初始化' };
    }

    // 使用字符串比较，确保类型一致
    // 如果提供了 sourcePort，则需要精确匹配
    const index = this.workflowData.edges.findIndex((e) => {
      const sourceMatch = String(e.source) === String(source);
      const targetMatch = String(e.target) === String(target);
      if (sourcePort) {
        return (
          sourceMatch && targetMatch && (e.sourcePort || '') === sourcePort
        );
      }
      return sourceMatch && targetMatch;
    });

    if (index < 0) {
      return { success: false, message: '边不存在' };
    }

    const deleted = this.workflowData.edges.splice(index, 1)[0];

    // 同步更新源节点的连接关系
    const sourceNodeId = Number(source);
    const targetNodeId = Number(target);
    const sourceNode = this.workflowData.nodes.find(
      (n) => n.id === sourceNodeId,
    );

    if (sourceNode) {
      // 使用删除的边的 sourcePort 来确定端口类型
      const effectiveSourcePort = sourcePort || deleted.sourcePort;
      const portInfo = this.parseSourcePort(effectiveSourcePort, sourceNode);

      if (portInfo.type !== SpecialPortType.Normal) {
        // 特殊端口：更新相应的分支配置
        this.updateSpecialNodeConnection(
          sourceNode,
          portInfo,
          targetNodeId,
          'remove',
        );
        console.log(
          '[V3 Proxy] 特殊端口连线删除:',
          portInfo.type,
          'uuid:',
          portInfo.uuid,
          '->',
          targetNodeId,
        );
      } else {
        // 普通端口：更新 nextNodeIds
        if (sourceNode.nextNodeIds) {
          sourceNode.nextNodeIds = sourceNode.nextNodeIds.filter(
            (id) => id !== targetNodeId,
          );
        }
      }
    }

    this.recordUpdate({
      type: 'edge',
      action: 'delete',
      data: deleted,
      timestamp: Date.now(),
    });
    this.markDirty();
    this.notify('mutation');

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
    this.notify('mutation');

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
  }

  /**
   * 设置后端是否 ready
   */
  setBackendReady(ready: boolean): void {
    this.isBackendReady = ready;
  }

  /**
   * 检查后端是否 ready
   */
  isReady(): boolean {
    return this.isBackendReady;
  }

  /**
   * 从 X6 Graph 同步数据
   * 注意：需要保留业务数据（如 nextNodeIds、分支配置等）
   *
   * 特殊处理：
   * - 普通节点：更新 nextNodeIds
   * - 条件节点：更新 conditionBranchConfigs[].nextNodeIds
   * - 意图节点：更新 intentConfigs[].nextNodeIds
   * - 问答节点：更新 options[].nextNodeIds
   * - 异常处理：更新 exceptionHandleConfig.exceptionHandleNodeIds
   */
  syncFromGraph(nodes: ChildNode[], edges: EdgeV3[]) {
    if (!this.workflowData) return;

    // 创建节点 ID 到节点的映射
    const nodeMap = new Map<number, ChildNode>();
    nodes.forEach((node) => nodeMap.set(node.id, cloneDeep(node)));

    // 创建结构来存储各类连接关系
    // 普通连接：nodeId -> targetIds
    const normalNextNodeIds = new Map<number, number[]>();
    // 特殊分支连接：nodeId -> uuid -> targetIds
    const branchNextNodeIds = new Map<number, Map<string, number[]>>();
    // 异常处理连接：nodeId -> targetIds
    const exceptionNextNodeIds = new Map<number, number[]>();

    // 先为所有节点初始化空数组，确保删除的边会清空对应的 nextNodeIds
    this.workflowData.nodes.forEach((existingNode) => {
      normalNextNodeIds.set(existingNode.id, []);

      // 初始化分支连接
      if (
        existingNode.type === NodeTypeEnum.Condition &&
        existingNode.nodeConfig?.conditionBranchConfigs
      ) {
        const branchMap = new Map<string, number[]>();
        existingNode.nodeConfig.conditionBranchConfigs.forEach((branch) => {
          branchMap.set(branch.uuid, []);
        });
        branchNextNodeIds.set(existingNode.id, branchMap);
      }

      if (
        existingNode.type === NodeTypeEnum.IntentRecognition &&
        existingNode.nodeConfig?.intentConfigs
      ) {
        const branchMap = new Map<string, number[]>();
        existingNode.nodeConfig.intentConfigs.forEach((intent) => {
          branchMap.set(intent.uuid, []);
        });
        branchNextNodeIds.set(existingNode.id, branchMap);
      }

      if (
        existingNode.type === NodeTypeEnum.QA &&
        existingNode.nodeConfig?.answerType === AnswerTypeEnum.SELECT &&
        existingNode.nodeConfig?.options
      ) {
        const branchMap = new Map<string, number[]>();
        existingNode.nodeConfig.options.forEach((option) => {
          branchMap.set(option.uuid, []);
        });
        branchNextNodeIds.set(existingNode.id, branchMap);
      }

      // 初始化异常处理连接
      if (existingNode.nodeConfig?.exceptionHandleConfig) {
        exceptionNextNodeIds.set(existingNode.id, []);
      }
    });

    // 从边数据填充连接关系
    edges.forEach((edge) => {
      const sourceId = Number(edge.source);
      const targetId = Number(edge.target);
      const sourceNode = nodeMap.get(sourceId);

      if (!sourceNode) return;

      if (edge.sourcePort) {
        const portInfo = this.parseSourcePort(edge.sourcePort, sourceNode);

        switch (portInfo.type) {
          case SpecialPortType.Condition:
          case SpecialPortType.Intent:
          case SpecialPortType.QAOption: {
            if (portInfo.uuid) {
              let branchMap = branchNextNodeIds.get(sourceId);
              if (!branchMap) {
                branchMap = new Map<string, number[]>();
                branchNextNodeIds.set(sourceId, branchMap);
              }
              let targetIds = branchMap.get(portInfo.uuid);
              if (!targetIds) {
                targetIds = [];
                branchMap.set(portInfo.uuid, targetIds);
              }
              if (!targetIds.includes(targetId)) {
                targetIds.push(targetId);
              }
            }
            break;
          }

          case SpecialPortType.Exception: {
            let targetIds = exceptionNextNodeIds.get(sourceId);
            if (!targetIds) {
              targetIds = [];
              exceptionNextNodeIds.set(sourceId, targetIds);
            }
            if (!targetIds.includes(targetId)) {
              targetIds.push(targetId);
            }
            break;
          }

          case SpecialPortType.Loop: {
            // 循环节点的内部连线（Loop-in -> LoopStart）是内部逻辑，不应计入节点的 nextNodeIds
            // 否则会在 V1 中渲染出错误的连线
            break;
          }

          case SpecialPortType.Normal:
          default: {
            // 普通连接
            let targetIds = normalNextNodeIds.get(sourceId);
            if (!targetIds) {
              targetIds = [];
              normalNextNodeIds.set(sourceId, targetIds);
            }
            if (!targetIds.includes(targetId)) {
              targetIds.push(targetId);
            }
            break;
          }
        }
      } else {
        // 没有 sourcePort 的边，按普通连接处理
        let targetIds = normalNextNodeIds.get(sourceId);
        if (!targetIds) {
          targetIds = [];
          normalNextNodeIds.set(sourceId, targetIds);
        }
        if (!targetIds.includes(targetId)) {
          targetIds.push(targetId);
        }
      }
    });

    // 合并节点数据，应用连接关系
    const mergedNodes = nodes.map((node) => {
      const nodeId = node.id;
      const mergedNode = cloneDeep(node);

      // 更新普通 nextNodeIds
      // 对于特殊分支节点，普通 nextNodeIds 应该保持为空
      const isSpecialBranchNode =
        mergedNode.type === NodeTypeEnum.Condition ||
        mergedNode.type === NodeTypeEnum.IntentRecognition ||
        (mergedNode.type === NodeTypeEnum.QA &&
          mergedNode.nodeConfig?.answerType === AnswerTypeEnum.SELECT);

      if (!isSpecialBranchNode) {
        mergedNode.nextNodeIds = normalNextNodeIds.get(nodeId) || [];
      } else {
        // 特殊分支节点的 nextNodeIds 应该为空，连接关系存储在分支配置中
        mergedNode.nextNodeIds = [];
      }

      // 更新分支连接
      const branchMap = branchNextNodeIds.get(nodeId);
      if (branchMap) {
        if (
          mergedNode.type === NodeTypeEnum.Condition &&
          mergedNode.nodeConfig?.conditionBranchConfigs
        ) {
          mergedNode.nodeConfig.conditionBranchConfigs.forEach((branch) => {
            branch.nextNodeIds = branchMap.get(branch.uuid) || [];
          });
        }

        if (
          mergedNode.type === NodeTypeEnum.IntentRecognition &&
          mergedNode.nodeConfig?.intentConfigs
        ) {
          mergedNode.nodeConfig.intentConfigs.forEach((intent) => {
            intent.nextNodeIds = branchMap.get(intent.uuid) || [];
          });
        }

        if (
          mergedNode.type === NodeTypeEnum.QA &&
          mergedNode.nodeConfig?.answerType === AnswerTypeEnum.SELECT &&
          mergedNode.nodeConfig?.options
        ) {
          mergedNode.nodeConfig.options.forEach((option) => {
            option.nextNodeIds = branchMap.get(option.uuid) || [];
          });
        }
      }

      // 更新异常处理连接
      const exceptionTargetIds = exceptionNextNodeIds.get(nodeId);
      if (exceptionTargetIds && mergedNode.nodeConfig?.exceptionHandleConfig) {
        mergedNode.nodeConfig.exceptionHandleConfig.exceptionHandleNodeIds =
          exceptionTargetIds;
      }

      return mergedNode;
    });

    this.workflowData.nodes = mergedNodes;
    this.workflowData.edges = cloneDeep(edges) as EdgeV3[];
    this.notify('mutation');

    // console.log('[V3 Proxy] syncFromGraph 完成，处理了', edges.length, '条边');
  }

  subscribe(listener: (type: ProxyEventType) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(type: ProxyEventType) {
    this.listeners.forEach((l) => l(type));
  }
}

// 导出单例实例
export const workflowProxy = new WorkflowProxyV3();
export default WorkflowProxyV3;
