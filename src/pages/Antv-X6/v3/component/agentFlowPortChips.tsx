/**
 * AgentFlow 分支端口 chip 浮层
 *
 * 在节点 React 容器内 absolute 渲染每个分支端口的彩色 chip（绿=pass/approve，
 * 红=fail/reject，橙=route）。位置由 `portLayout.branchPortY` 计算，与
 * handler 生成的端口 y 坐标对齐。
 *
 * 渲染位置：每个 chip 位于节点右侧外部 ~8px，与 X6 端口圆点同行。
 *
 * 样式：`.agent-flow-port-chip-layer`（容器）+ `.agent-flow-port-chip`（chip）
 * 定义在 `registerCustomNodes.less`。
 *
 * 隔离约束：仅对 AgentFlow 类型节点渲染；普通 Workflow 节点直接 return null。
 */

import {
  BRANCH_PORT_BASE_Y,
  BRANCH_PORT_ITEM_HEIGHT,
  BRANCH_PORT_STEP,
} from '@/pages/Antv-X6/v3/agentFlow/handlers/portLayout';
import { isAgentFlowType } from '@/pages/Antv-X6/v3/agentFlow/types';
import { t } from '@/services/i18nRuntime';
import { HitlModeEnum, NodeTypeEnum } from '@/types/enums/common';
import { ChildNode } from '@/types/interfaces/graph';
import { Tooltip } from 'antd';
import React from 'react';

interface AgentFlowPortChipsProps {
  data: ChildNode;
}

/** 视觉上 chip 距节点右边界的偏移（px） */
const CHIP_RIGHT_OFFSET = 8;

/** chip 容器顶部偏移补偿 — 节点 header 高度(44) - X6 端口 baseY 锚点 */
const CHIP_TOP_OFFSET = -2;

export type ChipTone = 'pass' | 'fail' | 'route';

export interface ChipDescriptor {
  /** chip 文本 */
  label: string;
  /** chip 色调 */
  tone: ChipTone;
}

const tooltipTitle = t('PC.Pages.AgentFlow.dragToConnect', '拖拽连线');

/**
 * 根据节点 type + nodeConfig 枚举 chip 列表
 * 列表顺序与 handler 生成的端口顺序一致：
 * - EvalGate: [pass, fail_1, fail_2, ...]
 * - RouteDecision: [default(跳过), route_1, route_2, ...]
 * - HITL approve: [approve, reject]
 */
function buildChips(data: ChildNode): ChipDescriptor[] {
  const nc: any = data.nodeConfig || {};

  switch (data.type) {
    case NodeTypeEnum.EvalGate: {
      const validators: any[] = nc.evalValidators || [];
      const chips: ChipDescriptor[] = [
        { label: t('PC.Pages.AgentFlow.chipPass', '通过'), tone: 'pass' },
      ];
      validators.forEach((v, i) => {
        chips.push({
          label: t('PC.Pages.AgentFlow.chipFail', '不达标'),
          tone: 'fail',
        });
        // i 仅为占位，保持与 handler 的 validators 顺序一致
        void i;
      });
      return chips;
    }

    case NodeTypeEnum.RouteDecision: {
      const routes: any[] = nc.routes || [];
      // 第 0 个位置是 default 端口，不渲染 chip
      return routes.map((r, i) => ({
        label: r.routeName || r.name || `Route ${i + 1}`,
        tone: 'route',
      }));
    }

    case NodeTypeEnum.HumanInteraction: {
      if (nc.hitlMode === HitlModeEnum.Approve) {
        return [
          { label: t('PC.Pages.AgentFlow.chipApprove', '通过'), tone: 'pass' },
          { label: t('PC.Pages.AgentFlow.chipReject', '拒绝'), tone: 'fail' },
        ];
      }
      // ask 模式：无 chip
      return [];
    }

    default:
      return [];
  }
}

/**
 * 计算第 i 个 chip 的 top 值（px）
 *
 * 对齐公式：与 handler 端口 y 坐标一致 —— `baseY + (i+1)*itemHeight - step`
 * 其中 i=0 表示该节点第一个 chip（在 default 后/第一个分支端口）
 */
function chipTop(index: number): number {
  return (
    BRANCH_PORT_BASE_Y +
    (index + 1) * BRANCH_PORT_ITEM_HEIGHT -
    BRANCH_PORT_STEP +
    CHIP_TOP_OFFSET
  );
}

const AgentFlowPortChips: React.FC<AgentFlowPortChipsProps> = ({ data }) => {
  if (!isAgentFlowType(data.type)) return null;

  const chips = buildChips(data);
  if (chips.length === 0) return null;

  return (
    <div className="agent-flow-port-chip-layer">
      {chips.map((chip, i) => (
        <Tooltip key={`${data.id}-${i}`} title={tooltipTitle} placement="top">
          <div
            className={`agent-flow-port-chip ${chip.tone}`}
            style={{ top: chipTop(i), right: CHIP_RIGHT_OFFSET }}
          >
            {chip.label}
          </div>
        </Tooltip>
      ))}
    </div>
  );
};

export default AgentFlowPortChips;
