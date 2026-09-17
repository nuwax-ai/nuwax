/**
 * 会话页面缓存遥测面板：LRU 实例列表 + 执行中的页面实例分区。
 * 纯调试用途，由 ConversationCacheDebugFab 独立入口弹出（2026-09-17 拆分）。
 *
 * TODO(正式上线前移除): 调试面板，正式上线前随两个 debug 悬浮入口一并删除。
 */
import {
  conversationPageCacheManager,
  useConversationPageCache,
} from '@/features/conversation/react/useConversationPageCache';
import { InputNumber } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './ConversationCacheDebugPanel.module.less';

const cx = classNames.bind(styles);

const RESOURCE_LABELS = [
  ['terminalMounted', 'TERM'],
  ['terminalConnected', 'WS'],
  ['pageIframeMounted', 'IFRAME'],
  ['fileWorkspaceDirty', 'DIRTY'],
  ['desktopVisible', 'VNC'],
] as const;

const relativeTime = (timestamp: number) => {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m`;
};

const ConversationCacheDebugPanel: React.FC = () => {
  const snapshot = useConversationPageCache();
  const activeCount = snapshot.entries.filter(
    (entry) => entry.lifecycle === 'active',
  ).length;
  const executingEntries = snapshot.entries
    .filter((entry) => entry.executing)
    .sort(
      (left, right) =>
        (right.executingSince ?? right.lastAccessAt) -
        (left.executingSince ?? left.lastAccessAt),
    );
  const draftCount = snapshot.entries.filter(
    (entry) => entry.draft.hasContent,
  ).length;

  return (
    <section className={styles.panel} data-testid="conversation-cache-debug">
      <div className={styles.masthead}>
        <div>
          <div className={styles.eyebrowRow}>
            <span className={styles.debugBadge}>DEBUG</span>
            <span className={styles.eyebrow}>Runtime telemetry</span>
          </div>
          <div className={styles.title}>Conversation page cache</div>
          <div className={styles.debugHint}>debug-only · 正式上线前移除</div>
        </div>
        <label className={styles.capacity}>
          CAP
          <InputNumber
            className={styles.capacityInput}
            aria-label="conversation cache capacity"
            min={1}
            max={12}
            size="small"
            controls={false}
            value={snapshot.capacity}
            onChange={(value) => {
              if (typeof value === 'number') {
                conversationPageCacheManager.setCapacity(value);
              }
            }}
          />
        </label>
      </div>

      <div className={styles.summary}>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{snapshot.entries.length}</span>
          <span className={styles.metricLabel}>instances</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{activeCount}</span>
          <span className={styles.metricLabel}>active</span>
        </div>
        <div className={cx(styles.metric, styles.metricExecuting)}>
          <span className={styles.metricValue}>{executingEntries.length}</span>
          <span className={styles.metricLabel}>executing</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{draftCount}</span>
          <span className={styles.metricLabel}>drafts</span>
        </div>
      </div>

      <div className={styles.execSection}>
        <div className={styles.execHeader}>
          <span className={styles.eyebrow}>Executing instances</span>
          <span className={styles.execHint}>CREATE / EXECUTING</span>
        </div>
        {executingEntries.length === 0 ? (
          <div className={styles.execEmpty}>No executing instances</div>
        ) : (
          executingEntries.map((entry) => (
            <article
              key={entry.key}
              className={cx(
                styles.execRow,
                entry.key === snapshot.activeKey && styles.execRowActive,
              )}
            >
              <span className={styles.execBadge}>EXEC</span>
              <span className={styles.key} title={entry.key}>
                {entry.key}
              </span>
              <span className={styles.state}>{entry.lifecycle}</span>
              <span className={styles.state}>{entry.view}</span>
              <span className={styles.state}>
                run {relativeTime(entry.executingSince ?? entry.lastAccessAt)}
              </span>
              <span className={styles.state}>
                seen {relativeTime(entry.lastAccessAt)}
              </span>
              <span className={styles.state}>rev {entry.revision}</span>
            </article>
          ))
        )}
      </div>

      <div className={styles.list}>
        {snapshot.entries.length === 0 ? (
          <div className={styles.empty}>No cached conversation pages</div>
        ) : (
          snapshot.entries.map((entry, index) => {
            const active = entry.key === snapshot.activeKey;
            return (
              <article
                key={entry.key}
                className={cx(styles.entry, active && styles.entryActive)}
              >
                <div className={styles.entryTop}>
                  <span className={styles.state}>#{index + 1}</span>
                  <span className={styles.key} title={entry.key}>
                    {entry.key}
                  </span>
                  {entry.executing && (
                    <span className={cx(styles.state, styles.stateExec)}>
                      EXEC
                    </span>
                  )}
                  <span className={styles.state}>{entry.lifecycle}</span>
                  <span className={styles.state}>{entry.view}</span>
                  {!active && (
                    <button
                      type="button"
                      className={styles.invalidate}
                      onClick={() =>
                        conversationPageCacheManager.invalidate(
                          entry.key,
                          'debug-panel',
                        )
                      }
                    >
                      evict
                    </button>
                  )}
                </div>
                <div className={styles.entryMeta}>
                  <span>rev {entry.revision}</span>
                  <span>seen {relativeTime(entry.lastAccessAt)}</span>
                  <span>
                    draft {entry.draft.hasContent ? entry.draft.textLength : 0}c
                    /{entry.draft.skillCount}s
                  </span>
                </div>
                <div className={styles.resourceRow}>
                  {RESOURCE_LABELS.map(([key, label]) => {
                    const enabled = entry.resources[key];
                    return (
                      <span
                        key={key}
                        className={cx(
                          styles.resource,
                          enabled && styles.resourceOn,
                        )}
                      >
                        {label}:{enabled ? 'ON' : 'OFF'}
                      </span>
                    );
                  })}
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className={styles.footer}>
        <span>LRU newest → oldest</span>
        <span>
          VNC owner: {snapshot.sharedVncOwnerConversationId ?? 'none'}
        </span>
      </div>
    </section>
  );
};

export default ConversationCacheDebugPanel;
