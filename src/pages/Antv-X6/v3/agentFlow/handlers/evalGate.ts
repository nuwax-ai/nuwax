/**
 * EvalGate 节点分支处理器
 *
 * 端口格式：
 * - 通过端口: {nodeId}-eval-pass-out
 * - 失败端口: {nodeId}-eval-fail-{validatorUuid}-out（每个 validator 一个）
 *
 * 端口 y 公式与 `BRANCH_PORT_BASE_Y` / `BRANCH_PORT_ITEM_HEIGHT` 联动，
 * 改 `portLayout.ts` 的常量即可全 handler 同步更新。
 *
 * 数据语义：
 * - `onFail.targetNodeId` 为 scalar（单值），由 `updateConnection` 覆盖式写入；
 * - `mergeBranchData` 从 `branchMap.get('eval-fail-{uuid}')` 取 `[0]`。
 *   多个 fail 目标仅保留第一个，与文档"fail 单跳"语义一致。
 */

import { NodeTypeEnum } from '@/types/enums/common';
import { PortGroupEnum } from '@/types/enums/node';
import type { ChildNode } from '@/types/interfaces/graph';
import type {
  BranchNodeHandler,
  ParsedPort,
  PortGeneratorContext,
} from '../../extensions/types';
import {
  branchPortY,
  extractPortSuffix,
} from './portLayout';
import { SpecialPortType } from '../../types/enums';

export const evalGateHandler: BranchNodeHandler = {
  nodeType: NodeTypeEnum.EvalGate,

  generatePorts(data: ChildNode, ctx: PortGeneratorContext) {
    const validators = (data.nodeConfig as any)?.evalValidators || [];
    const inputPorts = [
      ctx.generatePortConfig({ group: PortGroupEnum.in, idSuffix: 'in' }),
    ];

    // 第 0 个 = pass
    const passY = branchPortY(0);
    const outputPorts = [
      ctx.generatePortConfig({
        group: PortGroupEnum.special,
        idSuffix: 'eval-pass-out',
        yHeight: passY.yHeight,
        offsetY: passY.offsetY,
      }),
    ];

    // 第 1..n = validators
    validators.forEach((item: any, index: number) => {
      const uuid = item.uuid || `v${index}`;
      const y = branchPortY(index + 1);
      outputPorts.push(
        ctx.generatePortConfig({
          group: PortGroupEnum.special,
          idSuffix: `eval-fail-${uuid}-out`,
          yHeight: y.yHeight,
          offsetY: y.offsetY,
        }),
      );
    });

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
      return { type: SpecialPortType.EvalGateFail, uuid };
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

    switch (portInfo.type) {
      case SpecialPortType.EvalGatePass: {
        let passIds: number[] =
          (sourceNode.nodeConfig as any).passNextNodeIds || [];
        if (action === 'add') {
          if (!passIds.includes(targetNodeId)) {
            passIds.push(targetNodeId);
          }
        } else {
          passIds = passIds.filter((id: number) => id !== targetNodeId);
        }
        (sourceNode.nodeConfig as any).passNextNodeIds = passIds;
        return true;
      }

      case SpecialPortType.EvalGateFail: {
        if (!portInfo.uuid) return false;
        const validators = (sourceNode.nodeConfig as any).evalValidators;
        const validator = validators?.find(
          (v: any) => v.uuid === portInfo.uuid,
        );
        if (!validator) return false;
        if (action === 'add') {
          validator.onFail = {
            ...validator.onFail,
            targetNodeId: targetNodeId,
          };
        } else {
          validator.onFail = { ...validator.onFail, targetNodeId: undefined };
        }
        return true;
      }

      default:
        return false;
    }
  },

  cleanupNodeReferences(node: ChildNode, deletedNodeId: number): void {
    const nc = node.nodeConfig as any;
    if (!nc) return;

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

    nc.passNextNodeIds = [];
    const validators = nc.evalValidators || [];
    validators.forEach((v: any) => {
      v.onFail = { ...v.onFail, targetNodeId: undefined };
    });
  },

  initBranchMap(node: ChildNode): Map<string, number[]> | null {
    const branchMap = new Map<string, number[]>();
    const nc = node.nodeConfig as any;

    branchMap.set('eval-pass', []);

    const validators = nc?.evalValidators || [];
    validators.forEach((v: any) => {
      const key = `eval-fail-${v.uuid}`;
      branchMap.set(key, []);
    });

    return branchMap;
  },

  getBranchKey(portInfo: ParsedPort): string | undefined {
    if (portInfo.type === SpecialPortType.EvalGatePass) {
      return 'eval-pass';
    }
    if (portInfo.type === SpecialPortType.EvalGateFail && portInfo.uuid) {
      return `eval-fail-${portInfo.uuid}`;
    }
    return undefined;
  },

  mergeBranchData(node: ChildNode, branchMap: Map<string, number[]>): void {
    const nc = node.nodeConfig as any;
    nc.passNextNodeIds = branchMap.get('eval-pass') || [];

    const validators = nc.evalValidators || [];
    validators.forEach((v: any) => {
      const failIds = branchMap.get(`eval-fail-${v.uuid}`) || [];
      v.onFail = { ...v.onFail, targetNodeId: failIds[0] };
    });
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

    if (suffix.startsWith('eval-fail-')) {
      const validatorUuid = suffix.substring('eval-fail-'.length);
      const validators = nodeConfig.evalValidators || [];
      nodeConfig.evalValidators = validators.map((v: any) => {
        if (v.uuid === validatorUuid) {
          if (targetNode) {
            return {
              ...v,
              onFail: {
                ...v.onFail,
                targetNodeId:
                  targetNode.id === newNodeId ? undefined : newNodeId,
              },
            };
          }
          return { ...v, onFail: { ...v.onFail, targetNodeId: newNodeId } };
        }
        return v;
      });
    } else if (suffix === 'eval-pass') {
      let passIds: number[] = nodeConfig.passNextNodeIds || [];
      if (targetNode) {
        passIds = passIds.map((item: number) =>
          item === targetNode.id ? newNodeId : item,
        );
      } else if (!passIds.includes(newNodeId)) {
        passIds = [...passIds, newNodeId];
      }
      nodeConfig.passNextNodeIds = passIds;
    }

    return { ...node, nodeConfig };
  },
};
