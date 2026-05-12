/**
 * HumanInteraction 节点分支处理器
 *
 * 端口格式：
 * - ask 模式: {nodeId}-out（普通输出端口，走 normal nextNodeIds）
 * - approve 模式:
 *   - 审批通过: {nodeId}-hitl-approve-out
 *   - 审批拒绝: {nodeId}-hitl-reject-out
 */

import { NodeTypeEnum } from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';
import type {
  BranchNodeHandler,
  ParsedPort,
  PortGeneratorContext,
} from '../../extensions/types';
import { SpecialPortType } from '../../types/enums';

export const humanInteractionHandler: BranchNodeHandler = {
  nodeType: NodeTypeEnum.HumanInteraction,

  generatePorts(data: ChildNode, ctx: PortGeneratorContext) {
    const hitlMode = (data.nodeConfig as any)?.hitlMode || 'ask';
    const itemHeight = 24;
    const step = 12;
    const baseY = 32; // DEFAULT_NODE_CONFIG_MAP.default.defaultHeight

    const inputPorts = [
      ctx.generatePortConfig({ group: 'in' as any, idSuffix: 'in' }),
    ];

    if (hitlMode === 'approve') {
      return {
        inputPorts,
        outputPorts: [
          ctx.generatePortConfig({
            group: 'special' as any,
            idSuffix: 'hitl-approve-out',
            yHeight: baseY + itemHeight - step,
            offsetY: baseY + itemHeight,
          }),
          ctx.generatePortConfig({
            group: 'special' as any,
            idSuffix: 'hitl-reject-out',
            yHeight: baseY + 2 * itemHeight - step,
            offsetY: baseY + 2 * itemHeight,
          }),
        ],
      };
    }

    return {
      inputPorts,
      outputPorts: [
        ctx.generatePortConfig({ group: 'out' as any, idSuffix: 'out' }),
      ],
    };
  },

  parseSourcePort(
    _sourceNode: ChildNode,
    sourcePort: string,
  ): ParsedPort | null {
    if (sourcePort.includes('-hitl-approve-out')) {
      return { type: SpecialPortType.HitlApprove };
    }
    if (sourcePort.includes('-hitl-reject-out')) {
      return { type: SpecialPortType.HitlReject };
    }
    return null;
  },

  updateConnection(
    sourceNode: ChildNode,
    portInfo: ParsedPort,
    targetNodeId: number,
    action: 'add' | 'remove',
  ): boolean {
    if (!sourceNode.nodeConfig) return false;

    const key =
      portInfo.type === SpecialPortType.HitlApprove
        ? 'approveNextNodeIds'
        : portInfo.type === SpecialPortType.HitlReject
        ? 'rejectNextNodeIds'
        : null;

    if (!key) return false;

    let ids: number[] = (sourceNode.nodeConfig as any)[key] || [];
    if (action === 'add') {
      if (!ids.includes(targetNodeId)) {
        ids.push(targetNodeId);
      }
    } else {
      ids = ids.filter((id: number) => id !== targetNodeId);
    }
    (sourceNode.nodeConfig as any)[key] = ids;
    return true;
  },

  cleanupNodeReferences(node: ChildNode, deletedNodeId: number): void {
    const nc = node.nodeConfig as any;
    if (!nc) return;

    ['approveNextNodeIds', 'rejectNextNodeIds'].forEach((key) => {
      if (nc[key]?.includes(deletedNodeId)) {
        nc[key] = nc[key].filter((id: number) => id !== deletedNodeId);
      }
    });
  },

  resetBranchData(node: ChildNode): void {
    const nc = node.nodeConfig as any;
    if (!nc) return;

    nc.approveNextNodeIds = [];
    nc.rejectNextNodeIds = [];
  },

  initBranchMap(node: ChildNode): Map<string, number[]> | null {
    const nc = node.nodeConfig as any;
    if (nc?.hitlMode !== 'approve') return null;

    const branchMap = new Map<string, number[]>();
    branchMap.set('hitl-approve', []);
    branchMap.set('hitl-reject', []);
    return branchMap;
  },

  getBranchKey(portInfo: ParsedPort): string | undefined {
    if (portInfo.type === SpecialPortType.HitlApprove) return 'hitl-approve';
    if (portInfo.type === SpecialPortType.HitlReject) return 'hitl-reject';
    return undefined;
  },

  mergeBranchData(node: ChildNode, branchMap: Map<string, number[]>): void {
    const nc = node.nodeConfig as any;
    nc.approveNextNodeIds = branchMap.get('hitl-approve') || [];
    nc.rejectNextNodeIds = branchMap.get('hitl-reject') || [];
  },

  isSpecialBranchNode(node: ChildNode): boolean {
    return (node.nodeConfig as any)?.hitlMode === 'approve';
  },

  handleSpecialNextIndex(
    node: ChildNode,
    portId: string,
    newNodeId: number,
    targetNode?: ChildNode,
  ): ChildNode | null {
    const nodeConfig = { ...node.nodeConfig } as any;
    // 从 portId 判断是 approve 还是 reject 端口
    const isApprove = portId.includes('-hitl-approve-');
    const isReject = portId.includes('-hitl-reject-');
    const key = isApprove
      ? 'approveNextNodeIds'
      : isReject
      ? 'rejectNextNodeIds'
      : null;
    if (!key) return null;

    let ids: number[] = nodeConfig[key] || [];
    if (targetNode) {
      ids = ids.map((item: number) =>
        item === targetNode.id ? newNodeId : item,
      );
    } else if (!ids.includes(newNodeId)) {
      ids = [...ids, newNodeId];
    }
    nodeConfig[key] = ids;
    return { ...node, nodeConfig };
  },
};
