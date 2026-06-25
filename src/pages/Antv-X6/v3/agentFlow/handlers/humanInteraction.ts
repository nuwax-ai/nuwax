/**
 * HumanInteraction 节点分支处理器（ask 模式）
 *
 * 端口格式（ask 模式）：
 *   - text/form: {nodeId}-out（普通输出端口，走 normal nextNodeIds）
 *   - options: {nodeId}-hitl-option-{optionUuid}-out（每个 option 一个端口）
 *
 * 向后兼容：replyMode 为空时回退到 askConfig.answerType。
 */

import { AnswerTypeEnum, NodeTypeEnum } from '@/types/enums/common';
import { PortGroupEnum } from '@/types/enums/node';
import type { ChildNode } from '@/types/interfaces/graph';
import type {
  BranchNodeHandler,
  ParsedPort,
  PortGeneratorContext,
} from '../../extensions/types';
import { SpecialPortType } from '../../types/enums';
import { branchPortY, extractPortSuffix } from './portLayout';

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
    const inputPorts = [
      ctx.generatePortConfig({ group: PortGroupEnum.in, idSuffix: 'in' }),
    ];

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
    // hitl-option-{optionUuid}-out（ask 模式选项端口）
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

    // ask options
    if (nc?.askConfig?.options) {
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

    if (nc?.askConfig?.options) {
      nc.askConfig.options = nc.askConfig.options.map((o: any) => ({
        ...o,
        nextNodeIds: [],
      }));
    }
  },

  initBranchMap(node: ChildNode): Map<string, number[]> | null {
    const nc = node.nodeConfig as any;

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
    if (portInfo.type === SpecialPortType.HitlOption && portInfo.uuid) {
      return `hitl-option-${portInfo.uuid}`;
    }
    return undefined;
  },

  mergeBranchData(node: ChildNode, branchMap: Map<string, number[]>): void {
    const nc = node.nodeConfig as any;

    if (nc?.askConfig?.options) {
      nc.askConfig.options = nc.askConfig.options.map((o: any) => {
        const ids = branchMap.get(`hitl-option-${o.uuid}`) || [];
        return { ...o, nextNodeIds: ids };
      });
    }
  },

  isSpecialBranchNode(node: ChildNode): boolean {
    const nc = node.nodeConfig as any;
    // ask(options) 是分支节点
    return getReplyMode(nc) === 'options';
  },

  handleSpecialNextIndex(
    node: ChildNode,
    portId: string,
    newNodeId: number,
    targetNode?: ChildNode,
  ): ChildNode | null {
    const suffix = extractPortSuffix(node, portId);
    const nodeConfig = { ...node.nodeConfig } as any;

    // ask options
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

    return null;
  },
};
