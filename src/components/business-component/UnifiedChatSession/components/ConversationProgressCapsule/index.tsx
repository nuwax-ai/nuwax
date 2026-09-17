import { t } from '@/services/i18nRuntime';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import {
  CheckCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  CodeOutlined,
  DownOutlined,
  FileTextOutlined,
  LoadingOutlined,
  RobotOutlined,
  StopOutlined,
  UpOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './index.less';
import {
  selectProgressCapsule,
  type ProgressCapsuleFileEdit,
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
  /** 智能体开启 git 版本管理：终态后拉取 git diff 文件汇总 */
  enableVersionControl?: boolean;
}

const StepRow: React.FC<{ step: ProgressCapsuleStep }> = ({ step }) => (
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
    <span>{step.content}</span>
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
        monospace && safeStyles['node-mono'],
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

interface FileChangeRowData {
  key: string;
  text: string;
  additions: number;
  deletions: number;
  monospace?: boolean;
  status?: ProgressCapsuleFileEdit['status'];
}

const FileChangeGroup: React.FC<{
  title: string;
  meta?: React.ReactNode;
  loading?: boolean;
  rows: FileChangeRowData[];
}> = ({ title, meta, loading, rows }) => {
  if (!rows.length && !loading) return null;
  return (
    <section className={cx(safeStyles.group)}>
      <div className={cx(safeStyles['group-title'])}>
        <span>{title}</span>
        <span className={cx(safeStyles['group-meta'])}>
          {loading ? <LoadingOutlined spin /> : meta}
        </span>
      </div>
      {!!rows.length && (
        <ul className={cx(safeStyles['step-list'])}>
          {rows.map((row) => (
            <li
              key={row.key}
              className={cx(
                safeStyles.node,
                row.status && safeStyles[`node-${row.status}`],
              )}
              title={row.text}
            >
              <span className={cx(safeStyles['node-kind-icon'])} aria-hidden>
                <FileTextOutlined />
              </span>
              <span
                className={cx(
                  safeStyles['node-text'],
                  row.monospace && safeStyles['node-mono'],
                )}
              >
                {row.text}
              </span>
              <span className={cx(safeStyles.stat)}>
                <span className={cx(safeStyles['stat-add'])}>
                  +{row.additions}
                </span>
                <span className={cx(safeStyles['stat-del'])}>
                  −{row.deletions}
                </span>
              </span>
              {row.status && (
                <span
                  className={cx(safeStyles['node-status-icon'])}
                  aria-hidden
                >
                  {nodeStatusIcon(row.status)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

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

const ConversationProgressCapsule: React.FC<
  ConversationProgressCapsuleProps
> = ({ conversationId, messageList, active, enableVersionControl }) => {
  const model = useMemo(
    () => selectProgressCapsule(messageList, active),
    [active, messageList],
  );
  const [expanded, setExpanded] = useState(false);
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
  // 文件变更：终态后 git 口径优先（版本管理开启），执行期/兜底用 V2 投影编辑行数
  const gitFiles = gitDiff.summary?.files ?? [];
  const fileRows: FileChangeRowData[] = gitDiff.summary
    ? gitFiles.map((file) => ({
        key: `git-${file.file}`,
        text: file.file,
        additions: file.insertions,
        deletions: file.deletions,
        monospace: true,
      }))
    : model.fileEdits.map((edit) => ({
        key: edit.id,
        text:
          edit.path ||
          t(
            'PC.Components.ConversationRendererV2.toolTargetFiles',
            edit.fileCount,
          ),
        additions: edit.additions,
        deletions: edit.deletions,
        status: edit.status,
      }));
  const progressText = model.totalCount
    ? `${model.completedCount}/${model.totalCount}`
    : model.running
    ? t('PC.Components.ConversationProgressCapsule.running')
    : '';
  // 选择器兜底留空（保持纯函数）：运行中用 running 词条、终态用终态词条占位。
  const statusLabel = terminalStatusLabel(model.terminalStatus);
  const actionText =
    model.currentAction ||
    (model.running
      ? t('PC.Components.ConversationProgressCapsule.running')
      : statusLabel);

  return (
    <div
      ref={rootRef}
      className={cx(safeStyles.capsule, expanded && safeStyles.expanded)}
      data-testid="conversation-progress-capsule"
    >
      <button
        type="button"
        className={cx(safeStyles.trigger)}
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
        <span className={cx(safeStyles.action)}>{actionText}</span>
        <span className={cx(safeStyles.count)}>{progressText}</span>
        {expanded ? <UpOutlined /> : <DownOutlined />}
      </button>

      {expanded && (
        <div className={cx(safeStyles.panel)}>
          <div className={cx(safeStyles['panel-title'])}>
            <span>
              {t('PC.Components.ConversationProgressCapsule.progress')}
            </span>
            <span>{progressText}</span>
          </div>
          <div className={cx(safeStyles['current-action'])}>
            {model.running ? (
              <LoadingOutlined spin />
            ) : (
              terminalStatusIcon(model.terminalStatus)
            )}
            <span>{actionText}</span>
          </div>
          <div className={cx(safeStyles.groups)}>
            <StepGroup
              title={t('PC.Components.ConversationProgressCapsule.current')}
              steps={activeSteps}
            />
            <StepGroup
              title={t(
                'PC.Components.ConversationProgressCapsule.completed',
                completedSteps.length,
              )}
              steps={completedSteps}
            />
            <StepGroup
              title={t(
                'PC.Components.ConversationProgressCapsule.pending',
                pendingSteps.length,
              )}
              steps={pendingSteps}
            />
            <FileChangeGroup
              title={t(
                'PC.Components.ConversationProgressCapsule.fileChanges',
                fileRows.length,
              )}
              loading={gitDiff.loading}
              meta={
                gitDiff.summary
                  ? `+${gitDiff.summary.insertions} −${gitDiff.summary.deletions}`
                  : undefined
              }
              rows={fileRows}
            />
            <NodeGroup
              title={t('PC.Components.ConversationProgressCapsule.terminal')}
              nodes={model.terminals}
              icon={<CodeOutlined />}
              monospace
            />
            <NodeGroup
              title={t('PC.Components.ConversationProgressCapsule.subagent')}
              nodes={model.subagents}
              icon={<RobotOutlined />}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationProgressCapsule;
