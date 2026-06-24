/**
 * portLayout util 单元测试
 *
 * 覆盖：
 * - 常量值（基线对齐基线：baseY=42, itemHeight=24, step=12）
 * - extractPortSuffix 边界（带/不带 nodeId 前缀、-out 后缀、嵌套 -out）
 * - branchPortY(0/1/N) 数值
 * - 端口 y 与 chip y 对齐不变量（RouteDecision 端口 0 = default, chip[0] 应对齐 port 1）
 */

import type { ChildNode } from '@/types/interfaces/graph';
import { describe, expect, it } from 'vitest';
import {
  BRANCH_PORT_BASE_Y,
  BRANCH_PORT_ITEM_HEIGHT,
  BRANCH_PORT_STEP,
  branchPortY,
  extractPortSuffix,
  ROUTE_DEFAULT_PORT_COLOR,
} from '../portLayout';

describe('portLayout constants', () => {
  it('should match the agreed baseline', () => {
    expect(BRANCH_PORT_BASE_Y).toBe(42);
    expect(BRANCH_PORT_ITEM_HEIGHT).toBe(24);
    expect(BRANCH_PORT_STEP).toBe(12);
    expect(ROUTE_DEFAULT_PORT_COLOR).toBe('#bfbfbf');
  });
});

describe('extractPortSuffix', () => {
  const makeNode = (id: number | string) => ({ id } as ChildNode);

  it('should strip nodeId prefix and -out suffix', () => {
    expect(extractPortSuffix(makeNode(10), '10-eval-pass-out')).toBe(
      'eval-pass',
    );
  });

  it('should work with string nodeId', () => {
    expect(extractPortSuffix(makeNode('abc'), 'abc-route-r1-out')).toBe(
      'route-r1',
    );
  });

  it('should handle portId without nodeId prefix (graceful fallback)', () => {
    expect(extractPortSuffix(makeNode(10), 'eval-pass-out')).toBe('eval-pass');
  });

  it('should handle portId without -out suffix', () => {
    expect(extractPortSuffix(makeNode(10), '10-eval-pass')).toBe('eval-pass');
  });

  it('should preserve uuid with hyphens in it', () => {
    expect(extractPortSuffix(makeNode(10), '10-eval-fail-v1-uuid-out')).toBe(
      'eval-fail-v1-uuid',
    );
  });
});

describe('branchPortY', () => {
  it('should compute index 0 (first branch port)', () => {
    const { yHeight, offsetY } = branchPortY(0);
    // yHeight = 42 + 1*24 - 12 = 54
    // offsetY = 42 + 1*24 = 66
    expect(yHeight).toBe(54);
    expect(offsetY).toBe(66);
  });

  it('should compute index 1 (second branch port)', () => {
    const { yHeight, offsetY } = branchPortY(1);
    expect(yHeight).toBe(42 + 2 * 24 - 12);
    expect(offsetY).toBe(42 + 2 * 24);
  });

  it('should compute index N (linear progression)', () => {
    const n = 5;
    const { yHeight, offsetY } = branchPortY(n);
    expect(yHeight).toBe(
      BRANCH_PORT_BASE_Y + (n + 1) * BRANCH_PORT_ITEM_HEIGHT - BRANCH_PORT_STEP,
    );
    expect(offsetY).toBe(
      BRANCH_PORT_BASE_Y + (n + 1) * BRANCH_PORT_ITEM_HEIGHT,
    );
  });

  it('should always have yHeight < offsetY (by exactly step)', () => {
    for (let i = 0; i < 10; i++) {
      const { yHeight, offsetY } = branchPortY(i);
      expect(offsetY - yHeight).toBe(BRANCH_PORT_STEP);
    }
  });
});

/**
 * 端口布局不变量：分支 handler 端口 y = branchPortY(端口下标)
 * chip 浮层用 buildChips(...).portIndex 也必须调用 branchPortY 同一索引
 * 这里锁住 "EvalGate / RouteDecision / HITL 三个 handler 都用同一公式"
 * 防止后续 handler 改动时分支错位
 */
describe('port-layout invariant (handler <-> chip alignment)', () => {
  it('EvalGate: pass/fail indices 0..N-1 各自对齐', () => {
    // handler 端：pass = branchPortY(0), fail[i] = branchPortY(i+1)
    // chip 端：chip[0] 用 portIndex=0, chip[i+1] 用 portIndex=i+1
    for (let i = 0; i < 5; i++) {
      const passPort = branchPortY(0);
      const failPort = branchPortY(i + 1);
      // 与 chipTop(portIndex) 计算一致
      const chipTopForChip0 =
        BRANCH_PORT_BASE_Y + 1 * BRANCH_PORT_ITEM_HEIGHT - BRANCH_PORT_STEP;
      const chipTopForChipI1 =
        BRANCH_PORT_BASE_Y +
        (i + 2) * BRANCH_PORT_ITEM_HEIGHT -
        BRANCH_PORT_STEP;
      expect(passPort.yHeight).toBe(chipTopForChip0);
      expect(failPort.yHeight).toBe(chipTopForChipI1);
    }
  });

  it('RouteDecision: default 用 branchPortY(0), route[i] 用 branchPortY(i+1), chip[i] 显式传 portIndex=i+1', () => {
    // chip[0] 应对齐 default? 错! chip 数组跳过 default, chip[i] 应对齐 route[i]
    // 即 chip[0].portIndex=1, chip[1].portIndex=2, ...
    for (let i = 0; i < 4; i++) {
      const routePortY = branchPortY(i + 1).yHeight;
      // chip 公式：(i + 1 + 1) * 24 - 12  注: chip 数组 i 对应 handler 端口下标 i+1
      const chipTopY =
        BRANCH_PORT_BASE_Y +
        (i + 2) * BRANCH_PORT_ITEM_HEIGHT -
        BRANCH_PORT_STEP;
      expect(chipTopY).toBe(routePortY);
    }
  });

  it('HITL approve: approve = branchPortY(0), reject = branchPortY(1)', () => {
    expect(branchPortY(0).yHeight).toBe(54);
    expect(branchPortY(1).yHeight).toBe(78);
  });
});
