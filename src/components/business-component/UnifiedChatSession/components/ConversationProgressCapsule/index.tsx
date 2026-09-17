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
  LoadingOutlined,
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

const StepGroup: React.FC<{
  title: string;
  steps: ProgressCapsuleStep[];
}> = ({ title, steps }) => {
  if (!steps.length) return null;
  return (
    <section className={cx(safeStyles.group)}>
      <div className={cx(safeStyles['group-title'])}>{title}</div>
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

const NodeGroup: React.FC<{
  title: string;
  nodes: ProgressCapsuleNode[];
  icon: React.ReactNode;
  monospace?: boolean;
}> = ({ title, nodes, icon, monospace }) => {
  if (!nodes.length) return null;
  return (
    <section className={cx(safeStyles.group)}>
      <div className={cx(safeStyles['group-title'])}>{title}</div>
      <ul className={cx(safeStyles['step-list'])}>
        {nodes.map((node) => (
          <NodeRow
            key={node.id}
            node={node}
            icon={icon}
            monospace={monospace}
          />
        ))}
      </ul>
    </section>
  );
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
  const [completedOpen, setCompletedOpen] = useState(true);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
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
      if (!rootRef.current?.contains(event.target as Node)) setExpanded(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
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
          {t('PC.Components.ConversationProgressCapsule.expandStatus')}
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

      <div
        className={cx(
          safeStyles['panel-wrap'],
          expanded && safeStyles['panel-wrap-open'],
        )}
        aria-hidden={!expanded}
        data-testid="capsule-panel-wrap"
      >
        <div className={cx(safeStyles.panel)}>
          <button
            type="button"
            className={cx(safeStyles['panel-collapse'])}
            data-testid="capsule-collapse"
            aria-label={t('PC.Components.ConversationProgressCapsule.collapse')}
            onClick={() => setExpanded(false)}
          >
            <ShrinkOutlined />
          </button>

          {enableVersionControl &&
            (gitDiff.summary || gitDiff.loading || gitDiff.branch) && (
              <section className={cx(safeStyles.group)}>
                <div className={cx(safeStyles['group-title'])}>
                  {t('PC.Components.ConversationProgressCapsule.gitTools')}
                </div>
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
            steps={[...activeSteps, ...pendingSteps]}
          />

          {model.totalCount > 0 && (
            <section className={cx(safeStyles.group)}>
              <div className={cx(safeStyles['group-title'])}>
                <span>
                  {t('PC.Components.ConversationProgressCapsule.progress')}
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

          <NodeGroup
            title={t('PC.Components.ConversationProgressCapsule.terminal')}
            nodes={model.terminals}
            icon={<CodeOutlined />}
            monospace
          />

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
      </div>
    </div>
  );
};

export default ConversationProgressCapsule;
