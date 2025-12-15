/**
 * 工作流保存服务
 *
 * 核心理念：X6 画布数据 = 唯一真相来源（Single Source of Truth）
 *
 * 功能：
 * 1. 保存时从画布直接提取节点/边数据
 * 2. 从边数据计算 nextNodeIds（包括特殊分支）
 * 3. 构建完整的保存数据格式
 * 4. 调用后端 API 保存
 *
 * 优势：
 * - 消除数据副本维护
 * - 消除 syncFromGraph 同步逻辑
 * - 单点计算 nextNodeIds，避免多处逻辑不一致
 */

import type { IgetDetails } from '@/services/workflow';
import { AnswerTypeEnum, NodeTypeEnum } from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';
import { cloneDeep } from '@/utils/common';
import { Graph } from '@antv/x6';

// ==================== 类型定义 ====================

/**
 * 特殊端口类型枚举
 */
export enum PortType {
  Normal = 'normal',
  Condition = 'condition',
  Intent = 'intent',
  QAOption = 'qa_option',
  Exception = 'exception',
  Loop = 'loop',
}

/**
 * 边数据接口
 */
export interface EdgeData {
  source: string;
  target: string;
  sourcePort?: string;
  targetPort?: string;
}

/**
 * 工作流元数据（不包含节点/边）
 */
export interface WorkflowMeta {
  id: number;
  name: string;
  description: string;
  spaceId?: number;
  icon?: string;
  publishStatus?: string;
  extension?: any;
  scope?: any;
  category?: string;
  permissions?: any[];
  [key: string]: any; // 其他元数据字段
}

/**
 * 保存结果
 */
export interface SaveResult {
  success: boolean;
  message?: string;
}

// ==================== 保存服务类 ====================

class WorkflowSaveService {
  private meta: WorkflowMeta | null = null;
  private originalDetails: IgetDetails | null = null;
  private isDirty = false;
  private listeners: (() => void)[] = [];

  // ==================== 初始化 ====================

  /**
   * 初始化：从后端加载的完整数据中提取元数据
   */
  initialize(details: IgetDetails): void {
    this.originalDetails = cloneDeep(details);
    this.meta = {
      id: details.id,
      name: details.name,
      description: details.description,
      // IgetDetails 中的字段
      spaceId: details.spaceId,
      icon: details.icon,
      publishStatus: details.publishStatus,
      extension: details.extension,
      scope: details.scope,
      category: details.category,
      permissions: details.permissions,
    } as WorkflowMeta;
    this.isDirty = false;
  }

  /**
   * 重置服务状态
   */
  reset(): void {
    this.meta = null;
    this.originalDetails = null;
    this.isDirty = false;
  }

  // ==================== 脏数据标记 ====================

  /**
   * 标记数据已变更
   */
  markDirty(): void {
    this.isDirty = true;
    this.notifyListeners();
  }

  /**
   * 清除脏标记
   */
  clearDirty(): void {
    this.isDirty = false;
  }

  /**
   * 检查是否有未保存的变更
   */
  hasPendingChanges(): boolean {
    return this.isDirty;
  }

  // ==================== 核心保存方法 ====================

  /**
   * 从画布提取数据并构建保存载荷
   * @param graph X6 Graph 实例
   */
  buildPayload(graph: Graph): IgetDetails | null {
    if (!this.meta || !this.originalDetails) {
      console.error('[SaveService] 未初始化，无法构建保存数据');
      return null;
    }

    // 1. 从画布提取原始节点数据
    const rawNodes = this.extractNodes(graph);

    // 2. 从画布提取边数据
    const edges = this.extractEdges(graph);

    // 3. 从边计算连接关系（核心步骤）
    const nodes = this.computeConnections(rawNodes, edges);

    // 4. 构建完整的保存数据
    const startNode = nodes.find((n) => n.type === 'Start');
    const endNode = nodes.find((n) => n.type === 'End');

    const payload: IgetDetails = {
      ...this.originalDetails,
      ...this.meta,
      nodes: nodes,
      startNode: startNode || this.originalDetails.startNode,
      endNode: endNode || this.originalDetails.endNode,
      inputArgs:
        startNode?.nodeConfig?.inputArgs || this.originalDetails.inputArgs,
      outputArgs:
        endNode?.nodeConfig?.outputArgs || this.originalDetails.outputArgs,
      modified: new Date().toISOString(),
    };

    return payload;
  }

  // ==================== 数据提取方法 ====================

