/**
 * HumanInteraction 节点分支处理器
 *
 * v2 端口格式：
 * - approve 模式（动态分支）:
 *   - {nodeId}-hitl-{branchUuid}-out（每个 branch 一个端口）
 * - ask 模式:
 *   - text/form: {nodeId}-out（普通输出端口，走 normal nextNodeIds）
 *   - options: {nodeId}-hitl-option-{optionUuid}-out（每个 option 一个端口）
 *
 * 向后兼容：
 * - approve: branches[] 为空时回退到 approveNextNodeIds/rejectNextNodeIds
 * - ask: replyMode 为空时回退到 askConfig.answerType
 */

import {
  AnswerTypeEnum,
  HitlModeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import { PortGroupEnum } from '@/types/enums/node';
import type { ChildNode } from '@/types/interfaces/graph';
import type { BranchConfig } from '@/types/interfaces/node';
import type {
  BranchNodeHandler,
  ParsedPort,
  PortGeneratorContext,
} from '../../extensions/types';
import { SpecialPortType } from '../../types/enums';
import { branchPortY, extractPortSuffix } from './portLayout';

/** 从 nodeConfig 读取 approve branches[]，为空时从旧字段构建 */
function getApproveBranches(nc: any): BranchConfig[] {
  if (nc?.branches?.length) return nc.branches;
  // v1 回退
  return [
    {
      uuid: 'approve',
      name: '通过',
      desc: '',
      nextNodeIds: nc?.approveNextNodeIds || [],
    },
    {
      uuid: 'reject',
      name: '拒绝',
      desc: '',
      nextNodeIds: nc?.rejectNextNodeIds || [],
    },
  ];
}

/** 获取 ask 模式的 replyMode，回退到 answerType */
function getReplyMode(nc: any): 'text' | 'options' | 'form' {
  if (nc?.replyMode) return nc.replyMode;
  if (nc?.askConfig?.answerType === AnswerTypeEnum.SELECT) return 'options';
  return 'text';
}

export const humanInteractionHandler: BranchNodeHandler = {
  nodeType: NodeTypeEnum.HumanInteraction,

  generatePorts(data: ChildNode, ctx: PortGeneratorContext) {
    const nc = data.nodeConfig as any;
    const hitlMode = nc?.hitlMode || HitlModeEnum.Ask;
    const inputPorts = [
      ctx.generatePortConfig({ group: PortGroupEnum.in, idSuffix: 'in' }),
    ];

    if (hitlMode === HitlModeEnum.Approve) {
      // v2: 动态分支
      const branches = getApproveBranches(nc);
      const outputPorts = branches.map((b, i) => {
        const y = branchPortY(i);
        return ctx.generatePortConfig({
          group: PortGroupEnum.special,
          idSuffix: `hitl-${b.uuid}-out`,
          yHeight: y.yHeight,
          offsetY: y.offsetY,
        });
      });
      return { inputPorts, outputPorts };
    }

    // ask 模式
    const replyMode = getReplyMode(nc);
    if (replyMode === 'options') {
      // 每个 option 一个端口
      const options: any[] = nc?.askConfig?.options || [];
      if (options.length === 0) {
        return {
          inputPorts,
          outputPorts: [
            ctx.generatePortConfig({
              group: PortGroupEnum.out,
              idSuffix: 'out',
            }),
          ],
        };
      }
      const outputPorts = options.map((opt: any, i: number) => {
        const y = branchPortY(i);
        return ctx.generatePortConfig({
          group: PortGroupEnum.special,
          idSuffix: `hitl-option-${opt.uuid || `o${i}`}-out`,
          yHeight: y.yHeight,
          offsetY: y.offsetY,
        });
      });
      return { inputPorts, outputPorts };
    }

    // text / form: 单个 out 端口
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
    // v1 兼容
    if (sourcePort.includes('-hitl-approve-out')) {
      return { type: SpecialPortType.HitlBranch, uuid: 'approve' };
    }
    if (sourcePort.includes('-hitl-reject-out')) {
      return { type: SpecialPortType.HitlBranch, uuid: 'reject' };
    }
    // v2: hitl-option-{optionUuid}-out（option 前缀需先匹配，避免被分支正则吞掉）
    const optionMatch = sourcePort.match(/-hitl-option-(.+)-out$/);
    if (optionMatch) {
      return { type: SpecialPortType.HitlOption, uuid: optionMatch[1] };
    }
    // v2: hitl-{branchUuid}-out（排除 option 前缀已由上面处理）
    const hitlMatch = sourcePort.match(/-hitl-(.+)-out$/);
    if (hitlMatch) {
      return { type: SpecialPortType.HitlBranch, uuid: hitlMatch[1] };
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
    const nc = sourceNode.nodeConfig as any;
    const hitlMode = nc?.hitlMode || HitlModeEnum.Ask;

    if (hitlMode === HitlModeEnum.Approve) {
      if (portInfo.type === SpecialPortType.HitlBranch && portInfo.uuid) {
        if (!nc.branches) nc.branches = getApproveBranches(nc);
        const idx = nc.branches.findIndex(
          (b: BranchConfig) => b.uuid === portInfo.uuid,
        );
        if (idx < 0) return false;
        let ids: number[] = nc.branches[idx].nextNodeIds || [];
        if (action === 'add') {
          if (!ids.includes(targetNodeId)) ids.push(targetNodeId);
        } else {
          ids = ids.filter((id: number) => id !== targetNodeId);
        }
        nc.branches[idx] = { ...nc.branches[idx], nextNodeIds: ids };
        // 同步旧字段
        if (
          portInfo.uuid === 'approve' ||
          nc.branches[0]?.uuid === portInfo.uuid
        ) {
          (nc as any).approveNextNodeIds = ids;
        } else if (
          portInfo.uuid === 'reject' ||
          nc.branches[1]?.uuid === portInfo.uuid
        ) {
          (nc as any).rejectNextNodeIds = ids;
        }
        return true;
      }
      // v1 回退
      if (portInfo.type === SpecialPortType.HitlApprove) {
        return this.updateConnection!(
          sourceNode,
          { ...portInfo, type: SpecialPortType.HitlBranch, uuid: 'approve' },
          targetNodeId,
          action,
        );
      }
      if (portInfo.type === SpecialPortType.HitlReject) {
        return this.updateConnection!(
          sourceNode,
          { ...portInfo, type: SpecialPortType.HitlBranch, uuid: 'reject' },
          targetNodeId,
          action,
        );
      }
      return false;
    }

    // ask options
    if (portInfo.type === SpecialPortType.HitlOption && portInfo.uuid) {
      const options: any[] = nc?.askConfig?.options || [];
      const optIdx = options.findIndex((o: any) => o.uuid === portInfo.uuid);
      if (optIdx < 0) return false;
      let ids: number[] = options[optIdx].nextNodeIds || [];
      if (action === 'add') {
        if (!ids.includes(targetNodeId)) ids.push(targetNodeId);
      } else {
        ids = ids.filter((id: number) => id !== targetNodeId);
      }
      nc.askConfig.options[optIdx] = { ...options[optIdx], nextNodeIds: ids };
      return true;
    }

    return false;
  },

  cleanupNodeReferences(node: ChildNode, deletedNodeId: number): void {
    const nc = node.nodeConfig as any;
    if (!nc) return;
    const hitlMode = nc?.hitlMode || HitlModeEnum.Ask;

    if (hitlMode === HitlModeEnum.Approve) {
      // v2: branches
      if (nc.branches) {
        nc.branches = nc.branches.map((b: BranchConfig) => ({
          ...b,
          nextNodeIds:
            b.nextNodeIds?.filter((id: number) => id !== deletedNodeId) || [],
        }));
      }
      // v1 回退
      ['approveNextNodeIds', 'rejectNextNodeIds'].forEach((key) => {
        if (nc[key]?.includes(deletedNodeId)) {
          nc[key] = nc[key].filter((id: number) => id !== deletedNodeId);
        }
      });
    }

    // ask options
    if (hitlMode === HitlModeEnum.Ask && nc?.askConfig?.options) {
      nc.askConfig.options = nc.askConfig.options.map((o: any) => ({
        ...o,
        nextNodeIds:
          o.nextNodeIds?.filter((id: number) => id !== deletedNodeId) || [],
      }));
    }
  },

  resetBranchData(node: ChildNode): void {
    const nc = node.nodeConfig as any;
    if (!nc) return;
    const hitlMode = nc?.hitlMode || HitlModeEnum.Ask;

    if (hitlMode === HitlModeEnum.Approve) {
      if (nc.branches) {
        nc.branches = nc.branches.map((b: BranchConfig) => ({
          ...b,
          nextNodeIds: [],
        }));
      }
      nc.approveNextNodeIds = [];
      nc.rejectNextNodeIds = [];
    }

    if (hitlMode === HitlModeEnum.Ask && nc?.askConfig?.options) {
      nc.askConfig.options = nc.askConfig.options.map((o: any) => ({
        ...o,
        nextNodeIds: [],
      }));
    }
  },

  initBranchMap(node: ChildNode): Map<string, number[]> | null {
    const nc = node.nodeConfig as any;
    const hitlMode = nc?.hitlMode || HitlModeEnum.Ask;

    if (hitlMode === HitlModeEnum.Approve) {
      const branchMap = new Map<string, number[]>();
      if (nc?.branches?.length) {
        for (const b of nc.branches) {
          branchMap.set(`hitl-${b.uuid}`, b.nextNodeIds || []);
        }
      } else {
        // v1 回退：只建 key
        branchMap.set('hitl-approve', []);
        branchMap.set('hitl-reject', []);
      }
      return branchMap;
    }

    // ask options
    const replyMode = getReplyMode(nc);
    if (replyMode === 'options') {
      const branchMap = new Map<string, number[]>();
      const options: any[] = nc?.askConfig?.options || [];
      for (const o of options) {
        branchMap.set(`hitl-option-${o.uuid}`, o.nextNodeIds || []);
      }
      return branchMap;
    }

    return null;
  },

  getBranchKey(portInfo: ParsedPort): string | undefined {
    if (portInfo.type === SpecialPortType.HitlBranch && portInfo.uuid) {
      return `hitl-${portInfo.uuid}`;
    }
    if (portInfo.type === SpecialPortType.HitlOption && portInfo.uuid) {
      return `hitl-option-${portInfo.uuid}`;
    }
    // v1 兼容
    if (portInfo.type === SpecialPortType.HitlApprove) return 'hitl-approve';
    if (portInfo.type === SpecialPortType.HitlReject) return 'hitl-reject';
    return undefined;
  },

  mergeBranchData(node: ChildNode, branchMap: Map<string, number[]>): void {
    const nc = node.nodeConfig as any;
    const hitlMode = nc?.hitlMode || HitlModeEnum.Ask;

    if (hitlMode === HitlModeEnum.Approve) {
      if (!nc.branches) nc.branches = getApproveBranches(nc);
      nc.branches = nc.branches.map((b: BranchConfig) => {
        const ids = branchMap.get(`hitl-${b.uuid}`) || [];
        return { ...b, nextNodeIds: ids };
      });
      // 同步旧字段
      (nc as any).approveNextNodeIds = nc.branches[0]?.nextNodeIds || [];
      (nc as any).rejectNextNodeIds = nc.branches[1]?.nextNodeIds || [];
    }

    if (hitlMode === HitlModeEnum.Ask && nc?.askConfig?.options) {
      nc.askConfig.options = nc.askConfig.options.map((o: any) => {
        const ids = branchMap.get(`hitl-option-${o.uuid}`) || [];
        return { ...o, nextNodeIds: ids };
      });
    }
  },

  isSpecialBranchNode(node: ChildNode): boolean {
    const nc = node.nodeConfig as any;
    const hitlMode = nc?.hitlMode || HitlModeEnum.Ask;
    if (hitlMode === HitlModeEnum.Approve) return true;
    // ask(options) 也是分支节点
    if (hitlMode === HitlModeEnum.Ask && getReplyMode(nc) === 'options') {
      return true;
    }
    return false;
  },

  handleSpecialNextIndex(
    node: ChildNode,
    portId: string,
    newNodeId: number,
    targetNode?: ChildNode,
  ): ChildNode | null {
    const suffix = extractPortSuffix(node, portId);
    const nodeConfig = { ...node.nodeConfig } as any;
    const nc = node.nodeConfig as any;
    const hitlMode = nc?.hitlMode || HitlModeEnum.Ask;

    if (hitlMode === HitlModeEnum.Approve) {
      // hitl-{branchUuid} 或 v1 的 hitl-approve / hitl-reject
      const branchUuid = suffix.startsWith('hitl-')
        ? suffix.replace(/-out$/, '').substring('hitl-'.length)
        : null;
      if (!branchUuid) return null;

      if (!nodeConfig.branches)
        nodeConfig.branches = getApproveBranches(nodeConfig);
      nodeConfig.branches = nodeConfig.branches.map((b: BranchConfig) => {
        if (b.uuid === branchUuid) {
          let ids: number[] = b.nextNodeIds || [];
          if (targetNode) {
            ids = ids.map((item: number) =>
              item === targetNode.id ? newNodeId : item,
            );
          } else if (!ids.includes(newNodeId)) {
            ids = [...ids, newNodeId];
          }
          return { ...b, nextNodeIds: ids };
        }
        return b;
      });
      // 同步旧字段
      const approveBranch = nodeConfig.branches.find(
        (b: BranchConfig) =>
          b.uuid === 'approve' || b === nodeConfig.branches[0],
      );
      const rejectBranch = nodeConfig.branches.find(
        (b: BranchConfig) =>
          b.uuid === 'reject' || b === nodeConfig.branches[1],
      );
      if (approveBranch)
        (nodeConfig as any).approveNextNodeIds = approveBranch.nextNodeIds;
      if (rejectBranch)
        (nodeConfig as any).rejectNextNodeIds = rejectBranch.nextNodeIds;
      return { ...node, nodeConfig };
    }

    // ask options
    if (hitlMode === HitlModeEnum.Ask) {
      const optionMatch = suffix.match(/^hitl-option-(.+?)(?:-out)?$/);
      if (optionMatch) {
        const optionUuid = optionMatch[1];
        const options = [...(nodeConfig.askConfig?.options || [])];
        nodeConfig.askConfig = {
          ...nodeConfig.askConfig,
          options: options.map((o: any) => {
            if (o.uuid === optionUuid) {
              let ids: number[] = o.nextNodeIds || [];
              if (targetNode) {
                ids = ids.map((item: number) =>
                  item === targetNode.id ? newNodeId : item,
                );
              } else if (!ids.includes(newNodeId)) {
                ids = [...ids, newNodeId];
              }
              return { ...o, nextNodeIds: ids };
            }
            return o;
          }),
        };
        return { ...node, nodeConfig };
      }
    }

    return null;
  },
};
