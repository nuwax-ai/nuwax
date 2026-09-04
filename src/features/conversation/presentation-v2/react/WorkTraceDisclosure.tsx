/**
 * V2 整轮工作轨迹：外层指标 disclosure → 连续工具组 → 原子工具详情。
 * 展开状态全部保存在本层，外层收起导致子树卸载时不会丢失用户选择。
 */
import { PureMarkdownRenderer } from '@/components/MarkdownRenderer';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { dict } from '@/services/i18nRuntime';
import { CaretRightOutlined } from '@ant-design/icons';
import { theme } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  defaultTraceExpanded,
  resolveNodeMode,
  splitNodesByVisibility,
} from '../renderPreferences';
import {
  composeConversationTraceItems,
  getToolGroupActionKinds,
  getToolGroupStatus,
} from '../traceItems';
import type {
  ConversationProcessNode,
  ConversationRenderPreferencesV2,
  ConversationToolResource,
  ConversationTraceItem,
  ConversationTurnPresentationV2,
} from '../types';
import ProcessNodeRow from './ProcessNodeRow';
import ToolGroupDisclosure from './ToolGroupDisclosure';
import { formatElapsed } from './formatElapsed';
import styles from './index.less';

const cx = classNames.bind(styles);

export const NarrationText: React.FC<{
  narrationId: string;
  children: string;
}> = ({ narrationId, children }) => {
  const { data } = useUnifiedTheme();
  return (
    <div
      data-testid="v2-narration"
      data-narration-id={narrationId}
      className={cx(styles['narration-text'])}
    >
      <PureMarkdownRenderer
        id={`v2-narration-${narrationId}`}
        theme={data.antdTheme === 'dark' ? 'dark' : 'light'}
        disableTyping
      >
        {children}
      </PureMarkdownRenderer>
    </div>
  );
};

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
  manualExpanded?: boolean;
  onManualToggle: (expanded: boolean) => void;
  onOpenResource?: (resource: ConversationToolResource) => void;
}

