/**
 * EvalGate 节点分支处理器
 *
 * v2 端口格式（branches[] 驱动）：
 * - 通过端口: {nodeId}-eval-pass-out  （branches[0]，固定）
 * - 分支端口: {nodeId}-eval-fail-{branchUuid}-out  （branches[1..N]，动态）
 *
 * 向后兼容：branches[] 为空时回退到 evalValidators[] + passNextNodeIds[]
 */

import { NodeTypeEnum } from '@/types/enums/common';
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

/** 从 nodeConfig 读取 branches[]，为空时从旧字段构建兼容结构 */
function getBranches(nc: any): BranchConfig[] {
  if (nc?.branches?.length) return nc.branches;
  // v1 回退：从 evalValidators + passNextNodeIds 构建
  const branches: BranchConfig[] = [];
  branches.push({
    uuid: 'pass',
    name: '通过',
    desc: '',
    nextNodeIds: nc?.passNextNodeIds || [],
  });
  const validators: any[] = nc?.evalValidators || [];
  validators.forEach((v, i) => {
    branches.push({
      uuid: v.uuid || `v${i}`,
      name: v.name || `Validator ${i + 1}`,
      desc: '',
      nextNodeIds: v.onFail?.targetNodeId ? [v.onFail.targetNodeId] : [],
    });
  });
  return branches;
}

