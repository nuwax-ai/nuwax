/**
 * AgentFlow 分支节点端口布局工具
 *
 * 集中管理 3 个分支节点 handler（evalGate / humanInteraction / routeDecision）
 * 共享的端口布局常量与端口 id 解析函数，消除重复。
 *
 * 视觉对齐原型的端口起始 y：
 *   baseY = 42 (= defaultHeight 44 + 10 留白)
 *   itemHeight = 24 (每端口纵向间距)
 *   step = 12 (圆点视觉上移到 yHeight 公式中的微调)
 *
 * 端口 y 公式（与原 handler 一致）：
 *   yHeight  = baseY + (i+1)*itemHeight - step
 *   offsetY  = baseY + (i+1)*itemHeight
 * 其中 i=0 是该节点的第一个分支端口（如 eval-pass、route-default、hitl-approve）。
 */

import type { ChildNode } from '@/types/interfaces/graph';

export const BRANCH_PORT_BASE_Y = 42;
export const BRANCH_PORT_ITEM_HEIGHT = 24;
export const BRANCH_PORT_STEP = 12;

/** 兜底端口颜色（RouteDecision 的 default 端口用） */
export const ROUTE_DEFAULT_PORT_COLOR = '#bfbfbf';

/**
 * 从完整 portId 提取后缀（去掉 nodeId 前缀和 -out 后缀）
 * 用于 parseSourcePort / handleSpecialNextIndex 等需要"按 key 匹配"的场景
 */
export function extractPortSuffix(node: ChildNode, portId: string): string {
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

/**
 * 给定分支索引 i，返回 yHeight / offsetY
 *
 * i 含义：
 *   - 0 = 第一个分支端口（pass / default / approve）
 *   - 1..n = 后续分支端口
 */
export function branchPortY(index: number): {
  yHeight: number;
  offsetY: number;
} {
  const yHeight =
    BRANCH_PORT_BASE_Y +
    (index + 1) * BRANCH_PORT_ITEM_HEIGHT -
    BRANCH_PORT_STEP;
  const offsetY = BRANCH_PORT_BASE_Y + (index + 1) * BRANCH_PORT_ITEM_HEIGHT;
  return { yHeight, offsetY };
}
