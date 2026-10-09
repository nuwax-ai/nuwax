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
import React, { useEffect, useMemo, useState } from 'react';
import { defaultTraceExpanded } from '../renderPreferences';
import { isOpenUiRenderElementNode, isTodoTraceNode } from '../traceItems';
import { buildTraceViewModel } from '../traceViewModel';
import type {
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
import { useTraceDisclosure } from './useTraceDisclosure';

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
    : formatElapsed(
        typeof elapsedMs === 'number' && elapsedMs >= 1000
          ? elapsedMs
          : undefined,
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
  const model = useMemo(
    () => buildTraceViewModel(turn, preferences, revealHidden),
    [
      turn.nodes,
      turn.running,
      turn.finalAnswer.text,
      preferences,
      revealHidden,
    ],
  );
  const { segments, hiddenCount } = model;
  const {
    nodeIsExpanded,
    toggleNode,
    groupIsExpanded,
    toggleGroup,
    segmentDisclosure,
    toggleSegment,
    revealSegments,
  } = useTraceDisclosure(
    model,
    turn.nodes,
    preferences,
    turn.running,
    expanded,
  );

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
    // 过程说明与工具详情同属轨迹内容，整轮收起时一并卸载。
    if (!showDetails) return null;
    if (item.kind === 'narration') {
      return (
        <NarrationText key={item.id} narrationId={item.id}>
          {item.node.text ?? ''}
        </NarrationText>
      );
    }
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
          onToggle={() => toggleGroup(item)}
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
          const items = segment.items;
          const {
            mounted,
            expanded: segmentIsExpanded,
            showToggle: showSegmentToggle,
          } = segmentDisclosure(segment);
          if (!mounted) return null;
          const segmentBodyId = `${traceBodyId}-segment-${segmentIndex}`;
          return (
            <div
              key={segment.id}
              className={cx(styles['trace-segment'])}
              data-trace-segment-id={segment.id}
              data-trace-segment-active={segment.active ? 'true' : 'false'}
              data-trace-segment-expanded={segmentIsExpanded ? 'true' : 'false'}
            >
              {showSegmentToggle && (
                <button
                  type="button"
                  className={cx(styles['trace-segment-toggle'])}
                  data-testid="v2-trace-segment-toggle"
                  aria-expanded={segmentIsExpanded}
                  aria-controls={segmentBodyId}
                  onClick={() => toggleSegment(segment.id, segmentIsExpanded)}
                >
                  <TraceMetrics
                    turn={{ running: false, metrics: segment.metrics }}
                  />
                  {segment.failed && (
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
              revealSegments();
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