  /**
   * 从画布提取节点数据
   */
  private extractNodes(graph: Graph): ChildNode[] {
    return graph.getNodes().map((node) => {
      const data = node.getData() as ChildNode;
      const position = node.getPosition();
      const size = node.getSize();

      // 确保 nodeConfig.extension 包含最新的位置和大小
      const nodeData = cloneDeep(data);
      if (!nodeData.nodeConfig) {
        nodeData.nodeConfig = {} as any;
      }
      if (!nodeData.nodeConfig.extension) {
        nodeData.nodeConfig.extension = {} as any;
      }

      nodeData.nodeConfig.extension = {
        ...nodeData.nodeConfig.extension,
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
      };

      return nodeData;
    });
  }

  /**
   * 从画布提取边数据
   */
  private extractEdges(graph: Graph): EdgeData[] {
    const edges = graph.getEdges();

    return edges
      .map((edge) => {
        // X6 边的 source/target 可能是字符串 ID 或对象 { cell, port }
        const sourceData = edge.getSource();
        const targetData = edge.getTarget();

        let source: string;
        let target: string;
        let sourcePort: string | undefined;
        let targetPort: string | undefined;

        // 处理 source
        if (typeof sourceData === 'string') {
          source = sourceData;
        } else if (sourceData && typeof sourceData === 'object') {
          source = (sourceData as any).cell || '';
          sourcePort = (sourceData as any).port;
        } else {
          source = '';
        }

        // 处理 target
        if (typeof targetData === 'string') {
          target = targetData;
        } else if (targetData && typeof targetData === 'object') {
          target = (targetData as any).cell || '';
          targetPort = (targetData as any).port;
        } else {
          target = '';
        }

        // 备用方式获取端口
        if (!sourcePort) {
          sourcePort = edge.getSourcePortId() || undefined;
        }
        if (!targetPort) {
          targetPort = edge.getTargetPortId() || undefined;
        }

        return {
          source,
          target,
          sourcePort,
          targetPort,
        };
      })
      .filter((edge) => edge.source && edge.target); // 过滤无效边
  }

  // ==================== 连接关系计算 ====================

  /**
   * 从边数据计算所有节点的连接关系
   * 这是单点计算 nextNodeIds 的核心方法
   */
  private computeConnections(
    nodes: ChildNode[],
    edges: EdgeData[],
  ): ChildNode[] {
    // 创建节点映射 - 使用字符串 ID 以确保类型匹配
    const nodeMap = new Map<string, ChildNode>();
    nodes.forEach((node) => {
      nodeMap.set(String(node.id), cloneDeep(node));
    });

    // 清空所有节点的 nextNodeIds 和分支 nextNodeIds
    nodeMap.forEach((node) => {
      node.nextNodeIds = [];
      this.clearBranchNextNodeIds(node);
    });

    // 从边数据重建连接关系
    edges.forEach((edge) => {
      const sourceIdStr = String(edge.source);
      const targetId = Number(edge.target);
      const sourceNode = nodeMap.get(sourceIdStr);

      if (!sourceNode) {
        return;
      }

      const portInfo = this.parseSourcePort(edge.sourcePort, sourceNode);
      this.addConnectionToNode(sourceNode, targetId, portInfo);
    });

    return Array.from(nodeMap.values());
  }

  /**
   * 清空节点的分支 nextNodeIds
   */
  private clearBranchNextNodeIds(node: ChildNode): void {
    // 条件节点
    if (
      node.type === NodeTypeEnum.Condition &&
      node.nodeConfig?.conditionBranchConfigs
    ) {
      node.nodeConfig.conditionBranchConfigs.forEach((branch) => {
        branch.nextNodeIds = [];
      });
    }

    // 意图节点
    if (
      node.type === NodeTypeEnum.IntentRecognition &&
      node.nodeConfig?.intentConfigs
    ) {
      node.nodeConfig.intentConfigs.forEach((intent) => {
        intent.nextNodeIds = [];
      });
    }

    // 问答节点（选择题模式）
    if (
      node.type === NodeTypeEnum.QA &&
      node.nodeConfig?.answerType === AnswerTypeEnum.SELECT &&
      node.nodeConfig?.options
    ) {
      node.nodeConfig.options.forEach((option) => {
        option.nextNodeIds = [];
      });
    }

    // 异常处理
    if (node.nodeConfig?.exceptionHandleConfig) {
      node.nodeConfig.exceptionHandleConfig.exceptionHandleNodeIds = [];
    }
  }

