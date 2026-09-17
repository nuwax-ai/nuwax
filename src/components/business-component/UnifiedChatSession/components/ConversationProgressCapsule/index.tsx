import { t } from '@/services/i18nRuntime';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import {
  BranchesOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  CloudUploadOutlined,
  CodeOutlined,
  DiffOutlined,
  DownOutlined,
  FileTextOutlined,
  LoadingOutlined,
  OrderedListOutlined,
  RightOutlined,
  RobotOutlined,
  ShrinkOutlined,
  StopOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './index.less';
import {
  selectProgressCapsule,
  type ProgressCapsuleNode,
  type ProgressCapsuleStep,
} from './selectProgressCapsule';
import { useGitDiffFiles } from './useGitDiffFiles';

const cx = classNames.bind(styles);
const safeStyles = styles ?? ({} as typeof styles);

/** 终端列表折叠阈值：超过默认只展示前 5 条，点击展开全部 */
const TERMINAL_COLLAPSE_LIMIT = 5;

// JS 逐帧驱动面板渐显动效（纯 opacity 淡入/淡出）：rAF 对齐刷新率（平滑），
// 24ms 未触发则降级 setTimeout 兜底（该环境 CSS 动画被系统设置冻结）。
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

const animatePanelFade = (
  panel: HTMLElement,
  duration: number,
  reverse: boolean,
  onDone?: () => void,
): (() => void) => {
  const from = reverse ? 1 : 0;
  const to = reverse ? 0 : 1;
  const start = performance.now();
  let timer = 0;
  let rafId = 0;
  let stopped = false;
  const finish = () => {
    if (!reverse) panel.style.opacity = '';
    onDone?.();
  };
  const tick = () => {
    if (stopped) return;
    const p = Math.min(1, (performance.now() - start) / duration);
    const e = easeOutCubic(p);
    panel.style.opacity = (from + (to - from) * e).toFixed(3);
    if (p < 1) {
      // 自递归调度：rAF 对齐刷新率，24ms 未触发降级 setTimeout 兜底
      let fired = false;
      const run = () => {
        if (fired || stopped) return;
        fired = true;
        tick();
      };
      if (typeof requestAnimationFrame === 'function') {
        rafId = requestAnimationFrame(run);
      }
      timer = window.setTimeout(run, 24);
    } else {
      finish();
    }
  };
  let firstFired = false;
  const firstRun = () => {
    if (firstFired || stopped) return;
    firstFired = true;
    tick();
  };
  if (typeof requestAnimationFrame === 'function') {
    rafId = requestAnimationFrame(firstRun);
  }
  timer = window.setTimeout(firstRun, 24);
  return () => {
    stopped = true;
    window.clearTimeout(timer);
    if (rafId) cancelAnimationFrame(rafId);
  };
};

interface ConversationProgressCapsuleProps {
  conversationId?: number;
  messageList: MessageInfo[];
  active: boolean;
  /** 智能体开启 git 版本管理：终态后展示更改统计与分支 */
  enableVersionControl?: boolean;
  /** 「提交或推送」入口回调；未提供时该行不渲染 */
  onCommitOrPush?: () => void;
}

/** 触发器右侧「更改」统计（git 口径优先，回退 V2 编辑行数聚合） */
interface ChangeStats {
  insertions: number;
  deletions: number;
}

const StepRow: React.FC<{ step: ProgressCapsuleStep; strike?: boolean }> = ({
  step,
  strike,
}) => (
  <li className={cx(safeStyles.step, safeStyles[`step-${step.status}`])}>
    <span className={cx(safeStyles['step-icon'])} aria-hidden>
      {step.status === 'completed' ? (
        <CheckOutlined />
      ) : step.status === 'active' ? (
        <LoadingOutlined spin />
      ) : (
        <span className={cx(safeStyles.dot)} />
      )}
    </span>
    <span
      className={cx(
        safeStyles['step-text'],
        strike && safeStyles.strike,
        safeStyles.truncate,
      )}
    >
      {step.content}
    </span>
  </li>
);

const GroupTitle: React.FC<{
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon, children }) => (
  <div className={cx(safeStyles['group-title'])}>
    <span className={cx(safeStyles['group-title-icon'])} aria-hidden>
      {icon}
    </span>
    <span className={cx(safeStyles['group-title-text'])}>{children}</span>
  </div>
);

