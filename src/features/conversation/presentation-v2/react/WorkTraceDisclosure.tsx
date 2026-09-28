/**
 * V2 工作轨迹：整轮指标 → 正文分隔的过程段 → 连续工具组 → 原子工具详情。
 * 展开状态全部保存在本层，外层收起导致子树卸载时不会丢失用户选择。
 */
import { PureMarkdownRenderer } from '@/components/MarkdownRenderer';
import SvgIcon from '@/components/base/SvgIcon';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { dict } from '@/services/i18nRuntime';
import type { OpenUiArtifact } from '@/types/interfaces/openUi';
import { CloseCircleOutlined } from '@ant-design/icons';
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
  isOpenUiRenderElementNode,
  isTodoTraceNode,
} from '../traceItems';
import { composeConversationTraceSegments } from '../traceSegments';
import type {
  ConversationProcessNode,
  ConversationRenderPreferencesV2,
  ConversationToolResource,
  ConversationTraceItem,
  ConversationTurnPresentationV2,
} from '../types';
import OpenUiTraceNode from './OpenUiTraceNode';
import ProcessNodeRow from './ProcessNodeRow';
import TodoTraceNode from './TodoTraceNode';
import ToolGroupDisclosure from './ToolGroupDisclosure';
import { formatElapsed, formatElapsedClock } from './formatElapsed';
import styles from './index.less';

const cx = classNames.bind(styles);

export const NarrationText: React.FC<{
  narrationId: string;
  children: string;
}> = ({ narrationId, children }) => {
  const { data } = useUnifiedTheme();
  const markdownId = `v2-narration-${React.useId().replace(/:/g, '')}`;
  return (
    <div
      data-testid="v2-narration"
      data-narration-id={narrationId}
      className={cx(styles['narration-text'])}
    >
      <PureMarkdownRenderer
        id={markdownId}
        theme={data.antdTheme === 'dark' ? 'dark' : 'light'}
        disableTyping
      >
        {children}
      </PureMarkdownRenderer>
    </div>
  );
};

type TraceMetricsTurn = Pick<
  ConversationTurnPresentationV2,
  'running' | 'metrics'
>;

