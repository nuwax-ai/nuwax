/**
 * HumanInteraction 节点分支处理器
 *
 * 端口格式：
 * - ask 模式: {nodeId}-out（普通输出端口 group='out'，走 normal nextNodeIds）
 * - approve 模式:
 *   - 审批通过: {nodeId}-hitl-approve-out（group='special'）
 *   - 审批拒绝: {nodeId}-hitl-reject-out（group='special'）
 *
 * 数据语义：
 * - `approveNextNodeIds` / `rejectNextNodeIds` 均为 number[]（多目标数组）
 *   与 `RouteDecision` 端口的"允许多出边"语义一致
 * - ask 模式走普通 `nextNodeIds`，handler 不参与数据管理
 *
 * 端口 y 由 `branchPortY(i)` 计算（baseY=42, itemHeight=24, step=12）。
 */

import { NodeTypeEnum, HitlModeEnum } from '@/types/enums/common';
import { PortGroupEnum } from '@/types/enums/node';
import type { ChildNode } from '@/types/interfaces/graph';
import type {
  BranchNodeHandler,
  ParsedPort,
  PortGeneratorContext,
} from '../../extensions/types';
import { branchPortY } from './portLayout';
import { SpecialPortType } from '../../types/enums';

export const humanInteractionHandler: BranchNodeHandler = {
  nodeType: NodeTypeEnum.HumanInteraction,

  generatePorts(data: ChildNode, ctx: PortGeneratorContext) {
    const hitlMode = (data.nodeConfig as any)?.hitlMode || HitlModeEnum.Ask;

    const inputPorts = [
      ctx.generatePortConfig({ group: PortGroupEnum.in, idSuffix: 'in' }),
    ];

    if (hitlMode === HitlModeEnum.Approve) {
      const approveY = branchPortY(0);
      const rejectY = branchPortY(1);
      return {
        inputPorts,
        outputPorts: [
          ctx.generatePortConfig({
            group: PortGroupEnum.special,
            idSuffix: 'hitl-approve-out',
            yHeight: approveY.yHeight,
            offsetY: approveY.offsetY,
          }),
          ctx.generatePortConfig({
            group: PortGroupEnum.special,
            idSuffix: 'hitl-reject-out',
            yHeight: rejectY.yHeight,
            offsetY: rejectY.offsetY,
          }),
        ],
      };
    }

    return {
      inputPorts,
      outputPorts: [
        ctx.generatePortConfig({ group: PortGroupEnum.out, idSuffix: 'out' }),
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
    if (nc?.hitlMode !== HitlModeEnum.Approve) return null;

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
    return (node.nodeConfig as any)?.hitlMode === HitlModeEnum.Approve;
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