  /**
   * 解析源端口类型
   */
  private parseSourcePort(
    sourcePort: string | undefined,
    sourceNode: ChildNode,
  ): { type: PortType; uuid?: string } {
    if (!sourcePort) {
      return { type: PortType.Normal };
    }

    // 异常端口
    if (sourcePort.includes('-exception-out')) {
      return { type: PortType.Exception };
    }

    // 循环节点
    if (sourceNode.type === NodeTypeEnum.Loop && sourcePort.includes('-in')) {
      return { type: PortType.Loop };
    }

    // 特殊分支节点
    if (
      sourceNode.type === NodeTypeEnum.Condition ||
      sourceNode.type === NodeTypeEnum.IntentRecognition ||
      (sourceNode.type === NodeTypeEnum.QA &&
        sourceNode.nodeConfig?.answerType === AnswerTypeEnum.SELECT)
    ) {
      const nodeIdStr = String(sourceNode.id);
      let uuid = sourcePort;

      if (sourcePort.startsWith(nodeIdStr + '-')) {
        uuid = sourcePort.substring(nodeIdStr.length + 1);
      }
      if (uuid.endsWith('-out')) {
        uuid = uuid.substring(0, uuid.length - 4);
      }

      if (sourceNode.type === NodeTypeEnum.Condition) {
        return { type: PortType.Condition, uuid };
      } else if (sourceNode.type === NodeTypeEnum.IntentRecognition) {
        return { type: PortType.Intent, uuid };
      } else {
        return { type: PortType.QAOption, uuid };
      }
    }

    return { type: PortType.Normal };
  }

  /**
   * 添加连接到节点
   * @returns 是否成功添加连接
   */
  private addConnectionToNode(
    sourceNode: ChildNode,
    targetId: number,
    portInfo: { type: PortType; uuid?: string },
  ): boolean {
    switch (portInfo.type) {
      case PortType.Condition: {
        const configs = sourceNode.nodeConfig?.conditionBranchConfigs;
        const branch = configs?.find((c) => c.uuid === portInfo.uuid);
        if (branch) {
          if (!branch.nextNodeIds) branch.nextNodeIds = [];
          if (!branch.nextNodeIds.includes(targetId)) {
            branch.nextNodeIds.push(targetId);
          }
          return true;
        }
        return false;
      }

      case PortType.Intent: {
        const configs = sourceNode.nodeConfig?.intentConfigs;
        const intent = configs?.find((c) => c.uuid === portInfo.uuid);
        if (intent) {
          if (!intent.nextNodeIds) intent.nextNodeIds = [];
          if (!intent.nextNodeIds.includes(targetId)) {
            intent.nextNodeIds.push(targetId);
          }
          return true;
        }
        return false;
      }

      case PortType.QAOption: {
        const options = sourceNode.nodeConfig?.options;
        const option = options?.find((o) => o.uuid === portInfo.uuid);
        if (option) {
          if (!option.nextNodeIds) option.nextNodeIds = [];
          if (!option.nextNodeIds.includes(targetId)) {
            option.nextNodeIds.push(targetId);
          }
          return true;
        }
        return false;
      }

      case PortType.Exception: {
        if (!sourceNode.nodeConfig) return false;
        if (!sourceNode.nodeConfig.exceptionHandleConfig) {
          sourceNode.nodeConfig.exceptionHandleConfig = {} as any;
        }
        const config = sourceNode.nodeConfig.exceptionHandleConfig!;
        if (!config.exceptionHandleNodeIds) {
          config.exceptionHandleNodeIds = [];
        }
        if (!config.exceptionHandleNodeIds.includes(targetId)) {
          config.exceptionHandleNodeIds.push(targetId);
        }
        return true;
      }

      case PortType.Normal:
      case PortType.Loop:
      default: {
        if (!sourceNode.nextNodeIds) {
          sourceNode.nextNodeIds = [];
        }
        if (!sourceNode.nextNodeIds.includes(targetId)) {
          sourceNode.nextNodeIds.push(targetId);
        }
        return true;
      }
    }
  }

  // ==================== 订阅机制 ====================

  /**
   * 订阅变更通知
   */
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  // ==================== 获取器 ====================

  /**
   * 获取工作流元数据
   */
  getMeta(): WorkflowMeta | null {
    return this.meta ? { ...this.meta } : null;
  }

  /**
   * 获取原始详情（用于回退）
   */
  getOriginalDetails(): IgetDetails | null {
    return this.originalDetails ? cloneDeep(this.originalDetails) : null;
  }
}

// 导出单例
export const workflowSaveService = new WorkflowSaveService();
export default WorkflowSaveService;
