/**
 * RouteDecision 分支处理器单元测试
 *
 * 覆盖与 evalGate 镜像：
 * - generatePorts：default + N routes；空 routes 只有 default
 * - parseSourcePort：default、route uuid 提取、防 `-default-` 子串误判
 * - updateConnection：add/remove、未知 uuid 返回 false
 * - cleanupNodeReferences：从 defaultNextNodeIds + routes[i].nextNodeIds 清掉
 * - initBranchMap / mergeBranchData / handleSpecialNextIndex
 * - isSpecialBranchNode
 */

import { NodeTypeEnum } from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';
import type { PortConfig } from '@/types/interfaces/node';
import { describe, expect, it } from 'vitest';
import { SpecialPortType } from '../../types/enums';
import { routeDecisionHandler } from '../handlers/routeDecision';

const createRouteNode = (overrides: Partial<ChildNode> = {}): ChildNode => ({
  id: 50,
  type: NodeTypeEnum.RouteDecision,
  name: 'RouteDecision',
  description: '',
  workflowId: 1,
  shape: 'custom-react' as any,
  icon: '',
  nextNodeIds: [],
  nodeConfig: {
    defaultNextNodeIds: [],
    routes: [
      {
        uuid: 'r1-uuid',
        routeName: '简单问题',
        description: '简单问题',
        nextNodeIds: [],
      },
      {
        uuid: 'r2-uuid',
        routeName: '复杂问题',
        description: '复杂问题',
        nextNodeIds: [],
      },
    ],
  },
  ...overrides,
});

const mockGeneratePortConfig = (config: PortConfig) => ({
  id: `test-${config.idSuffix}`,
  group: config.group,
  color: config.color,
  zIndex: 99,
  magnet: true,
  args: {
    x: config.xWidth ?? 200,
    y: config.yHeight ?? 16,
    offsetY: config.offsetY ?? 32,
    offsetX: config.offsetX ?? (config.idSuffix === 'in' ? 0 : 200),
  },
});

const ctx = { generatePortConfig: mockGeneratePortConfig };

