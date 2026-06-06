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
  /**
   * chip 对应的端口数组下标（用于和 handler 生成的 outputPorts 数组对齐）
   * - EvalGate / HITL approve: 0..N-1（与 chip 数组下标一致，可省略）
   * - RouteDecision: default 占位 0，routes 从 1 开始，所以 chip[0] 的 portIndex=1
   * 未设置时默认使用 chip 数组下标
   */
  portIndex?: number;
}

/**
 * 根据节点 type + nodeConfig 枚举 chip 列表
 * 列表顺序与 handler 生成的端口顺序一致：
 * - EvalGate: [pass(portIdx=0), fail_1(portIdx=1), fail_2(portIdx=2), ...]
 * - RouteDecision: [default 跳过, route_1(portIdx=1), route_2(portIdx=2), ...]
 * - HITL approve: [approve(portIdx=0), reject(portIdx=1)]
 */
function buildChips(data: ChildNode): ChipDescriptor[] {
  const nc: any = data.nodeConfig || {};

  switch (data.type) {
    case NodeTypeEnum.EvalGate: {
      // v2: 从 branches[] 构建 chips
      const branches: any[] = nc.branches || [];
      if (branches.length > 0) {
        const chips: ChipDescriptor[] = [
          {
            label:
              branches[0]?.name || t('PC.Pages.AgentFlow.chipPass', '通过'),
            tone: 'pass',
          },
        ];
        for (let i = 1; i < branches.length; i++) {
          chips.push({
            label: branches[i].name || `Branch ${i}`,
            tone: 'fail',
          });
        }
        return chips;
      }
      // v1 回退：从 evalValidators[] 构建
      const validators: any[] = nc.evalValidators || [];
      const chips: ChipDescriptor[] = [
        { label: t('PC.Pages.AgentFlow.chipPass', '通过'), tone: 'pass' },
      ];
      validators.forEach(() => {
        chips.push({
          label: t('PC.Pages.AgentFlow.chipFail', '不达标'),
          tone: 'fail',
        });
      });
      return chips;
    }

    case NodeTypeEnum.RouteDecision: {
      const routes: any[] = nc.routes || [];
      // default 端口不渲染 chip；第 1 个 route 实际是 outputPorts 数组下标 1
      return routes.map((r, i) => ({
        label: r.routeName || r.name || `Route ${i + 1}`,
        tone: 'route',
        portIndex: i + 1,
      }));
    }

    case NodeTypeEnum.HumanInteraction: {
      if (nc.hitlMode === HitlModeEnum.Approve) {
        // v2: 从 branches[] 构建
        const branches: any[] = nc.branches || [];
        if (branches.length > 0) {
          return branches.map((b: any, i: number) => ({
            label: b.name || `Branch ${i + 1}`,
            tone: i === 0 ? 'pass' : 'fail',
          }));
        }
        // v1 回退
        return [
          { label: t('PC.Pages.AgentFlow.chipApprove', '通过'), tone: 'pass' },
          { label: t('PC.Pages.AgentFlow.chipReject', '拒绝'), tone: 'fail' },
        ];
      }
      // ask options 模式
      if (nc.replyMode === 'options' || nc.askConfig?.answerType === 'SELECT') {
        const options: any[] = nc.askConfig?.options || [];
        return options.map((o: any, i: number) => ({
          label: o.content || `Option ${i + 1}`,
          tone: 'route' as ChipTone,
        }));
      }
      // ask text/form 模式：无 chip
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
