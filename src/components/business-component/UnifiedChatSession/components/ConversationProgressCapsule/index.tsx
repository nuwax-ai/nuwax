import { t } from '@/services/i18nRuntime';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import {
  CheckOutlined,
  DownOutlined,
  LoadingOutlined,
  UpOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './index.less';
import {
  selectProgressCapsule,
  type ProgressCapsuleStep,
} from './selectProgressCapsule';

const cx = classNames.bind(styles);
const safeStyles = styles ?? ({} as typeof styles);

interface ConversationProgressCapsuleProps {
  conversationId?: number;
  messageList: MessageInfo[];
  active: boolean;
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

const ConversationProgressCapsule: React.FC<
  ConversationProgressCapsuleProps
> = ({ conversationId, messageList, active }) => {
  const model = useMemo(
    () => selectProgressCapsule(messageList, active),
    [active, messageList],
  );
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
  const progressText = model.totalCount
    ? `${model.completedCount}/${model.totalCount}`
    : t('PC.Components.ConversationProgressCapsule.running');
  // 选择器兜底留空（保持纯函数）：无运行中动作时用 running 词条占位。
  const displayAction =
    model.currentAction ||
    t('PC.Components.ConversationProgressCapsule.running');

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
        <LoadingOutlined spin className={cx(safeStyles.spinner)} />
        <span className={cx(safeStyles.action)}>{displayAction}</span>
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
            <LoadingOutlined spin />
            <span>{displayAction}</span>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationProgressCapsule;
