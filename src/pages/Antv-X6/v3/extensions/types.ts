/**
 * 分支节点处理器扩展类型
 *
 * 用于将 AgentFlow 等分支类型的节点处理逻辑从核心文件中解耦。
 * 每种节点类型实现 BranchNodeHandler 接口，通过 ExtensionRegistry 注册。
 */

import type { NodeTypeEnum } from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';
import type {
  outputOrInputPortConfig,
  PortConfig,
} from '@/types/interfaces/node';
import type { SpecialPortType } from '../types/enums';

/** 端口生成上下文：提供给扩展 handler 的工具函数 */
export interface PortGeneratorContext {
  generatePortConfig: (config: PortConfig) => outputOrInputPortConfig;
}

/** 解析端口的返回结果 */
export interface ParsedPort {
  type: SpecialPortType;
  uuid?: string;
}

/** 分支节点处理器 */
export interface BranchNodeHandler {
  /** 处理的节点类型 */
  nodeType: NodeTypeEnum;

  /** 生成输入/输出端口，返回 null 表示不处理 */
  generatePorts?(
    data: ChildNode,
    ctx: PortGeneratorContext,
  ): {
    inputPorts: outputOrInputPortConfig[];
    outputPorts: outputOrInputPortConfig[];
  } | null;

  /** 解析特殊分支端口，返回 null 表示非特殊端口 */
  parseSourcePort?(
    sourceNode: ChildNode,
    sourcePort: string,
  ): ParsedPort | null;

  /** 处理特殊端口连接/断开，返回 true 表示已处理 */
  updateConnection?(
    sourceNode: ChildNode,
    portInfo: ParsedPort,
    targetNodeId: number,
    action: 'add' | 'remove',
  ): boolean;

  /** 删除节点时清理对其他节点的分支引用 */
  cleanupNodeReferences?(node: ChildNode, deletedNodeId: number): void;

  /** syncFromGraph: 初始化分支 nextNodeIds 映射 */
  initBranchMap?(node: ChildNode): Map<string, number[]> | null;

  /** syncFromGraph: 从端口信息获取分支 key */
  getBranchKey?(portInfo: ParsedPort): string | undefined;

  /** syncFromGraph: 将分支数据写回节点配置 */
  mergeBranchData?(node: ChildNode, branchMap: Map<string, number[]>): void;

  /** 是否是特殊分支节点（nextNodeIds 不走普通路径） */
  isSpecialBranchNode?(node: ChildNode): boolean;

  /**
   * 从端口点击创建新节点时，更新源节点的分支配置。
   * 与 updateConnection 的区别：此方法支持替换（targetNode 非空时将旧 ID 替换为新 ID）。
   *
   * @param portId 完整端口 ID（含 nodeId 前缀和 -out 后缀）
   * @param newNodeId 新创建的节点 ID
   * @param targetNode 被替换的目标节点（无替换则为 undefined）
   * @returns 更新后的节点，null 表示不处理
   */
  handleSpecialNextIndex?(
    node: ChildNode,
    portId: string,
    newNodeId: number,
    targetNode?: ChildNode,
  ): ChildNode | null;
}
