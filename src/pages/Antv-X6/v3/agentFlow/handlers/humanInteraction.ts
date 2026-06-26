/**
 * HumanInteraction 节点分支处理器（ask 模式）
 *
 * 端口格式（ask 模式）：
 *   - text/form: {nodeId}-out（普通输出端口，走 normal nextNodeIds）
 *   - options: {nodeId}-hitl-option-{optionUuid}-out（每个 option 一个端口）
 *
 * nodeConfig 使用扁平 QA 字段（options / answerType），兼容历史 askConfig。
 */

import { NodeTypeEnum } from '@/types/enums/common';
import { PortGroupEnum } from '@/types/enums/node';
import type { ChildNode } from '@/types/interfaces/graph';
import type {
  BranchNodeHandler,
  ParsedPort,
  PortGeneratorContext,
} from '../../extensions/types';
import { SpecialPortType } from '../../types/enums';
import {
  getHitlOptions,
  isHitlOptionsBranchMode,
} from '../adapters/qaConfigAdapter';
import { branchPortY, extractPortSuffix } from './portLayout';

export const humanInteractionHandler: BranchNodeHandler = {
  nodeType: NodeTypeEnum.HumanInteraction,

  generatePorts(data: ChildNode, ctx: PortGeneratorContext) {
    const nc = data.nodeConfig as any;
    const inputPorts = [
      ctx.generatePortConfig({ group: PortGroupEnum.in, idSuffix: 'in' }),
    ];

    const isOptionsBranch = isHitlOptionsBranchMode(nc);
    if (isOptionsBranch) {
      const options = getHitlOptions(nc);
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
      // 节点带描述行时，分支端口整体随条目下移 descHeight，保持圆点与条目对齐
      const branchOpts = { hasDescription: !!(data as any).description };
      const outputPorts = options.map((opt: any, i: number) => {
        const y = branchPortY(i, branchOpts);
        return ctx.generatePortConfig({
          group: PortGroupEnum.special,
          idSuffix: `hitl-option-${opt.uuid || `o${i}`}-out`,
          yHeight: y.yHeight,
          offsetY: y.offsetY,
        });
      });
      return { inputPorts, outputPorts };
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
    const optionMatch = sourcePort.match(/-hitl-option-(.+)-out$/);
    if (optionMatch) {
      return { type: SpecialPortType.HitlOption, uuid: optionMatch[1] };
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

    if (portInfo.type === SpecialPortType.HitlOption && portInfo.uuid) {
      const options = [...getHitlOptions(nc)];
      const optIdx = options.findIndex((o: any) => o.uuid === portInfo.uuid);
      if (optIdx < 0) return false;
      let ids: number[] = options[optIdx].nextNodeIds || [];
      if (action === 'add') {
        if (!ids.includes(targetNodeId)) ids.push(targetNodeId);
      } else {
        ids = ids.filter((id: number) => id !== targetNodeId);
      }
      options[optIdx] = { ...options[optIdx], nextNodeIds: ids };
      nc.options = options;
      return true;
    }

    return false;
  },

  cleanupNodeReferences(node: ChildNode, deletedNodeId: number): void {
    const nc = node.nodeConfig as any;
    if (!nc) return;

    const options = getHitlOptions(nc);
    if (options.length) {
      nc.options = options.map((o: any) => ({
        ...o,
        nextNodeIds:
          o.nextNodeIds?.filter((id: number) => id !== deletedNodeId) || [],
      }));
    }
  },

  resetBranchData(node: ChildNode): void {
    const nc = node.nodeConfig as any;
    if (!nc) return;

    const options = getHitlOptions(nc);
    if (options.length) {
      nc.options = options.map((o: any) => ({
        ...o,
        nextNodeIds: [],
      }));
    }
  },

  initBranchMap(node: ChildNode): Map<string, number[]> | null {
    const nc = node.nodeConfig as any;
    const isOptionsBranch = isHitlOptionsBranchMode(nc);
    if (isOptionsBranch) {
      const branchMap = new Map<string, number[]>();
      const options = getHitlOptions(nc);
      for (const o of options) {
        branchMap.set(`hitl-option-${o.uuid}`, o.nextNodeIds || []);
      }
      return branchMap;
    }
    return null;
  },

  getBranchKey(portInfo: ParsedPort): string | undefined {
    if (portInfo.type === SpecialPortType.HitlOption && portInfo.uuid) {
      return `hitl-option-${portInfo.uuid}`;
    }
    return undefined;
  },

  mergeBranchData(node: ChildNode, branchMap: Map<string, number[]>): void {
    const nc = node.nodeConfig as any;
    const options = getHitlOptions(nc);
    if (options.length) {
      nc.options = options.map((o: any) => {
        const ids = branchMap.get(`hitl-option-${o.uuid}`) || [];
        return { ...o, nextNodeIds: ids };
      });
    }
  },

  isSpecialBranchNode(node: ChildNode): boolean {
    return isHitlOptionsBranchMode(node.nodeConfig as any);
  },

  handleSpecialNextIndex(
    node: ChildNode,
    portId: string,
    newNodeId: number,
    targetNode?: ChildNode,
  ): ChildNode | null {
    const suffix = extractPortSuffix(node, portId);
    const nodeConfig = { ...node.nodeConfig } as any;

    const optionMatch = suffix.match(/^hitl-option-(.+?)(?:-out)?$/);
    if (optionMatch) {
      const optionUuid = optionMatch[1];
      const options = [...getHitlOptions(nodeConfig)];
      nodeConfig.options = options.map((o: any) => {
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
      });
      return { ...node, nodeConfig };
    }

    return null;
  },
};