const StepGroup: React.FC<{
  title: string;
  icon: React.ReactNode;
  steps: ProgressCapsuleStep[];
}> = ({ title, icon, steps }) => {
  if (!steps.length) return null;
  return (
    <section className={cx(safeStyles.group)}>
      <GroupTitle icon={icon}>{title}</GroupTitle>
      <ul className={cx(safeStyles['step-list'])}>
        {steps.map((step, index) => (
          <StepRow
            key={`${step.status}-${index}-${step.content}`}
            step={step}
          />
        ))}
      </ul>
    </section>
  );
};

const nodeStatusIcon = (status: ProgressCapsuleNode['status']) => {
  if (status === 'running') return <LoadingOutlined spin />;
  if (status === 'finished') return <CheckOutlined />;
  if (status === 'failed') return <CloseOutlined />;
  return <span className={cx(safeStyles.dot)} />;
};

const NodeRow: React.FC<{
  node: ProgressCapsuleNode;
  icon: React.ReactNode;
  monospace?: boolean;
}> = ({ node, icon, monospace }) => (
  <li
    className={cx(safeStyles.node, safeStyles[`node-${node.status}`])}
    title={node.command || node.title}
  >
    <span className={cx(safeStyles['node-kind-icon'])} aria-hidden>
      {icon}
    </span>
    <span
      className={cx(
        safeStyles['node-text'],
        safeStyles.truncate,
        monospace && safeStyles.mono,
      )}
    >
      {node.command || node.title}
    </span>
    <span className={cx(safeStyles['node-status-icon'])} aria-hidden>
      {nodeStatusIcon(node.status)}
    </span>
  </li>
);

const terminalStatusLabel = (status?: 'complete' | 'error' | 'stopped') => {
  if (status === 'error') {
    return t('PC.Components.ConversationProgressCapsule.failed');
  }
  if (status === 'stopped') {
    return t('PC.Components.ConversationProgressCapsule.stopped');
  }
  return t('PC.Components.ConversationProgressCapsule.finished');
};

const terminalStatusIcon = (status?: 'complete' | 'error' | 'stopped') => {
  if (status === 'error') {
    return (
      <WarningOutlined
        className={cx(safeStyles['status-icon'], safeStyles['status-error'])}
      />
    );
  }
  if (status === 'stopped') {
    return (
      <StopOutlined
        className={cx(safeStyles['status-icon'], safeStyles['status-stopped'])}
      />
    );
  }
  return (
    <CheckCircleOutlined
      className={cx(safeStyles['status-icon'], safeStyles['status-done'])}
    />
  );
};

const ChangeStatsView: React.FC<{ stats: ChangeStats }> = ({ stats }) => (
  <>
    <span className={cx(safeStyles['stat-add'])}>+{stats.insertions}</span>
    <span className={cx(safeStyles['stat-del'])}>−{stats.deletions}</span>
  </>
);

const ConversationProgressCapsule: React.FC<
  ConversationProgressCapsuleProps
