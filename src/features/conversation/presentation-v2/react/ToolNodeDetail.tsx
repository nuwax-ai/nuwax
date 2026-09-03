import { normalizeV2ToolDetail } from '@/features/conversation/presentation-v2/toolDetail';
import { CheckSquareOutlined, ClockCircleOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import type { ConversationProcessNode } from '../types';
import styles from './index.less';

const cx = classNames.bind(styles);

const TextBlock: React.FC<{
  children?: string;
  tone?: 'command' | 'output' | 'input';
}> = ({ children, tone = 'output' }) =>
  children ? (
    <pre className={cx(styles['tool-detail-text'], styles[`is-${tone}`])}>
      {children}
    </pre>
  ) : null;

const ToolNodeDetail: React.FC<{ node: ConversationProcessNode }> = ({
  node,
}) => {
  const detail = normalizeV2ToolDetail({
    componentType: node.processing?.type ?? node.componentType,
    name: node.processing?.name ?? node.title,
    result: node.processing?.result,
  });

  if (detail.kind === 'todo' && detail.steps.length) {
    return (
      <div className={cx(styles['tool-detail'])} data-tool-detail-kind="todo">
        <div className={cx(styles['tool-detail-steps'])}>
          {detail.steps.map((step, index) => (
            <div key={`${step.content}-${index}`}>
              {step.status === 'completed' ? (
                <CheckSquareOutlined aria-hidden="true" />
              ) : (
                <ClockCircleOutlined aria-hidden="true" />
              )}
              <span>{step.content}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (detail.kind === 'file-edit' && detail.diffs.length) {
    return (
      <div
        className={cx(styles['tool-detail'])}
        data-tool-detail-kind="file-edit"
      >
        {detail.diffs.map((diff) => (
          <div key={diff.path} className={cx(styles['tool-detail-diff'])}>
            <code>{diff.path}</code>
            {diff.oldText && (
              <pre className={cx(styles['is-removed'])}>{diff.oldText}</pre>
            )}
            {diff.newText && (
              <pre className={cx(styles['is-added'])}>{diff.newText}</pre>
            )}
          </div>
        ))}
      </div>
    );
  }

  const hasContent =
    detail.command ||
    detail.description ||
    detail.filePath ||
    detail.inputText ||
    detail.output;

  return (
    <div
      className={cx(styles['tool-detail'], {
        [styles['is-failed']]: node.failed,
      })}
      data-tool-detail-kind={detail.kind}
    >
      {detail.description && (
        <div className={cx(styles['tool-detail-description'])}>
          {detail.description}
        </div>
      )}
      {detail.filePath && (
        <code className={cx(styles['tool-detail-path'])}>
          {detail.filePath}
        </code>
      )}
      {detail.command && (
        <div className={cx(styles['tool-detail-command'])}>
          <span aria-hidden="true">$</span>
          <TextBlock tone="command">{detail.command}</TextBlock>
        </div>
      )}
      {!detail.command && (
        <TextBlock tone="input">{detail.inputText}</TextBlock>
      )}
      <TextBlock>{detail.output}</TextBlock>
      {!hasContent && node.summary && (
        <div className={cx(styles['tool-detail-description'])}>
          {node.summary}
        </div>
      )}
    </div>
  );
};

export default ToolNodeDetail;
