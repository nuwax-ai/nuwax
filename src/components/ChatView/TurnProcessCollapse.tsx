import MarkdownRenderer from '@/components/MarkdownRenderer';
import type { ProcessSummaryMetrics } from '@/features/conversation/presentation/conversationTurnPresentation';
import { useConversationDensity } from '@/hooks/useConversationDensity';
import useMarkdownRender from '@/hooks/useMarkdownRender';
import { dict } from '@/services/i18nRuntime';
import { DownOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './turnProcessCollapse.less';

const cx = classNames.bind(styles);

export interface TurnProcessCollapseProps {
  id: string;
  conversationId?: string | number;
  markdown: string;
  metrics: ProcessSummaryMetrics;
  isTerminal: boolean;
}

const formatDuration = (milliseconds: number) => {
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  if (seconds < 60)
    return `${seconds}${dict('PC.Components.TurnProcess.seconds')}`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds
    ? `${minutes}${dict(
        'PC.Components.TurnProcess.minutes',
      )} ${remainingSeconds}${dict('PC.Components.TurnProcess.seconds')}`
    : `${minutes}${dict('PC.Components.TurnProcess.minutes')}`;
};

const TurnProcessCollapse: React.FC<TurnProcessCollapseProps> = ({
  id,
  conversationId,
  markdown,
  metrics,
  isTerminal,
}) => {
  const { density } = useConversationDensity();
  const defaultExpanded =
    density === 'detailed' || (density === 'normal' && !isTerminal);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const userChangedRef = useRef(false);
  const previousTerminalRef = useRef(isTerminal);
  const [, forceClockTick] = useState(0);
  const contentId = `${id}-turn-process-content`;
  const { markdownRef, messageIdRef } = useMarkdownRender({
    answer: markdown,
    thinking: '',
    id: `${id}-turn-process`,
  });

  useEffect(() => {
    if (!userChangedRef.current) {
      if (density === 'detailed') setIsExpanded(true);
      if (density === 'compact') setIsExpanded(false);
      if (density === 'normal') setIsExpanded(!isTerminal);
    }
    previousTerminalRef.current = isTerminal;
  }, [density, isTerminal]);

  useEffect(() => {
    if (isTerminal || !metrics.startedAt || metrics.endedAt) return;
    const timer = window.setInterval(
      () => forceClockTick((value) => value + 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [isTerminal, metrics.endedAt, metrics.startedAt]);

  const elapsedLabel = useMemo(() => {
    if (!metrics.startedAt) return '';
    const end = metrics.endedAt || Date.now();
    if (end < metrics.startedAt) return '';
    return formatDuration(end - metrics.startedAt);
  }, [metrics.endedAt, metrics.startedAt, isTerminal]);

  const headerParts = [
    metrics.toolCallCount > 0
      ? `${metrics.toolCallCount} ${dict(
          'PC.Components.MarkdownRenderer.executedProcesses',
        )}`
      : dict('PC.Components.MarkdownRenderer.executionProcess'),
    metrics.messageCount > 0
      ? `${metrics.messageCount} ${dict('PC.Components.TurnProcess.messages')}`
      : '',
    elapsedLabel
      ? `${dict('PC.Components.TurnProcess.worked')} ${elapsedLabel}`
      : '',
  ].filter(Boolean);

  const toggle = () => {
    userChangedRef.current = true;
    setIsExpanded((value) => !value);
  };

  return (
    <div className={cx(styles.container)} data-testid="turn-process-collapse">
      <button
        type="button"
        className={cx(styles.header)}
        data-testid="turn-process-header"
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onClick={toggle}
      >
        <span>{headerParts.join(' · ')}</span>
        <DownOutlined
          aria-hidden="true"
          className={cx(styles.icon, { [styles.expanded]: isExpanded })}
        />
      </button>
      <div
        id={contentId}
        className={cx(styles.content, { [styles.expanded]: isExpanded })}
        aria-hidden={!isExpanded}
      >
        <div className={cx(styles.contentInner)}>
          <MarkdownRenderer
            key={`${messageIdRef.current}`}
            id={`${messageIdRef.current}`}
            markdownRef={markdownRef}
            conversationId={conversationId}
            answer={markdown}
            thinking=""
            collapseProcessGroups={false}
            autoCollapseEnabled={false}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(TurnProcessCollapse);
