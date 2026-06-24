/**
 * RouteDecision 节点分支处理器
 *
 * 路由决策：AI 决策走哪条分支
 *
 * 端口格式：
 * - 默认端口（无匹配路由时的 fallback）: {nodeId}-route-default-out
 * - 路由端口: {nodeId}-route-{routeUuid}-out（每条路由规则一个）
 *
 * 视觉对齐：default 端口圆点用 `ROUTE_DEFAULT_PORT_COLOR`（灰色），React 层
 * 不渲染 chip；route 端口由 `agentFlowPortChips` 渲染橙色 chip 显示 routeName。
 *
 * 端口 y 由 `branchPortY(i)` 计算。
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
  branchPortY,
  extractPortSuffix,
  ROUTE_DEFAULT_PORT_COLOR,
} from './portLayout';

export const routeDecisionHandler: BranchNodeHandler = {
  nodeType: NodeTypeEnum.RouteDecision,

  generatePorts(data: ChildNode, ctx: PortGeneratorContext) {
    const nc = data.nodeConfig as any;
    const routes: any[] = nc?.routes || [];
    const defaultIds: number[] = nc?.defaultNextNodeIds || [];

    const inputPorts = [
      ctx.generatePortConfig({ group: PortGroupEnum.in, idSuffix: 'in' }),
    ];

    const outputPorts = [];

    // 默认兜底端口：仅当 defaultNextNodeIds 有值时才生成
    if (defaultIds.length > 0) {
      const defaultY = branchPortY(outputPorts.length);
      outputPorts.push(
        ctx.generatePortConfig({
          group: PortGroupEnum.special,
          idSuffix: 'route-default-out',
          color: ROUTE_DEFAULT_PORT_COLOR,
          yHeight: defaultY.yHeight,
          offsetY: defaultY.offsetY,
        }),
      );
    }

    // 各路由端口
    routes.forEach((item: any) => {
      const uuid = item.uuid || `r${outputPorts.length}`;
      const y = branchPortY(outputPorts.length);
      outputPorts.push(
        ctx.generatePortConfig({
          group: PortGroupEnum.special,
          idSuffix: `route-${uuid}-out`,
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