const WorkTraceDisclosure: React.FC<WorkTraceDisclosureProps> = ({
  turn,
  preferences,
  manualExpanded,
  onManualToggle,
  onOpenResource,
}) => {
  const { token } = theme.useToken();
  const [revealHidden, setRevealHidden] = useState(false);
  const expanded =
    manualExpanded ?? defaultTraceExpanded(turn, preferences.preset);
  const { visibleNodes, hiddenCount } = useMemo(
    () => splitNodesByVisibility(turn.nodes, preferences),
    [turn.nodes, preferences],
  );
  const traceItems = useMemo(
    () => composeConversationTraceItems(turn.nodes, turn.running),
    [turn.nodes, turn.running],
  );
  const shownItems = useMemo(() => {
    if (revealHidden) return traceItems;
    const visibleIds = new Set(visibleNodes.map((node) => node.id));
    return traceItems.flatMap<ConversationTraceItem>((item) => {
      if (item.kind !== 'tool-group') {
        return visibleIds.has(item.node.id) ? [item] : [];
      }
      const nodes = item.nodes.filter((node) => visibleIds.has(node.id));
      if (!nodes.length) return [];
      return [
        {
          ...item,
          nodes,
          actionKinds: getToolGroupActionKinds(nodes),
          status: getToolGroupStatus(nodes),
        },
      ];
    });
  }, [revealHidden, traceItems, visibleNodes]);

  const [nodeExpanded, setNodeExpanded] = useState<Record<string, boolean>>({});
  const [groupExpanded, setGroupExpanded] = useState<Record<string, boolean>>(
    {},
  );
  const previousActiveGroups = useRef<Set<string>>(new Set());
  const autoCollapsedGroups = useRef<Set<string>>(new Set());
  const activeGroupKey = traceItems
    .filter((item) => item.kind === 'tool-group' && item.active)
    .map((item) => item.id)
    .join('|');

  useEffect(() => {
    const current = new Set(activeGroupKey ? activeGroupKey.split('|') : []);
    const collapsed: string[] = [];
    previousActiveGroups.current.forEach((groupId) => {
      if (!current.has(groupId) && !autoCollapsedGroups.current.has(groupId)) {
        collapsed.push(groupId);
        autoCollapsedGroups.current.add(groupId);
      }
    });
    if (collapsed.length) {
      setGroupExpanded((previous) => {
        const next = { ...previous };
        collapsed.forEach((groupId) => {
          next[groupId] = false;
        });
        return next;
      });
    }
    previousActiveGroups.current = current;
  }, [activeGroupKey]);

  const toggleNode = (nodeId: string) => {
    const node = turn.nodes.find((item) => item.id === nodeId);
    setNodeExpanded((previous) => {
      const current =
        typeof previous[nodeId] === 'boolean'
          ? previous[nodeId]
          : Boolean(
              node &&
                resolveNodeMode(node, preferences) === 'expanded' &&
                node.status !== 'running',
            );
      return { ...previous, [nodeId]: !current };
    });
  };
  const nodeIsExpanded = (node: ConversationProcessNode): boolean => {
    const manual = nodeExpanded[node.id];
    if (typeof manual === 'boolean') return manual;
    return (
      resolveNodeMode(node, preferences) === 'expanded' &&
      node.status !== 'running'
    );
  };
  const groupIsExpanded = (
    item: Extract<ConversationTraceItem, { kind: 'tool-group' }>,
  ): boolean => {
    const manual = groupExpanded[item.id];
    return typeof manual === 'boolean' ? manual : item.active;
  };

  const elapsedMs = useElapsedMs(turn);
  const metricParts: string[] = [];
  if (!turn.running && turn.metrics.toolCount > 0) {
    metricParts.push(
      dict(
        'PC.Components.ConversationRendererV2.traceMetricTools',
        turn.metrics.toolCount,
      ),
    );
  }
  if (!turn.running && turn.metrics.messageCount > 0) {
    metricParts.push(
      dict(
        'PC.Components.ConversationRendererV2.traceMetricMessages',
        turn.metrics.messageCount,
      ),
    );
  }
  const elapsedText = formatElapsed(
    elapsedMs ?? (turn.running ? 0 : undefined),
  );
  if (elapsedText) {
    metricParts.push(
      dict(
        turn.running
          ? 'PC.Components.ConversationRendererV2.traceMetricRunning'
          : 'PC.Components.ConversationRendererV2.traceMetricElapsed',
        elapsedText,
      ),
    );
  }
  const headerText = metricParts.length
    ? metricParts.join(' · ')
    : dict('PC.Components.ConversationRendererV2.traceTitleProcessOnly');

  const traceBodyId = `v2-trace-body-${turn.key}`;
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
    '--v2-color-success': token.colorSuccess,
    '--v2-color-error': token.colorError,
  } as React.CSSProperties;

  return (
    <div
      className={cx(styles['trace'])}
      style={traceThemeStyle}
      data-trace-key={turn.key}
      data-trace-running={turn.running ? 'true' : 'false'}
      data-trace-expanded={expanded ? 'true' : 'false'}
    >
      <button
        type="button"
        className={cx(styles['trace-toggle'])}
        aria-expanded={expanded}
        aria-controls={traceBodyId}
        data-testid="v2-trace-toggle"
        onClick={() => onManualToggle(!expanded)}
      >
        <span
          className={cx(
            styles['trace-metrics'],
            styles['trace-metrics-leading'],
          )}
        >
          {headerText}
        </span>
        <CaretRightOutlined
          className={cx(
            styles['trace-chevron'],
            styles['trace-chevron-trailing'],
            { [styles['trace-chevron-open']]: expanded },
          )}
          aria-hidden="true"
        />
      </button>
      {expanded && (
        <div id={traceBodyId} className={cx(styles['trace-body'])}>
          {shownItems.map((item) => {
            if (item.kind === 'narration') {
              return (
                <NarrationText key={item.id} narrationId={item.id}>
                  {item.node.text ?? ''}
                </NarrationText>
              );
            }
            if (item.kind === 'tool-group') {
              return (
                <ToolGroupDisclosure
                  key={item.id}
                  group={item}
                  nodes={item.nodes}
                  expanded={groupIsExpanded(item)}
                  onToggle={() =>
                    setGroupExpanded((previous) => {
                      const current =
                        typeof previous[item.id] === 'boolean'
                          ? previous[item.id]
                          : item.active;
                      return { ...previous, [item.id]: !current };
                    })
                  }
                  nodeIsExpanded={nodeIsExpanded}
                  onToggleNode={toggleNode}
                  onOpenResource={onOpenResource}
                />
              );
            }
            return (
              <ProcessNodeRow
                key={item.id}
                node={item.node}
                expanded={nodeIsExpanded(item.node)}
                onToggle={() => toggleNode(item.node.id)}
                onOpenResource={onOpenResource}
              />
            );
          })}
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
