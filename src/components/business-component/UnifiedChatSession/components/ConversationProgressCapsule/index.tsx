import { usePageModel } from '@/modelScopes/usePageModel';
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
  LayoutOutlined,
  LoadingOutlined,
  OrderedListOutlined,
  RightOutlined,
  RobotOutlined,
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
  /** 面板展开态（受控）：由页头「会话进度」按钮驱动，组件自身无触发器 */
  open: boolean;
  /** 请求收起面板：关闭按钮 / 外点 / Esc / 新轮次时回调，由外部置 open=false */
  onClose: () => void;
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
  open,
  onClose,
}) => {
  const model = useMemo(
    () => selectProgressCapsule(messageList, active),
    [active, messageList],
  );
  const {
    openPreviewView,
    setTaskAgentSelectedFileId,
    setTaskAgentSelectTrigger,
  } = usePageModel('conversationInfo') as {
    openPreviewView: (
      cid: number,
      opts?: { forceRefresh?: boolean },
    ) => Promise<void>;
    setTaskAgentSelectedFileId: (fileId: string) => void;
    setTaskAgentSelectTrigger: (trigger: number) => void;
  };
  // 面板可见性：受控 open 的当帧落地值，退场动效播完才置 false 卸载 DOM
  const [panelVisible, setPanelVisible] = useState(open);
  const [completedOpen, setCompletedOpen] = useState(true);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [terminalsOpen, setTerminalsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const motionCleanupRef = useRef<(() => void) | undefined>(undefined);
  // onClose 常为页面内联箭头函数，经 ref 转发避免外点/Esc 订阅随父渲染反复重建
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  /** 打开任务结果产物文件：对齐会话输出 <task-result> 的点击口径 */
  const handleOpenTaskResult = async (file: string) => {
    if (!conversationId) return;
    let fileId = file.split(`${conversationId}/`).pop();
    if (fileId?.endsWith('/')) fileId = fileId.slice(0, -1);
    if (!fileId) return;
    await openPreviewView(Number(conversationId), { forceRefresh: true });
    setTaskAgentSelectedFileId(fileId);
    setTaskAgentSelectTrigger(Date.now());
  };

  /** 打开 OpenUI 产物预览：对齐 V1 handleOpenUiSidecar 口径（data/{artifactId}.openui.json） */
  const handleOpenOpenUiPreview = async (artifactId: string) => {
    if (!conversationId) return;
    await openPreviewView(Number(conversationId), { forceRefresh: true });
    setTaskAgentSelectedFileId(`data/${artifactId}.openui.json`);
    setTaskAgentSelectTrigger(Date.now());
  };

  // open 翻转衔接（声明须早于淡入 effect，同帧先处理状态再播动效）：
  // true → 挂载面板；false → 先播退场动效再卸载，收起态 DOM 无面板。
  // panelVisible 取当帧渲染值即可，勿入 deps（入 deps 会在动效收尾重渲染后重复执行）。
  useEffect(() => {
    if (open) {
      // 快速关-开场景：中断进行中的退场动效，恢复可见由淡入 effect 接管
      motionCleanupRef.current?.();
      motionCleanupRef.current = undefined;
      setPanelVisible(true);
      return;
    }
    if (!panelVisible) return;
    const panel = panelRef.current;
    if (!panel) {
      setPanelVisible(false);
      return;
    }
    motionCleanupRef.current?.();
    motionCleanupRef.current = animatePanelFade(panel, 240, true, () => {
      setPanelVisible(false);
    });
  }, [open]);

  // 面板挂载即播进场淡入；同轮内容更新（turnKey 不变）不重播
  useEffect(() => {
    if (!panelVisible || !open || !panelRef.current) return;
    motionCleanupRef.current?.();
    motionCleanupRef.current = animatePanelFade(panelRef.current, 280, false);
  }, [panelVisible, open, model?.turnKey]);

  useEffect(
    () => () => {
      motionCleanupRef.current?.();
    },
    [],
  );

  const gitDiff = useGitDiffFiles({
    conversationId,
    enabled: enableVersionControl,
    turnKey: model?.turnKey,
    running: model?.running,
  });

  // 切会话 / 新一轮开跑：面板自动收起（同轮终态常驻不收起）。
  // 挂载首帧跳过：open=true 挂载属于外部既定状态，不触发误收起。
  const skipFirstTurnEffectRef = useRef(true);
  useEffect(() => {
    if (skipFirstTurnEffectRef.current) {
      skipFirstTurnEffectRef.current = false;
      return;
    }
    if (open) onCloseRef.current?.();
  }, [conversationId, model?.turnKey]);

  // 无可展示内容（新轮未产出）：组件整体隐藏，同时收敛外部展开态防悬空
  useEffect(() => {
    if (open && !model) onCloseRef.current?.();
  }, [open, model]);

  // 外点 / Esc 收起：页头触发按钮区域（data-capsule-panel-trigger）不算外点，
  // 点击按钮的开关交给按钮自身 toggle，避免「先外点收起又立即展开」打架
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (rootRef.current?.contains(target)) return;
      if (target.closest?.('[data-capsule-panel-trigger]')) return;
      onCloseRef.current?.();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current?.();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!model || !panelVisible) return null;

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
      className={cx(safeStyles.capsule)}
      data-testid="conversation-progress-capsule"
    >
      <div
        ref={panelRef}
        className={cx(safeStyles.panel)}
        data-testid="capsule-panel"
      >
        {/* 头部状态行：原触发器信息（状态图标+当前动作+更改统计）移入面板 */}
        <div className={cx(safeStyles['panel-header'])}>
          {model.running ? (
            <LoadingOutlined spin className={cx(safeStyles.spinner)} />
          ) : (
            terminalStatusIcon(model.terminalStatus)
          )}
          <span className={cx(safeStyles['panel-header-label'])}>
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
          <button
            type="button"
            className={cx(safeStyles['panel-close'])}
            data-testid="capsule-close"
            aria-label={t('PC.Components.ConversationProgressCapsule.close')}
            onClick={() => onCloseRef.current?.()}
          >
            <CloseOutlined />
          </button>
        </div>
        {model.taskResults.length > 0 && (
          <section className={cx(safeStyles.group)}>
            <GroupTitle icon={<FileTextOutlined />}>
              {t('PC.Components.ConversationProgressCapsule.taskResult')}
            </GroupTitle>
            {model.taskResults.map((item) => (
              <button
                key={item.key}
                type="button"
                className={cx(safeStyles['result-row'])}
                title={item.description || item.file}
                onClick={() => handleOpenTaskResult(item.file)}
              >
                <span className={cx(safeStyles['node-kind-icon'])} aria-hidden>
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
              </button>
            ))}
          </section>
        )}
        {model.openuiRenders.length > 0 && (
          <section className={cx(safeStyles.group)}>
            <GroupTitle icon={<LayoutOutlined />}>
              {t('PC.Components.ConversationProgressCapsule.openUi')}
            </GroupTitle>
            {model.openuiRenders.map((item) => (
              <button
                key={item.key}
                type="button"
                className={cx(safeStyles['result-row'])}
                title={item.title}
                onClick={() => handleOpenOpenUiPreview(item.artifactId)}
              >
                <span className={cx(safeStyles['node-kind-icon'])} aria-hidden>
                  <LayoutOutlined />
                </span>
                <span
                  className={cx(safeStyles['node-text'], safeStyles.truncate)}
                >
                  {item.title}
                </span>
                <span className={cx(safeStyles['chevron-dim'])} aria-hidden>
                  <RightOutlined />
                </span>
              </button>
            ))}
          </section>
        )}
        {enableVersionControl &&
          (gitDiff.summary || gitDiff.loading || gitDiff.branch) && (
            <section className={cx(safeStyles.group)}>
              <GroupTitle icon={<BranchesOutlined />}>
                {t('PC.Components.ConversationProgressCapsule.gitTools')}
              </GroupTitle>
              <div className={cx(safeStyles.node)}>
                <span className={cx(safeStyles['node-kind-icon'])} aria-hidden>
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
    </div>
  );
};

export default ConversationProgressCapsule;
