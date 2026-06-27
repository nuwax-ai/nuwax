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
 *
 * 当节点带描述行时（data.description 有值），header 会多出 desc 行，分支条目整体
 * 下移 descHeight；端口 baseY 同步加 descHeight 才能与条目对齐。调用方通过
 * `{ hasDescription: true }` 开启。
 */

import type { ChildNode } from '@/types/interfaces/graph';

export const BRANCH_PORT_BASE_Y = 42;
export const BRANCH_PORT_ITEM_HEIGHT = 24;
export const BRANCH_PORT_STEP = 12;
/**
 * 描述行（.general-node-header-desc）带来的 header 增量：
 * font-size 11 * line-height 1.4 + padding-top 2 ≈ 17px。
 * 需与 registerCustomNodes.less 的 .general-node-header-desc 视觉对齐校准。
 */
export const BRANCH_PORT_DESC_HEIGHT = 17;

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
 *
 * options.hasDescription：节点是否带描述行；为 true 时 baseY 加 descHeight，
 * 让端口随分支条目一起下移，保持圆点与条目纵向对齐。
 */
export function branchPortY(
  index: number,
  options?: { hasDescription?: boolean },
): {
  yHeight: number;
  offsetY: number;
} {
  const baseY =
    BRANCH_PORT_BASE_Y +
    (options?.hasDescription ? BRANCH_PORT_DESC_HEIGHT : 0);
  const yHeight =
    baseY + (index + 1) * BRANCH_PORT_ITEM_HEIGHT - BRANCH_PORT_STEP;
  const offsetY = baseY + (index + 1) * BRANCH_PORT_ITEM_HEIGHT;
  return { yHeight, offsetY };
}
