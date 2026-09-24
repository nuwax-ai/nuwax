/**
 * V2 整轮工作轨迹：外层指标 disclosure → 连续工具组 → 原子工具详情。
 * 展开状态全部保存在本层，外层收起导致子树卸载时不会丢失用户选择。
 */
import { PureMarkdownRenderer } from '@/components/MarkdownRenderer';
import SvgIcon from '@/components/base/SvgIcon';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { dict } from '@/services/i18nRuntime';
import type { OpenUiArtifact } from '@/types/interfaces/openUi';
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

// 计时状态仅由标签持有，避免每秒重渲染整轮正文与工具详情。
const TraceMetrics: React.FC<{ turn: ConversationTurnPresentationV2 }> = ({
  turn,
}) => {
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

  // 多个缓存会话会同时留在 DOM 中，turn.key 不能作为跨实例唯一 id。
  const traceBodyId = `v2-trace-body-${React.useId().replace(/:/g, '')}`;
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
        {shownItems.map((item) => {
          if (
            item.kind === 'standalone' &&
            isOpenUiRenderElementNode(item.node)
          ) {
            return (
              <OpenUiTraceNode
                key={item.id}
                node={item.node}
                conversationId={conversationId}
                onOpenSidecar={onOpenSidecar}
              />
            );
          }
          if (!expanded) return null;
          // Plan 结构化任务清单由待办卡接管（无有效步骤数据时回落普通行）
          if (item.kind === 'standalone' && isTodoTraceNode(item.node)) {
            return <TodoTraceNode key={item.id} node={item.node} />;
          }
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
        {expanded && !revealHidden && hiddenCount > 0 && (
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
    </div>
  );
};

export default WorkTraceDisclosure;
