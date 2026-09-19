/**
 * V2 待办卡：Plan 工具的结构化任务清单专属渲染（数据契约与 V1
 * MarkdownCustomProcess 任务列表同源：result.data = [{status, content}]）。
 * 运行中默认展开（进度可见）、结束自动收起一次（手动展开不抢）、历史收起；
 * 无结构化步骤时不由本组件接管（WorkTraceDisclosure 回落普通轨迹行）。
 */
import SvgIcon from '@/components/base/SvgIcon';
import { dict } from '@/services/i18nRuntime';
import { getPlanProgress } from '@/utils/terminalOutput';
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  OrderedListOutlined,
} from '@ant-design/icons';
import { theme } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { readPlanSteps, type ConversationPlanStep } from '../traceItems';
import type { ConversationProcessNode } from '../types';
import styles from './index.less';

const cx = classNames.bind(styles);

const STEP_ICONS: Partial<
  Record<
    ConversationPlanStep['status'],
    React.ComponentType<{ className?: string }>
  >
> = {
  completed: CheckCircleOutlined,
  in_progress: ArrowRightOutlined,
  failed: CloseCircleOutlined,
};

const TodoTraceNode: React.FC<{ node: ConversationProcessNode }> = ({
  node,
}) => {
  const { token } = theme.useToken();
  const steps = useMemo(
    () => readPlanSteps(node.processing?.result),
    [node.processing?.result],
  );
  const progress = useMemo(
    () => (steps ? getPlanProgress(steps) : null),
    [steps],
  );
  const running = node.status === 'running';
  // 运行中默认展开；结束自动收起一次（之后保留手动选择）；历史首挂即收起
  const [expanded, setExpanded] = useState(running);
  const wasRunningRef = useRef(running);
  useEffect(() => {
    if (wasRunningRef.current && !running) {
      setExpanded(false);
    }
    wasRunningRef.current = running;
  }, [running]);

  if (!steps || !progress) return null;

  const bodyId = `v2-todo-${node.id}`;
  return (
    <div
      className={cx(styles['todo-trace'])}
      data-node-id={node.id}
      data-node-kind="plan"
      data-testid="v2-todo-trace"
    >
      <button
        type="button"
        className={cx(styles['todo-trace-toggle'])}
        aria-expanded={expanded}
        aria-controls={bodyId}
        data-testid="v2-todo-trace-toggle"
        onClick={() => setExpanded((value) => !value)}
      >
        <OrderedListOutlined
          className={cx(styles['todo-trace-icon'])}
          style={{ color: token.colorTextTertiary }}
          aria-hidden="true"
        />
        <span className={cx(styles['todo-trace-title'])}>
          {dict('PC.Components.ConversationRendererV2.todoTraceTitle')}
        </span>
        <span className={cx(styles['todo-trace-progress'])}>
          {progress.completed}/{progress.total}
        </span>
        {running && (
          <LoadingOutlined
            className={cx(styles['todo-trace-status'])}
            style={{ color: token.colorPrimary }}
            spin
            aria-hidden="true"
          />
        )}
        <span
          className={cx(styles['todo-trace-chevron'], {
            [styles['todo-trace-chevron-open']]: expanded,
          })}
          aria-hidden="true"
        >
          <SvgIcon name="icons-common-caret_down" style={{ fontSize: 10 }} />
        </span>
      </button>
      {expanded && (
        <div id={bodyId} className={cx(styles['todo-trace-body'])}>
          {steps.map((step, index) => {
            const StepIcon = STEP_ICONS[step.status];
            return (
              <div
                key={index}
                className={cx(styles['todo-step'], {
                  [styles['is-completed']]: step.status === 'completed',
                  [styles['is-in-progress']]: step.status === 'in_progress',
                  [styles['is-failed']]: step.status === 'failed',
                })}
              >
                {StepIcon ? (
                  <StepIcon
                    className={cx(styles['todo-step-icon'])}
                    aria-hidden="true"
                  />
                ) : (
                  <span
                    className={cx(styles['todo-step-circle'])}
                    aria-hidden="true"
                  />
                )}
                <span className={cx(styles['todo-step-text'])}>
                  {step.content}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TodoTraceNode;
