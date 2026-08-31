/**
 * 外层工作轨迹 disclosure：一条轻量横向折叠头（非厚重卡片）。
 * 头部显示「N 次工具调用 · M 条消息 · 已工作 T」；无工具以「执行过程」开头，
 * 缺失指标单独省略。运行态低对比状态点（尊重 prefers-reduced-motion）。
 * 展开态由父层管理：默认值随运行/终态与预设变化，用户手动操作后固定。
 */
import { dict } from '@/services/i18nRuntime';
import { CaretRightOutlined } from '@ant-design/icons';
import { theme } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import {
  defaultTraceExpanded,
  resolveNodeMode,
  splitNodesByVisibility,
} from '../renderPreferences';
import type {
  ConversationProcessNode,
  ConversationRenderPreferencesV2,
  ConversationTurnPresentationV2,
} from '../types';
import ProcessNodeRow from './ProcessNodeRow';
import { formatElapsed } from './formatElapsed';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 运行态每秒跳动；终态冻结（elapsedMs） */
const useElapsedMs = (
  turn: ConversationTurnPresentationV2,
): number | undefined => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!turn.running) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [turn.running]);
  if (typeof turn.metrics.elapsedMs === 'number') {
    return turn.metrics.elapsedMs;
  }
  if (turn.running && typeof turn.metrics.elapsedAnchor === 'number') {
    return Math.max(0, now - turn.metrics.elapsedAnchor);
  }
  return undefined;
};

export interface WorkTraceDisclosureProps {
  turn: ConversationTurnPresentationV2;
  preferences: ConversationRenderPreferencesV2;
  conversationId?: number | string;
  /** 用户手动展开态；undefined = 未手动干预（跟随默认） */
  manualExpanded?: boolean;
  onManualToggle: (expanded: boolean) => void;
}

const WorkTraceDisclosure: React.FC<WorkTraceDisclosureProps> = ({
  turn,
  preferences,
  conversationId,
  manualExpanded,
  onManualToggle,
}) => {
  const { token } = theme.useToken();
  const [revealHidden, setRevealHidden] = useState(false);

  const expanded =
    manualExpanded ?? defaultTraceExpanded(turn, preferences.preset);
  const { visibleNodes, hiddenCount } = useMemo(
    () => splitNodesByVisibility(turn.nodes, preferences),
    [turn.nodes, preferences],
  );
  const shownNodes: ConversationProcessNode[] = revealHidden
    ? turn.nodes
    : visibleNodes;

  const [nodeExpanded, setNodeExpanded] = useState<Record<string, boolean>>({});
  const toggleNode = (nodeId: string) => {
    setNodeExpanded((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };
  const nodeIsExpanded = (node: ConversationProcessNode): boolean => {
    const manual = nodeExpanded[node.id];
    if (typeof manual === 'boolean') return manual;
    // 有效档位（预设表 + 高级覆盖）为 expanded 的「已完成」节点默认展开；
    // 运行中节点只显示动态摘要，不自动展开完整输入输出（spec 预设表）
    if (
      resolveNodeMode(node, preferences) === 'expanded' &&
      node.status !== 'running'
    ) {
      return true;
    }
    return false;
  };

  const elapsedMs = useElapsedMs(turn);
  const metricParts: string[] = [];
  if (turn.metrics.toolCount > 0) {
    metricParts.push(
      dict(
        'PC.Components.ConversationRendererV2.traceMetricTools',
        turn.metrics.toolCount,
      ),
    );
  }
  if (turn.metrics.messageCount > 0) {
    metricParts.push(
      dict(
        'PC.Components.ConversationRendererV2.traceMetricMessages',
        turn.metrics.messageCount,
      ),
    );
  }
  const elapsedText = formatElapsed(elapsedMs);
  if (elapsedText) {
    metricParts.push(
      dict(
        'PC.Components.ConversationRendererV2.traceMetricElapsed',
        elapsedText,
      ),
    );
  }
  const headerText = metricParts.length
    ? metricParts.join(' · ')
    : dict('PC.Components.ConversationRendererV2.traceTitleProcessOnly');

  const traceBodyId = `v2-trace-body-${turn.key}`;
  // CSS variables may belong to an outer/stale ConfigProvider while useToken()
  // already reflects the active conversation surface. Bridge resolved tokens
  // onto this subtree to prevent dark-on-dark text in embedded shells.
  const traceThemeStyle = {
    '--v2-color-text': token.colorText,
    '--v2-color-text-secondary': token.colorTextSecondary,
    '--v2-color-text-tertiary': token.colorTextTertiary,
    '--v2-color-text-quaternary': token.colorTextQuaternary,
    '--v2-color-border': token.colorBorderSecondary,
    '--v2-color-fill': token.colorFillQuaternary,
    '--v2-color-fill-hover': token.colorFillTertiary,
    '--v2-color-link': token.colorLink,
    '--v2-color-primary': token.colorPrimary,
    '--v2-color-primary-border': token.colorPrimaryBorder,
  } as React.CSSProperties;

  return (
    <div
      className={cx(styles['trace'])}
      style={traceThemeStyle}
      data-trace-key={turn.key}
      data-trace-running={turn.running ? 'true' : 'false'}
    >
      <button
        type="button"
        className={cx(styles['trace-toggle'])}
        aria-expanded={expanded}
        aria-controls={traceBodyId}
        data-testid="v2-trace-toggle"
        onClick={() => onManualToggle(!expanded)}
      >
        <CaretRightOutlined
          className={cx(styles['trace-chevron'], {
            [styles['trace-chevron-open']]: expanded,
          })}
          aria-hidden="true"
        />
        {turn.running && (
          <span
            className={cx(styles['running-dot'])}
            style={{ background: token.colorPrimary }}
            aria-hidden="true"
          />
        )}
        <span className={cx(styles['trace-metrics'])}>{headerText}</span>
      </button>
      {expanded && (
        <div id={traceBodyId} className={cx(styles['trace-body'])}>
          {shownNodes.map((node, nodeIndex) => (
            <ProcessNodeRow
              key={`${node.id}#${nodeIndex}`}
              node={node}
              expanded={nodeIsExpanded(node)}
              onToggle={() => toggleNode(node.id)}
              conversationId={conversationId}
            />
          ))}
          {!revealHidden && hiddenCount > 0 && (
            <button
              type="button"
              className={cx(styles['hidden-entry'])}
              data-testid="v2-hidden-entry"
              onClick={() => setRevealHidden(true)}
            >
              {dict(
                'PC.Components.ConversationRendererV2.hiddenEntry',
                hiddenCount,
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkTraceDisclosure;
