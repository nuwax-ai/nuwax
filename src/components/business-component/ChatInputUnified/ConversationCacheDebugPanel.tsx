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
  ['terminalMounted', '终端'],
  ['terminalConnected', '终端连接'],
  ['pageIframeMounted', '页面iframe'],
  ['fileWorkspaceDirty', '文件未保存'],
  ['desktopVisible', '云电脑'],
] as const;

const LIFECYCLE_LABELS: Record<string, string> = {
  active: '激活',
  cached: '缓存',
  disposing: '销毁中',
};

const VIEW_LABELS: Record<string, string> = {
  closed: '面板收起',
  filePreview: '文件预览',
  terminal: '终端',
  desktop: '云电脑',
  pagePreview: '页面预览',
};

const relativeTime = (timestamp: number) => {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}秒`;
  return `${Math.floor(seconds / 60)}分`;
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
            <span className={styles.eyebrow}>运行时遥测</span>
          </div>
          <div className={styles.title}>会话页面缓存</div>
          <div className={styles.debugHint}>仅调试显示 · 正式上线前移除</div>
        </div>
        <label className={styles.capacity}>
          容量上限
          <InputNumber
            className={styles.capacityInput}
            aria-label="会话页面缓存容量上限"
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
          <span className={styles.metricLabel}>实例总数</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{activeCount}</span>
          <span className={styles.metricLabel}>当前激活</span>
        </div>
        <div className={cx(styles.metric, styles.metricExecuting)}>
          <span className={styles.metricValue}>{executingEntries.length}</span>
          <span className={styles.metricLabel}>执行中</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{draftCount}</span>
          <span className={styles.metricLabel}>含草稿</span>
        </div>
      </div>

      <div className={styles.execSection}>
        <div className={styles.execHeader}>
          <span className={styles.eyebrow}>执行中的页面实例</span>
          <span className={styles.execHint}>任务状态 CREATE / EXECUTING</span>
        </div>
        {executingEntries.length === 0 ? (
          <div className={styles.execEmpty}>暂无执行中的页面实例</div>
        ) : (
          executingEntries.map((entry) => (
            <article
              key={entry.key}
              className={cx(
                styles.execRow,
                entry.key === snapshot.activeKey && styles.execRowActive,
              )}
            >
              <span className={styles.execBadge}>执行中</span>
              <span className={styles.key} title={entry.key}>
                {entry.key}
              </span>
              <span className={styles.state}>
                {LIFECYCLE_LABELS[entry.lifecycle] ?? entry.lifecycle}
              </span>
              <span className={styles.state}>
                {VIEW_LABELS[entry.view] ?? entry.view}
              </span>
              <span className={styles.state}>
                已执行{' '}
                {relativeTime(entry.executingSince ?? entry.lastAccessAt)}
              </span>
              <span className={styles.state}>
                上次使用 {relativeTime(entry.lastAccessAt)}
              </span>
              <span className={styles.state}>第 {entry.revision} 次激活</span>
            </article>
          ))
        )}
      </div>

      <div className={styles.list}>
        {snapshot.entries.length === 0 ? (
          <div className={styles.empty}>暂无缓存的会话页面</div>
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
                      执行中
                    </span>
                  )}
                  <span className={styles.state}>
                    {LIFECYCLE_LABELS[entry.lifecycle] ?? entry.lifecycle}
                  </span>
                  <span className={styles.state}>
                    {VIEW_LABELS[entry.view] ?? entry.view}
                  </span>
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
                      淘汰
                    </button>
                  )}
                </div>
                <div className={styles.entryMeta}>
                  <span>第 {entry.revision} 次激活</span>
                  <span>上次使用 {relativeTime(entry.lastAccessAt)}</span>
                  <span>
                    草稿 {entry.draft.hasContent ? entry.draft.textLength : 0}
                    字/
                    {entry.draft.skillCount}技能
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
                        {label} {enabled ? '开' : '关'}
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
        <span>LRU 从新到旧排序</span>
        <span>VNC 占用：{snapshot.sharedVncOwnerConversationId ?? '无'}</span>
      </div>
    </section>
  );
};

export default ConversationCacheDebugPanel;
