/**
 * AgentFlow 分支端口 chip 浮层
 *
 * 在节点 React 容器内 absolute 渲染每个分支端口的彩色 chip（橙=route）。
 * 位置由 `portLayout.branchPortY` 计算，与 handler 生成的端口 y 坐标对齐。
 *
 * 渲染位置：每个 chip 位于节点右侧外部 ~8px，与 X6 端口圆点同行。
 *
 * 样式：`.agent-flow-port-chip-layer`（容器）+ `.agent-flow-port-chip`（chip）
 * 定义在 `registerCustomNodes.less`。
 *
 * 隔离约束：仅对 AgentFlow 类型节点渲染；普通 Workflow 节点直接 return null。
 */

import {
  getHitlOptions,
  isHitlOptionsBranchMode,
} from '@/pages/Antv-X6/v3/agentFlow/adapters/qaConfigAdapter';
import {
  BRANCH_PORT_BASE_Y,
  BRANCH_PORT_ITEM_HEIGHT,
  BRANCH_PORT_STEP,
} from '@/pages/Antv-X6/v3/agentFlow/handlers/portLayout';
import { isAgentFlowType } from '@/pages/Antv-X6/v3/flowKind/flowKindConfig';
import { t } from '@/services/i18nRuntime';
import { NodeTypeEnum } from '@/types/enums/common';
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
  /**
   * chip 对应的端口数组下标（用于和 handler 生成的 outputPorts 数组对齐）
   * - RouteDecision: default 占位 0，routes 从 1 开始，所以 chip[0] 的 portIndex=1
   * 未设置时默认使用 chip 数组下标
   */
  portIndex?: number;
}

/**
 * 根据节点 type + nodeConfig 枚举 chip 列表
 * 列表顺序与 handler 生成的端口顺序一致：
 * - RouteDecision: [default 跳过, route_1(portIdx=1), route_2(portIdx=2), ...]
 * - HITL ask(options): [option_1, option_2, ...]（ask 文本/表单模式无 chip）
 */
function buildChips(data: ChildNode): ChipDescriptor[] {
  const nc: any = data.nodeConfig || {};

  switch (data.type) {
    case NodeTypeEnum.RouteDecision: {
      const routes: any[] = nc.intentConfigs || [];
      // default 端口不渲染 chip；第 1 个 route 实际是 outputPorts 数组下标 1
      return routes.map((r, i) => ({
        label: r.intent || r.name || `Route ${i + 1}`,
        tone: 'route',
        portIndex: i + 1,
      }));
    }

    case NodeTypeEnum.HumanInteraction: {
      if (isHitlOptionsBranchMode(nc)) {
        const options = getHitlOptions(nc);
        return options.map((o: any, i: number) => ({
          label: o.content || `Option ${i + 1}`,
          tone: 'route' as ChipTone,
        }));
      }
      return [];
    }

    default:
      return [];
  }
}

/**
 * 计算第 i 个 chip 的 top 值（px）
 *
 * 对齐公式：与 handler 端口 y 坐标一致 —— `baseY + (portIndex+1)*itemHeight - step`
 * portIndex = chip 数组下标 i（默认）或 ChipDescriptor.portIndex（覆盖）
 */
function chipTop(portIndex: number): number {
  return (
    BRANCH_PORT_BASE_Y +
    (portIndex + 1) * BRANCH_PORT_ITEM_HEIGHT -
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
      {chips.map((chip, i) => {
        // portIndex 显式 > 数组下标，handler 端口布局不连续时使用 (RouteDecision)
        const portIdx = chip.portIndex ?? i;
        return (
          <Tooltip
            key={`${data.id}-${portIdx}`}
            title={t('PC.Pages.AgentFlow.dragToConnect', '拖拽连线')}
            placement="top"
          >
            <div
              className={`agent-flow-port-chip ${chip.tone}`}
              style={{ top: chipTop(portIdx), right: CHIP_RIGHT_OFFSET }}
            >
              {chip.label}
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
};

export default AgentFlowPortChips;
