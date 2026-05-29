/**
 * RouteDecision 节点分支处理器
 *
 * 路由决策：AI 决策走哪条分支
 *
 * 端口格式：
 * - 默认端口（无匹配路由时的 fallback）: {nodeId}-route-default-out
 * - 路由端口: {nodeId}-route-{routeUuid}-out（每条路由规则一个）
 */

import { NodeTypeEnum } from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';
import type {
  BranchNodeHandler,
  ParsedPort,
  PortGeneratorContext,
} from '../../extensions/types';
import { SpecialPortType } from '../../types/enums';

/** 从完整 portId 中提取后缀（去掉 nodeId 前缀和 -out 后缀） */
function extractPortSuffix(node: ChildNode, portId: string): string {
  const nodeIdStr = String(node.id);
  let suffix = portId;
  if (portId.startsWith(nodeIdStr + '-')) {
    suffix = portId.substring(nodeIdStr.length + 1);
  }
  if (suffix.endsWith('-out')) {
    suffix = suffix.substring(0, suffix.length - 4);
  }
  return suffix;
}

export const routeDecisionHandler: BranchNodeHandler = {
  nodeType: NodeTypeEnum.RouteDecision,

  generatePorts(data: ChildNode, ctx: PortGeneratorContext) {
    const routes = (data.nodeConfig as any)?.routes || [];
    const itemHeight = 24;
    const step = 12;
    // baseY 留空间给 extraPrompt 等配置项
    const baseY = 42;

    const inputPorts = [
      ctx.generatePortConfig({ group: 'in' as any, idSuffix: 'in' }),
    ];

    // 默认端口（fallback，无路由匹配时走此端口）
    const outputPorts = [
      ctx.generatePortConfig({
        group: 'special' as any,
        idSuffix: 'route-default-out',
        yHeight: baseY,
        offsetY: baseY + itemHeight - step,
      }),
    ];

    // 每条路由规则一个输出端口
    routes.forEach((item: any, index: number) => {
      const uuid = item.uuid || `r${index}`;
      outputPorts.push(
        ctx.generatePortConfig({
          group: 'special' as any,
          idSuffix: `route-${uuid}-out`,
          yHeight: baseY + (index + 1) * itemHeight - step,
          offsetY: baseY + (index + 1) * itemHeight,
        }),
      );
    });

    return { inputPorts, outputPorts };
  },

  parseSourcePort(
    sourceNode: ChildNode,
    sourcePort: string,
  ): ParsedPort | null {
    if (sourcePort.includes('-route-default-out')) {
      return { type: SpecialPortType.RouteDecisionDefault };
    }
    if (
      sourcePort.includes('-route-') &&
      !sourcePort.includes('-route-default-')
    ) {
      const nodeIdStr = String(sourceNode.id);
      let uuid = sourcePort;
      if (sourcePort.startsWith(nodeIdStr + '-')) {
        uuid = uuid.substring(nodeIdStr.length + 1);
      }
      uuid = uuid.replace(/^route-/, '').replace(/-out$/, '');
      return { type: SpecialPortType.RouteDecisionRoute, uuid };
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
      case SpecialPortType.RouteDecisionDefault: {
        let defaultIds: number[] =
          (sourceNode.nodeConfig as any).defaultNextNodeIds || [];
        if (action === 'add') {
          if (!defaultIds.includes(targetNodeId)) {
            defaultIds.push(targetNodeId);
          }
        } else {
          defaultIds = defaultIds.filter((id: number) => id !== targetNodeId);
        }
        (sourceNode.nodeConfig as any).defaultNextNodeIds = defaultIds;
        return true;
      }

      case SpecialPortType.RouteDecisionRoute: {
        if (!portInfo.uuid) return false;
        const routes = (sourceNode.nodeConfig as any).routes;
        const route = routes?.find((r: any) => r.uuid === portInfo.uuid);
        if (!route) return false;
        if (action === 'add') {
          let ids: number[] = route.nextNodeIds || [];
          if (!ids.includes(targetNodeId)) {
            ids.push(targetNodeId);
          }
          route.nextNodeIds = ids;
        } else {
          route.nextNodeIds = (route.nextNodeIds || []).filter(
            (id: number) => id !== targetNodeId,
          );
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

    if (nc.defaultNextNodeIds?.includes(deletedNodeId)) {
      nc.defaultNextNodeIds = nc.defaultNextNodeIds.filter(
        (id: number) => id !== deletedNodeId,
      );
    }

    if (nc.routes) {
      nc.routes.forEach((r: any) => {
        if (r.nextNodeIds?.includes(deletedNodeId)) {
          r.nextNodeIds = r.nextNodeIds.filter(
            (id: number) => id !== deletedNodeId,
          );
        }
      });
    }
  },

  resetBranchData(node: ChildNode): void {
    const nc = node.nodeConfig as any;
    if (!nc) return;

    nc.defaultNextNodeIds = [];
    const routes = nc.routes || [];
    routes.forEach((r: any) => {
      r.nextNodeIds = [];
    });
  },

  initBranchMap(node: ChildNode): Map<string, number[]> | null {
    const branchMap = new Map<string, number[]>();
    const nc = node.nodeConfig as any;

    branchMap.set('route-default', []);

    const routes = nc?.routes || [];
    routes.forEach((r: any) => {
      const key = `route-${r.uuid}`;
      branchMap.set(key, []);
    });

    return branchMap;
  },

  getBranchKey(portInfo: ParsedPort): string | undefined {
    if (portInfo.type === SpecialPortType.RouteDecisionDefault) {
      return 'route-default';
    }
    if (portInfo.type === SpecialPortType.RouteDecisionRoute && portInfo.uuid) {
      return `route-${portInfo.uuid}`;
    }
    return undefined;
  },

  mergeBranchData(node: ChildNode, branchMap: Map<string, number[]>): void {
    const nc = node.nodeConfig as any;
    nc.defaultNextNodeIds = branchMap.get('route-default') || [];

    const routes = nc.routes || [];
    routes.forEach((r: any) => {
      const ids = branchMap.get(`route-${r.uuid}`) || [];
      r.nextNodeIds = ids;
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

    if (suffix === 'route-default') {
      let defaultIds: number[] = nodeConfig.defaultNextNodeIds || [];
      if (targetNode) {
        defaultIds = defaultIds.map((item: number) =>
          item === targetNode.id ? newNodeId : item,
        );
      } else if (!defaultIds.includes(newNodeId)) {
        defaultIds = [...defaultIds, newNodeId];
      }
      nodeConfig.defaultNextNodeIds = defaultIds;
    } else if (suffix.startsWith('route-')) {
      const routeUuid = suffix.substring('route-'.length);
      const routes = nodeConfig.routes || [];
      nodeConfig.routes = routes.map((r: any) => {
        if (r.uuid === routeUuid) {
          let ids: number[] = r.nextNodeIds || [];
          if (targetNode) {
            ids = ids.map((item: number) =>
              item === targetNode.id ? newNodeId : item,
            );
          } else if (!ids.includes(newNodeId)) {
            ids = [...ids, newNodeId];
          }
          return { ...r, nextNodeIds: ids };
        }
        return r;
      });
    }

    return { ...node, nodeConfig };
  },
};