export const evalGateHandler: BranchNodeHandler = {
  nodeType: NodeTypeEnum.EvalGate,

  generatePorts(data: ChildNode, ctx: PortGeneratorContext) {
    const nc = data.nodeConfig as any;
    const branches = getBranches(nc);
    const inputPorts = [
      ctx.generatePortConfig({ group: PortGroupEnum.in, idSuffix: 'in' }),
    ];

    // 第 0 个 = pass（固定）
    const passY = branchPortY(0);
    const outputPorts = [
      ctx.generatePortConfig({
        group: PortGroupEnum.special,
        idSuffix: 'eval-pass-out',
        yHeight: passY.yHeight,
        offsetY: passY.offsetY,
      }),
    ];

    // 第 1..N = fail 分支（动态）
    for (let i = 1; i < branches.length; i++) {
      const y = branchPortY(i);
      outputPorts.push(
        ctx.generatePortConfig({
          group: PortGroupEnum.special,
          idSuffix: `eval-fail-${branches[i].uuid}-out`,
          yHeight: y.yHeight,
          offsetY: y.offsetY,
        }),
      );
    }

    return { inputPorts, outputPorts };
  },

  parseSourcePort(
    sourceNode: ChildNode,
    sourcePort: string,
  ): ParsedPort | null {
    if (sourcePort.includes('-eval-pass-out')) {
      return { type: SpecialPortType.EvalGatePass };
    }
    if (sourcePort.includes('-eval-fail-')) {
      const nodeIdStr = String(sourceNode.id);
      let uuid = sourcePort;
      if (sourcePort.startsWith(nodeIdStr + '-')) {
        uuid = uuid.substring(nodeIdStr.length + 1);
      }
      uuid = uuid.replace(/^eval-fail-/, '').replace(/-out$/, '');
      // v2 使用 EvalGateBranch，回退识别 EvalGateFail
      return { type: SpecialPortType.EvalGateBranch, uuid };
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

    if (portInfo.type === SpecialPortType.EvalGatePass) {
      // branches[0] = pass
      if (!nc.branches) nc.branches = getBranches(nc);
      let ids: number[] = nc.branches[0]?.nextNodeIds || [];
      if (action === 'add') {
        if (!ids.includes(targetNodeId)) ids.push(targetNodeId);
      } else {
        ids = ids.filter((id: number) => id !== targetNodeId);
      }
      nc.branches[0] = { ...nc.branches[0], nextNodeIds: ids };
      // 同步旧字段
      (nc as any).passNextNodeIds = ids;
      return true;
    }

    if (
      (portInfo.type === SpecialPortType.EvalGateBranch ||
        portInfo.type === SpecialPortType.EvalGateFail) &&
      portInfo.uuid
    ) {
      // fail 分支：branches[1..N]
      if (!nc.branches) nc.branches = getBranches(nc);
      const branchIdx = nc.branches.findIndex(
        (b: BranchConfig, i: number) => i > 0 && b.uuid === portInfo.uuid,
      );
      if (branchIdx < 0) return false;
      let ids: number[] = nc.branches[branchIdx].nextNodeIds || [];
      if (action === 'add') {
        if (!ids.includes(targetNodeId)) ids.push(targetNodeId);
      } else {
        ids = ids.filter((id: number) => id !== targetNodeId);
      }
      nc.branches[branchIdx] = { ...nc.branches[branchIdx], nextNodeIds: ids };
      // 同步旧字段
      const validatorIdx = branchIdx - 1;
      if (nc.evalValidators?.[validatorIdx]) {
        nc.evalValidators[validatorIdx].onFail = {
          ...nc.evalValidators[validatorIdx].onFail,
          targetNodeId: ids[0],
        };
      }
      return true;
    }

    return false;
  },

  cleanupNodeReferences(node: ChildNode, deletedNodeId: number): void {
    const nc = node.nodeConfig as any;
    if (!nc) return;

    // v2: branches
    if (nc.branches) {
      nc.branches = nc.branches.map((b: BranchConfig) => ({
        ...b,
        nextNodeIds:
          b.nextNodeIds?.filter((id: number) => id !== deletedNodeId) || [],
      }));
    }
    // v1 回退
    if (nc.passNextNodeIds?.includes(deletedNodeId)) {
      nc.passNextNodeIds = nc.passNextNodeIds.filter(
        (id: number) => id !== deletedNodeId,
      );
    }
    if (nc.evalValidators) {
      nc.evalValidators.forEach((v: any) => {
        if (v.onFail?.targetNodeId === deletedNodeId) {
          v.onFail.targetNodeId = undefined;
        }
      });
    }
  },

  resetBranchData(node: ChildNode): void {
    const nc = node.nodeConfig as any;
    if (!nc) return;

    // v2: branches
    if (nc.branches) {
      nc.branches = nc.branches.map((b: BranchConfig) => ({
        ...b,
        nextNodeIds: [],
      }));
    }
    // v1 回退
    nc.passNextNodeIds = [];
    if (nc.evalValidators) {
      nc.evalValidators.forEach((v: any) => {
        v.onFail = { ...v.onFail, targetNodeId: undefined };
      });
    }
  },

  initBranchMap(node: ChildNode): Map<string, number[]> | null {
    const nc = node.nodeConfig as any;
    const branchMap = new Map<string, number[]>();

    // v2: branches 存在时读取实际 nextNodeIds
    if (nc?.branches?.length) {
      for (const b of nc.branches) {
        if (b === nc.branches[0]) {
          branchMap.set('eval-pass', b.nextNodeIds || []);
        } else {
          branchMap.set(`eval-fail-${b.uuid}`, b.nextNodeIds || []);
        }
      }
      return branchMap;
    }

    // v1 回退：只建 key，初始为空（syncFromGraph 会重填）
    branchMap.set('eval-pass', []);
    const validators = nc?.evalValidators || [];
    validators.forEach((v: any) => {
      branchMap.set(`eval-fail-${v.uuid}`, []);
    });

    return branchMap;
  },

  getBranchKey(portInfo: ParsedPort): string | undefined {
    if (portInfo.type === SpecialPortType.EvalGatePass) {
      return 'eval-pass';
    }
    if (
      (portInfo.type === SpecialPortType.EvalGateBranch ||
        portInfo.type === SpecialPortType.EvalGateFail) &&
      portInfo.uuid
    ) {
      return `eval-fail-${portInfo.uuid}`;
    }
    return undefined;
  },

  mergeBranchData(node: ChildNode, branchMap: Map<string, number[]>): void {
    const nc = node.nodeConfig as any;
    if (!nc.branches) nc.branches = getBranches(nc);

    // pass
    const passIds = branchMap.get('eval-pass') || [];
    nc.branches[0] = { ...nc.branches[0], nextNodeIds: passIds };
    (nc as any).passNextNodeIds = passIds;

    // fail branches
    for (let i = 1; i < nc.branches.length; i++) {
      const key = `eval-fail-${nc.branches[i].uuid}`;
      const ids = branchMap.get(key) || [];
      nc.branches[i] = { ...nc.branches[i], nextNodeIds: ids };
      // 同步旧字段
      const validatorIdx = i - 1;
      if (nc.evalValidators?.[validatorIdx]) {
        nc.evalValidators[validatorIdx].onFail = {
          ...nc.evalValidators[validatorIdx].onFail,
          targetNodeId: ids[0],
        };
      }
    }
  },

  isSpecialBranchNode(): boolean {
    return true;
  },

  handleSpecialNextIndex(
    node: ChildNode,
    portId: string,
    newNodeId: number,
    targetNode?: ChildNode,
  ): ChildNode | null {
    const suffix = extractPortSuffix(node, portId);
    const nodeConfig = { ...node.nodeConfig } as any;
    if (!nodeConfig.branches) nodeConfig.branches = getBranches(nodeConfig);

    if (suffix.startsWith('eval-fail-')) {
      const branchUuid = suffix.substring('eval-fail-'.length);
      nodeConfig.branches = nodeConfig.branches.map(
        (b: BranchConfig, i: number) => {
          if (i > 0 && b.uuid === branchUuid) {
            let ids: number[] = b.nextNodeIds || [];
            if (targetNode) {
              // 替换旧节点；若目标就是自己则清除
              if (targetNode.id === newNodeId) {
                ids = ids.filter((item: number) => item !== targetNode.id);
              } else {
                ids = ids.map((item: number) =>
                  item === targetNode.id ? newNodeId : item,
                );
              }
            } else if (!ids.includes(newNodeId)) {
              ids = [...ids, newNodeId];
            }
            return { ...b, nextNodeIds: ids };
          }
          return b;
        },
      );
      // 同步旧字段
      const validatorIdx =
        nodeConfig.branches.findIndex(
          (b: BranchConfig, i: number) => i > 0 && b.uuid === branchUuid,
        ) - 1;
      if (validatorIdx >= 0 && nodeConfig.evalValidators?.[validatorIdx]) {
        const ids = nodeConfig.branches[validatorIdx + 1].nextNodeIds;
        nodeConfig.evalValidators[validatorIdx].onFail = {
          ...nodeConfig.evalValidators[validatorIdx].onFail,
          targetNodeId: ids?.[0],
        };
      }
    } else if (suffix === 'eval-pass') {
      let ids: number[] = nodeConfig.branches[0]?.nextNodeIds || [];
      if (targetNode) {
        ids = ids.map((item: number) =>
          item === targetNode.id ? newNodeId : item,
        );
      } else if (!ids.includes(newNodeId)) {
        ids = [...ids, newNodeId];
      }
      nodeConfig.branches[0] = { ...nodeConfig.branches[0], nextNodeIds: ids };
      (nodeConfig as any).passNextNodeIds = ids;
    }

    return { ...node, nodeConfig };
  },
};