> = ({
  conversationId,
  messageList,
  active,
  enableVersionControl,
  onCommitOrPush,
}) => {
  const model = useMemo(
    () => selectProgressCapsule(messageList, active),
    [active, messageList],
  );
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(true);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [terminalsOpen, setTerminalsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const motionCleanupRef = useRef<(() => void) | undefined>(undefined);

  // 挂载即播进场动效（从右向左滑出揭示）
  useEffect(() => {
    if (!expanded || !panelRef.current) return;
    motionCleanupRef.current?.();
    motionCleanupRef.current = animatePanelFade(panelRef.current, 280, false);
  }, [expanded, model?.turnKey]);

  useEffect(
    () => () => {
      motionCleanupRef.current?.();
    },
    [],
  );

  // 收起先播退场动效（向右收回）再卸载面板：收起态 DOM 无面板，胶囊宽度贴合触发器内容
  const closePanel = () => {
    if (closing) return;
    const panel = panelRef.current;
    if (!panel) {
      setExpanded(false);
      return;
    }
    setClosing(true);
    motionCleanupRef.current?.();
    motionCleanupRef.current = animatePanelFade(panel, 240, true, () => {
      setExpanded(false);
      setClosing(false);
    });
  };
  const gitDiff = useGitDiffFiles({
    conversationId,
    enabled: enableVersionControl,
    turnKey: model?.turnKey,
    running: model?.running,
  });

  useEffect(() => setExpanded(false), [conversationId, model?.turnKey]);

  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closePanel();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePanel();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [expanded]);

  if (!model) return null;

  const activeSteps = model.steps.filter((step) => step.status === 'active');
  const completedSteps = model.steps.filter(
    (step) => step.status === 'completed',
  );
  const pendingSteps = model.steps.filter((step) => step.status === 'pending');
  // 更改统计：git 口径优先，未开版本管理/未拉到时回退 V2 编辑行数聚合
  const changeStats: ChangeStats | null = gitDiff.summary
    ? {
        insertions: gitDiff.summary.insertions,
        deletions: gitDiff.summary.deletions,
      }
    : model.fileEdits.length
    ? {
        insertions: model.fileEdits.reduce(
          (total, edit) => total + edit.additions,
          0,
        ),
        deletions: model.fileEdits.reduce(
          (total, edit) => total + edit.deletions,
          0,
        ),
      }
    : null;
  const agentsRunning = model.subagents.some(
    (agent) => agent.status === 'running',
  );

  return (
    <div
      ref={rootRef}
      className={cx(safeStyles.capsule, expanded && safeStyles.expanded)}
      data-testid="conversation-progress-capsule"
    >
      <button
        type="button"
        className={cx(safeStyles.trigger)}
        data-testid="capsule-trigger"
        aria-expanded={expanded}
        aria-label={
          expanded
            ? t('PC.Components.ConversationProgressCapsule.collapse')
            : t('PC.Components.ConversationProgressCapsule.expand')
        }
        onClick={() => setExpanded((value) => !value)}
      >
        {model.running ? (
          <LoadingOutlined spin className={cx(safeStyles.spinner)} />
        ) : (
          terminalStatusIcon(model.terminalStatus)
        )}
        <span className={cx(safeStyles['trigger-label'])}>
          {model.currentAction ||
            (model.running
              ? t('PC.Components.ConversationProgressCapsule.running')
              : terminalStatusLabel(model.terminalStatus))}
        </span>
        {changeStats && (
          <span className={cx(safeStyles.chip)}>
            <DiffOutlined />
            <span>
              {t('PC.Components.ConversationProgressCapsule.changes')}
            </span>
            <ChangeStatsView stats={changeStats} />
          </span>
        )}
      </button>

      {expanded && (
        <button
          type="button"
          className={cx(safeStyles['panel-collapse'])}
          data-testid="capsule-collapse"
          aria-label={t('PC.Components.ConversationProgressCapsule.collapse')}
          onClick={closePanel}
        >
          <ShrinkOutlined />
        </button>
      )}

      {expanded && (
        <div ref={panelRef} className={cx(safeStyles.panel)}>
          {(model.taskResults.length > 0 || model.finalResult) && (
            <section className={cx(safeStyles.group)}>
              <GroupTitle icon={<FileTextOutlined />}>
                {t('PC.Components.ConversationProgressCapsule.taskResult')}
              </GroupTitle>
              {model.taskResults.map((item) => (
                <div
                  key={item.key}
                  className={cx(safeStyles['result-row'])}
                  title={item.description || item.file}
                >
                  <span
                    className={cx(safeStyles['node-kind-icon'])}
                    aria-hidden
                  >
                    <FileTextOutlined />
                  </span>
                  <span
                    className={cx(safeStyles['node-text'], safeStyles.truncate)}
                  >
                    {item.description || item.file}
                  </span>
                  <span className={cx(safeStyles['chevron-dim'])} aria-hidden>
                    <RightOutlined />
                  </span>
                </div>
              ))}
              {!model.taskResults.length && model.finalResult && (
                <div
                  className={cx(safeStyles['result-card'])}
                  title={model.finalResult}
                >
                  {model.finalResult}
                </div>
              )}
            </section>
          )}
          <button
            type="button"
            className={cx(safeStyles['panel-collapse'])}
            data-testid="capsule-collapse"
            aria-label={t('PC.Components.ConversationProgressCapsule.collapse')}
            onClick={closePanel}
          >
            <ShrinkOutlined />
          </button>

          {enableVersionControl &&
            (gitDiff.summary || gitDiff.loading || gitDiff.branch) && (
              <section className={cx(safeStyles.group)}>
                <GroupTitle icon={<BranchesOutlined />}>
                  {t('PC.Components.ConversationProgressCapsule.gitTools')}
                </GroupTitle>
                <div className={cx(safeStyles.node)}>
                  <span
                    className={cx(safeStyles['node-kind-icon'])}
                    aria-hidden
                  >
                    <DiffOutlined />
                  </span>
                  <span className={cx(safeStyles['node-text'])}>
                    {t('PC.Components.ConversationProgressCapsule.changes')}
                  </span>
                  <span className={cx(safeStyles.stat)}>
                    {gitDiff.loading ? (
                      <LoadingOutlined spin />
                    ) : gitDiff.summary ? (
                      <ChangeStatsView
                        stats={{
                          insertions: gitDiff.summary.insertions,
                          deletions: gitDiff.summary.deletions,
                        }}
                      />
                    ) : null}
                  </span>
                </div>
                {gitDiff.branch && (
                  <div className={cx(safeStyles.node)} title={gitDiff.branch}>
                    <span
                      className={cx(safeStyles['node-kind-icon'])}
                      aria-hidden
                    >
                      <BranchesOutlined />
                    </span>
                    <span className={cx(safeStyles['node-text'])}>
                      {gitDiff.branch}
                    </span>
                    <DownOutlined className={cx(safeStyles['chevron-dim'])} />
                  </div>
                )}
                {onCommitOrPush && (
                  <button
                    type="button"
                    className={cx(safeStyles['action-row'])}
                    onClick={onCommitOrPush}
                  >
                    <CloudUploadOutlined />
                    <span>
                      {t(
                        'PC.Components.ConversationProgressCapsule.commitOrPush',
                      )}
                    </span>
                  </button>
                )}
              </section>
            )}

          <StepGroup
            title={t('PC.Components.ConversationProgressCapsule.plan')}
            icon={<OrderedListOutlined />}
            steps={[...activeSteps, ...pendingSteps]}
          />

          {model.totalCount > 0 && (
            <section className={cx(safeStyles.group)}>
              <div className={cx(safeStyles['group-title'])}>
                <span className={cx(safeStyles['group-title-main'])}>
                  <span
                    className={cx(safeStyles['group-title-icon'])}
                    aria-hidden
                  >
                    <OrderedListOutlined />
                  </span>
                  <span className={cx(safeStyles['group-title-text'])}>
                    {t('PC.Components.ConversationProgressCapsule.progress')}
                  </span>
                </span>
                <span className={cx(safeStyles.counter)}>
                  {model.completedCount}/{model.totalCount}
                </span>
              </div>
              {completedSteps.length > 0 && (
                <>
                  <button
                    type="button"
                    className={cx(safeStyles['group-toggle'])}
                    aria-expanded={completedOpen}
                    onClick={() => setCompletedOpen((value) => !value)}
                  >
                    <RightOutlined
                      className={cx(
                        safeStyles['toggle-chevron'],
                        completedOpen && safeStyles['toggle-chevron-open'],
                      )}
                    />
                    <span>
                      {t(
                        'PC.Components.ConversationProgressCapsule.completed',
                        completedSteps.length,
                      )}
                    </span>
                  </button>
                  {completedOpen && (
                    <ul className={cx(safeStyles['step-list'])}>
                      {completedSteps.map((step, index) => (
                        <StepRow
                          key={`${step.status}-${index}-${step.content}`}
                          step={step}
                          strike
                        />
                      ))}
                    </ul>
                  )}
                </>
              )}
            </section>
          )}

          {model.terminals.length > 0 && (
            <section className={cx(safeStyles.group)}>
              <GroupTitle icon={<CodeOutlined />}>
                {t('PC.Components.ConversationProgressCapsule.terminal')}
              </GroupTitle>
              <ul className={cx(safeStyles['step-list'])}>
                {(terminalsOpen
                  ? model.terminals
                  : model.terminals.slice(0, TERMINAL_COLLAPSE_LIMIT)
                ).map((node) => (
                  <NodeRow
                    key={node.id}
                    node={node}
                    icon={<CodeOutlined />}
                    monospace
                  />
                ))}
              </ul>
              {model.terminals.length > TERMINAL_COLLAPSE_LIMIT && (
                <button
                  type="button"
                  className={cx(safeStyles['group-toggle'])}
                  aria-expanded={terminalsOpen}
                  onClick={() => setTerminalsOpen((value) => !value)}
                >
                  <DownOutlined
                    className={cx(
                      safeStyles['toggle-chevron'],
                      terminalsOpen && safeStyles['toggle-chevron-down-open'],
                    )}
                  />
                  <span>
                    {terminalsOpen
                      ? t(
                          'PC.Components.ConversationProgressCapsule.terminalCollapse',
                          model.terminals.length,
                        )
                      : t(
                          'PC.Components.ConversationProgressCapsule.terminalExpand',
                          model.terminals.length,
                        )}
                  </span>
                </button>
              )}
            </section>
          )}

          {model.subagents.length > 0 && (
            <section className={cx(safeStyles.group)}>
              <button
                type="button"
                className={cx(safeStyles['group-toggle'])}
                aria-expanded={agentsOpen}
                onClick={() => setAgentsOpen((value) => !value)}
              >
                <span>
                  {t('PC.Components.ConversationProgressCapsule.agents')}
                </span>
                <DownOutlined
                  className={cx(
                    safeStyles['toggle-chevron'],
                    agentsOpen && safeStyles['toggle-chevron-down-open'],
                  )}
                />
              </button>
              {agentsOpen ? (
                <ul className={cx(safeStyles['step-list'])}>
                  {model.subagents.map((agent) => (
                    <NodeRow
                      key={agent.id}
                      node={agent}
                      icon={<RobotOutlined />}
                    />
                  ))}
                </ul>
              ) : (
                <button
                  type="button"
                  className={cx(safeStyles['summary-row'])}
                  onClick={() => setAgentsOpen(true)}
                >
                  {agentsRunning ? (
                    <LoadingOutlined spin />
                  ) : (
                    <CheckOutlined className={cx(safeStyles['summary-done'])} />
                  )}
                  <span className={cx(safeStyles['node-text'])}>
                    {agentsRunning
                      ? t('PC.Components.ConversationProgressCapsule.running')
                      : t(
                          'PC.Components.ConversationProgressCapsule.finished',
                        )}{' '}
                    {model.subagents.length}
                  </span>
                  <RightOutlined className={cx(safeStyles['chevron-dim'])} />
                </button>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default ConversationProgressCapsule;