describe('RouteDecision Handler', () => {
  describe('generatePorts', () => {
    it('should generate default + N route ports', () => {
      const node = createRouteNode();
      const result = routeDecisionHandler.generatePorts!(node, ctx);

      expect(result).not.toBeNull();
      expect(result!.inputPorts).toHaveLength(1);
      // 1 default + 2 routes = 3
      expect(result!.outputPorts).toHaveLength(3);
      expect(result!.outputPorts[0].id).toContain('route-default-out');
      expect(result!.outputPorts[1].id).toContain('route-r1-uuid-out');
      expect(result!.outputPorts[2].id).toContain('route-r2-uuid-out');
    });

    it('should generate only default port when routes is empty', () => {
      const node = createRouteNode({
        nodeConfig: { defaultNextNodeIds: [], routes: [] } as any,
      });
      const result = routeDecisionHandler.generatePorts!(node, ctx);
      expect(result!.outputPorts).toHaveLength(1);
      expect(result!.outputPorts[0].id).toContain('route-default-out');
    });

    it('should use fallback uuid `r{index}` when route has no uuid', () => {
      const node = createRouteNode({
        nodeConfig: {
          defaultNextNodeIds: [],
          routes: [{ routeName: 'a' }, { routeName: 'b' }],
        } as any,
      });
      const result = routeDecisionHandler.generatePorts!(node, ctx);
      expect(result!.outputPorts[1].id).toContain('route-r0-out');
      expect(result!.outputPorts[2].id).toContain('route-r1-out');
    });

    it('should set ROUTE_DEFAULT_PORT_COLOR for default port', () => {
      const node = createRouteNode();
      const result = routeDecisionHandler.generatePorts!(node, ctx);
      expect(result!.outputPorts[0].color).toBe('#bfbfbf');
    });
  });

  describe('parseSourcePort', () => {
    it('should detect default port', () => {
      const node = createRouteNode();
      const result = routeDecisionHandler.parseSourcePort!(
        node,
        '50-route-default-out',
      );
      expect(result).toEqual({ type: SpecialPortType.RouteDecisionDefault });
    });

    it('should extract route uuid', () => {
      const node = createRouteNode();
      const result = routeDecisionHandler.parseSourcePort!(
        node,
        '50-route-r1-uuid-out',
      );
      expect(result).toEqual({
        type: SpecialPortType.RouteDecisionRoute,
        uuid: 'r1-uuid',
      });
    });

    /**
     * 已知行为：parseSourcePort 用 `includes('-route-default-')` 防御性
     * 排除（避免 `route-default-fallback-out` 这类 uuid 被误判为 Default）。
     * 副作用：此类 uuid 暂时返回 null，调用方按"未知端口"处理。
     */
    it('should return null for route uuid that contains "default" substring (defensive check)', () => {
      const node = createRouteNode();
      const result = routeDecisionHandler.parseSourcePort!(
        node,
        '50-route-default-fallback-out',
      );
      expect(result).toBeNull();
    });

    it('should return null for non-matching port', () => {
      const node = createRouteNode();
      const result = routeDecisionHandler.parseSourcePort!(node, '50-out');
      expect(result).toBeNull();
    });
  });

  describe('updateConnection', () => {
    it('should add/remove to defaultNextNodeIds', () => {
      const node = createRouteNode();
      const ok1 = routeDecisionHandler.updateConnection!(
        node,
        { type: SpecialPortType.RouteDecisionDefault },
        100,
        'add',
      );
      expect(ok1).toBe(true);
      expect((node.nodeConfig as any).defaultNextNodeIds).toEqual([100]);

      routeDecisionHandler.updateConnection!(
        node,
        { type: SpecialPortType.RouteDecisionDefault },
        100,
        'remove',
      );
      expect((node.nodeConfig as any).defaultNextNodeIds).toEqual([]);
    });

    it('should add/remove to a specific route.nextNodeIds', () => {
      const node = createRouteNode();
      const ok1 = routeDecisionHandler.updateConnection!(
        node,
        { type: SpecialPortType.RouteDecisionRoute, uuid: 'r1-uuid' },
        200,
        'add',
      );
      expect(ok1).toBe(true);
      expect((node.nodeConfig as any).routes[0].nextNodeIds).toEqual([200]);

      routeDecisionHandler.updateConnection!(
        node,
        { type: SpecialPortType.RouteDecisionRoute, uuid: 'r1-uuid' },
        200,
        'remove',
      );
      expect((node.nodeConfig as any).routes[0].nextNodeIds).toEqual([]);
      // 不影响其他 route
      expect((node.nodeConfig as any).routes[1].nextNodeIds).toEqual([]);
    });

    it('should return false for unknown route uuid', () => {
      const node = createRouteNode();
      const ok = routeDecisionHandler.updateConnection!(
        node,
        { type: SpecialPortType.RouteDecisionRoute, uuid: 'unknown' },
        1,
        'add',
      );
      expect(ok).toBe(false);
    });

    it('should return false for unknown portInfo type', () => {
      const node = createRouteNode();
      const ok = routeDecisionHandler.updateConnection!(
        node,
        { type: 'SomethingElse' as any },
        1,
        'add',
      );
      expect(ok).toBe(false);
    });
  });

  describe('cleanupNodeReferences', () => {
    it('should remove deleted id from default + each route', () => {
      const node = createRouteNode();
      (node.nodeConfig as any).defaultNextNodeIds = [10, 11];
      (node.nodeConfig as any).routes[0].nextNodeIds = [10, 12];
      (node.nodeConfig as any).routes[1].nextNodeIds = [10];

      routeDecisionHandler.cleanupNodeReferences!(node, 10);

      expect((node.nodeConfig as any).defaultNextNodeIds).toEqual([11]);
      expect((node.nodeConfig as any).routes[0].nextNodeIds).toEqual([12]);
      expect((node.nodeConfig as any).routes[1].nextNodeIds).toEqual([]);
    });
  });

  describe('initBranchMap', () => {
    it('should produce default + each route as empty array', () => {
      const node = createRouteNode();
      const map = routeDecisionHandler.initBranchMap!(node);
      expect(map).not.toBeNull();
      expect(Array.from(map!.keys()).sort()).toEqual([
        'route-default',
        'route-r1-uuid',
        'route-r2-uuid',
      ]);
      for (const arr of map!.values()) {
        expect(arr).toEqual([]);
      }
    });
  });

  describe('mergeBranchData', () => {
    it('should write defaultNextNodeIds and each route.nextNodeIds', () => {
      const node = createRouteNode();
      const map = new Map<string, number[]>();
      map.set('route-default', [5, 6]);
      map.set('route-r1-uuid', [10]);
      map.set('route-r2-uuid', []);

      routeDecisionHandler.mergeBranchData!(node, map);

      expect((node.nodeConfig as any).defaultNextNodeIds).toEqual([5, 6]);
      expect((node.nodeConfig as any).routes[0].nextNodeIds).toEqual([10]);
      expect((node.nodeConfig as any).routes[1].nextNodeIds).toEqual([]);
    });
  });

  describe('getBranchKey', () => {
    it('default type returns route-default', () => {
      expect(
        routeDecisionHandler.getBranchKey!({
          type: SpecialPortType.RouteDecisionDefault,
        }),
      ).toBe('route-default');
    });

    it('route type returns route-{uuid}', () => {
      expect(
        routeDecisionHandler.getBranchKey!({
          type: SpecialPortType.RouteDecisionRoute,
          uuid: 'r1-uuid',
        }),
      ).toBe('route-r1-uuid');
    });

    it('returns undefined for unknown type', () => {
      expect(
        routeDecisionHandler.getBranchKey!({ type: 'X' as any }),
      ).toBeUndefined();
    });
  });

  describe('isSpecialBranchNode', () => {
    it('should always return true', () => {
      expect(routeDecisionHandler.isSpecialBranchNode!(createRouteNode())).toBe(
        true,
      );
    });
  });

  describe('handleSpecialNextIndex', () => {
    it('should add to defaultNextNodeIds when port is route-default', () => {
      const node = createRouteNode();
      const result = routeDecisionHandler.handleSpecialNextIndex!(
        node,
        '50-route-default-out',
        88,
      );
      expect((result!.nodeConfig as any).defaultNextNodeIds).toEqual([88]);
    });

    it('should add to specific route nextNodeIds', () => {
      const node = createRouteNode();
      const result = routeDecisionHandler.handleSpecialNextIndex!(
        node,
        '50-route-r2-uuid-out',
        99,
      );
      expect((result!.nodeConfig as any).routes[1].nextNodeIds).toEqual([99]);
    });

    it('should return node unchanged for unknown port (no special branch match)', () => {
      const node = createRouteNode();
      const before = JSON.stringify(node.nodeConfig);
      const result = routeDecisionHandler.handleSpecialNextIndex!(
        node,
        '50-unknown-out',
        1,
      );
      // 当前实现：未命中 default / route- 分支时返回原 node（无变更）
      expect(result).not.toBeNull();
      expect(JSON.stringify(result!.nodeConfig)).toBe(before);
    });
  });
});