const useElapsedMs = (turn: TraceMetricsTurn): number | undefined => {
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

// 计时状态仅由标签持有，避免每秒重渲染整轮正文与工具详情。
const TraceMetrics: React.FC<{ turn: TraceMetricsTurn }> = ({ turn }) => {
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
  const elapsedText = turn.running
    ? formatElapsedClock(elapsedMs ?? 0)
    : formatElapsed(elapsedMs);
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

  return (
    <span
      className={cx(styles['trace-metrics'], styles['trace-metrics-leading'])}
    >
      {headerText}
    </span>
  );
};

export interface WorkTraceDisclosureProps {
  turn: ConversationTurnPresentationV2;
  preferences: ConversationRenderPreferencesV2;
  manualExpanded?: boolean;
  onManualToggle: (expanded: boolean) => void;
  onOpenResource?: (resource: ConversationToolResource) => void;
  /** OpenUI 产物文件 URL 构建与动作回发所需的会话 ID */
  conversationId?: number | string;
  /** OpenUI sidecar 摘要行点击 / autoOpen：打开预览面板并选中 .openui.json */
  onOpenSidecar?: (artifact: OpenUiArtifact) => void;
}

const WorkTraceDisclosure: React.FC<WorkTraceDisclosureProps> = ({
  turn,
  preferences,
  manualExpanded,
  onManualToggle,
  onOpenResource,
  conversationId,
  onOpenSidecar,
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
    () =>
      composeConversationTraceItems(
        turn.nodes,
        turn.running && !turn.finalAnswer.text.trim(),
      ),
    [turn.nodes, turn.running, turn.finalAnswer.text],
  );
  const segments = useMemo(
    () => composeConversationTraceSegments(turn),
    [turn.nodes, turn.running, turn.finalAnswer.text],
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
  const itemsBySegment = useMemo(() => {
    const segmentByNode = new Map<string, string>();
    segments.forEach((segment) => {
      if (segment.kind === 'process-segment') {
        segment.nodes.forEach((node) => segmentByNode.set(node.id, segment.id));
      }
    });
    const result = new Map<string, ConversationTraceItem[]>();
    shownItems.forEach((item) => {
      const node = item.kind === 'tool-group' ? item.nodes[0] : item.node;
      const segmentId = segmentByNode.get(node.id);
      if (!segmentId) return;
      const items = result.get(segmentId) ?? [];
      items.push(item);
      result.set(segmentId, items);
    });
    return result;
  }, [segments, shownItems]);

  const [nodeExpanded, setNodeExpanded] = useState<Record<string, boolean>>({});
  const [groupExpanded, setGroupExpanded] = useState<Record<string, boolean>>(
    {},
  );
  const [segmentExpanded, setSegmentExpanded] = useState<
    Record<string, boolean>
  >({});
  const previousActiveSegment = useRef<string>();
  const activeSegmentId = segments.find(
    (segment) => segment.kind === 'process-segment' && segment.active,
  )?.id;
  useEffect(() => {
    const previousId = previousActiveSegment.current;
    if (previousId && previousId !== activeSegmentId) {
      setSegmentExpanded((previous) => ({ ...previous, [previousId]: false }));
    }
    previousActiveSegment.current = activeSegmentId;
  }, [activeSegmentId]);
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

  // 多个缓存会话会同时留在 DOM 中，turn.key 不能作为跨实例唯一 id。
  const traceBodyId = `v2-trace-body-${React.useId().replace(/:/g, '')}`;
  const renderItem = (item: ConversationTraceItem, showDetails: boolean) => {
    if (item.kind === 'standalone' && isOpenUiRenderElementNode(item.node)) {
      return (
        <OpenUiTraceNode
          key={item.id}
          node={item.node}
          conversationId={conversationId}
          onOpenSidecar={onOpenSidecar}
        />
      );
    }
    if (item.kind === 'narration') {
      return (
        <NarrationText key={item.id} narrationId={item.id}>
          {item.node.text ?? ''}
        </NarrationText>
      );
    }
    if (!showDetails) return null;
    if (item.kind === 'standalone' && isTodoTraceNode(item.node)) {
      return <TodoTraceNode key={item.id} node={item.node} />;
    }
    if (item.kind === 'tool-group') {
      return (
        <ToolGroupDisclosure
          key={item.id}
          group={item}
          nodes={item.nodes}
          expanded={groupIsExpanded(item)}
          onToggle={() =>
            setGroupExpanded((previous) => ({
              ...previous,
              [item.id]: !(previous[item.id] ?? item.active),
            }))
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
  };
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
        <TraceMetrics turn={turn} />
        <span
          className={cx(
            styles['trace-chevron'],
            styles['trace-chevron-trailing'],
            { [styles['trace-chevron-open']]: expanded },
          )}
          aria-hidden="true"
        >
          <SvgIcon name="icons-common-caret_down" style={{ fontSize: 10 }} />
        </span>
      </button>
      {/* 轨迹体：产物为 inline/sidecar 的 OpenUI 节点原位渲染看板/摘要行，收起态保持
          显示；失败与无产物退化态回落普通工具行（词条化动作，协议名不外露） */}
      <div id={traceBodyId} className={cx(styles['trace-body'])}>
        {segments.map((segment, segmentIndex) => {
          if (segment.kind === 'narration') {
            return renderItem(segment, expanded);
          }
          const items = itemsBySegment.get(segment.id) ?? [];
          // 有常显产物的段始终使用同一父路径，避免收尾/收起时重挂载表单或 iframe。
          if (
            !expanded &&
            !items.some(
              (item) =>
                item.kind === 'standalone' &&
                isOpenUiRenderElementNode(item.node),
            )
          )
            return null;
          const segmentIsExpanded =
            !turn.running ||
            segment.active ||
            Boolean(segmentExpanded[segment.id]);
          const segmentFailed = segment.nodes.some(
            (node) => node.failed || node.status === 'failed',
          );
          const segmentBodyId = `${traceBodyId}-segment-${segmentIndex}`;
          return (
            <div
              key={segment.id}
              className={cx(styles['trace-segment'])}
              data-trace-segment-id={segment.id}
              data-trace-segment-active={segment.active ? 'true' : 'false'}
              data-trace-segment-expanded={segmentIsExpanded ? 'true' : 'false'}
            >
              {expanded && turn.running && !segment.active && (
                <button
                  type="button"
                  className={cx(styles['trace-segment-toggle'])}
                  data-testid="v2-trace-segment-toggle"
                  aria-expanded={segmentIsExpanded}
                  aria-controls={segmentBodyId}
                  onClick={() =>
                    setSegmentExpanded((previous) => ({
                      ...previous,
                      [segment.id]: !segmentIsExpanded,
                    }))
                  }
                >
                  <TraceMetrics
                    turn={{ running: false, metrics: segment.metrics }}
                  />
                  {segmentFailed && (
                    <CloseCircleOutlined
                      style={{ color: token.colorError }}
                      data-testid="v2-trace-segment-failed"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={cx(styles['trace-chevron'], {
                      [styles['trace-chevron-open']]: segmentIsExpanded,
                    })}
                    aria-hidden="true"
                  >
                    <SvgIcon
                      name="icons-common-caret_down"
                      style={{ fontSize: 10 }}
                    />
                  </span>
                </button>
              )}
              <div
                id={segmentBodyId}
                className={cx(styles['trace-segment-body'])}
              >
                {items.map((item) =>
                  renderItem(item, expanded && segmentIsExpanded),
                )}
              </div>
            </div>
          );
        })}
        {expanded && !revealHidden && hiddenCount > 0 && (
          <button
            type="button"
            className={cx(styles['hidden-entry'])}
            data-testid="v2-hidden-entry"
            onClick={() => {
              setRevealHidden(true);
              const visibleIds = new Set(visibleNodes.map((node) => node.id));
              setSegmentExpanded((previous) => {
                const next = { ...previous };
                segments.forEach((segment) => {
                  if (
                    segment.kind === 'process-segment' &&
                    segment.nodes.some((node) => !visibleIds.has(node.id))
                  ) {
                    next[segment.id] = true;
                  }
                });
                return next;
              });
            }}
          >
            {dict(
              'PC.Components.ConversationRendererV2.hiddenEntry',
              hiddenCount,
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default WorkTraceDisclosure;
