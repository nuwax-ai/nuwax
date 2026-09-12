import { PureMarkdownRenderer } from '@/components/MarkdownRenderer';
import { normalizeV2ToolDetail } from '@/features/conversation/presentation-v2/toolDetail';
import { isConversationSandboxPath } from '@/features/conversation/presentation-v2/toolFilePresentation';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { dict } from '@/services/i18nRuntime';
import {
  CheckCircleOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import type {
  ConversationProcessNode,
  ConversationToolResource,
} from '../types';
import FileResourceLink from './FileResourceLink';
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

const DetailSection: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <section className={cx(styles['tool-detail-section'])}>
    <div className={cx(styles['tool-detail-section-label'])}>{label}</div>
    {children}
  </section>
);

const ResourceLink: React.FC<{
  kind: ConversationToolResource['kind'];
  target: string;
  line?: number;
  onOpenResource?: (resource: ConversationToolResource) => void;
}> = ({ kind, target, line, onOpenResource }) => {
  if (kind === 'file') {
    // 卡片头部：仅会话沙箱路径做「徽标+文件名」可点样式；
    // 其余（如 /home/user/Desktop/x.md）完整地址普通文本色展示、不可点
    if (!isConversationSandboxPath(target)) {
      return (
        <span className={cx(styles['tool-file-plain'])} title={target}>
          {target}
        </span>
      );
    }
    return (
      <FileResourceLink
        target={target}
        line={line}
        onOpenResource={onOpenResource}
      />
    );
  }
  if (onOpenResource) {
    return (
      <button
        type="button"
        className={cx(styles['tool-detail-resource'])}
        onClick={() => onOpenResource({ kind, target, line })}
      >
        {target}
      </button>
    );
  }
  if (kind === 'url') {
    return (
      <a
        className={cx(styles['tool-detail-resource'])}
        href={target}
        target="_blank"
        rel="noreferrer"
      >
        {target}
      </a>
    );
  }
  return <code className={cx(styles['tool-detail-path'])}>{target}</code>;
};

export interface ToolNodeDetailProps {
  node: ConversationProcessNode;
  onOpenResource?: (resource: ConversationToolResource) => void;
}

const ToolNodeDetail: React.FC<ToolNodeDetailProps> = ({
  node,
  onOpenResource,
}) => {
  const { data } = useUnifiedTheme();
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

  if (detail.kind === 'terminal' && (detail.command || detail.output)) {
    const running = node.status === 'running';
    const failed = node.failed || (!running && detail.success === false);
    return (
      <div
        className={cx(styles['tool-detail'], styles['tool-terminal'], {
          [styles['is-failed']]: failed,
        })}
        data-tool-detail-kind="terminal"
      >
        <header className={cx(styles['tool-terminal-header'])}>
          <span>
            {dict('PC.Components.ConversationRendererV2.toolDetailShell')}
          </span>
          <span className={cx(styles['tool-terminal-status'])}>
            {running ? (
              <LoadingOutlined spin aria-hidden="true" />
            ) : failed ? (
              <CloseCircleOutlined aria-hidden="true" />
            ) : (
              <CheckCircleOutlined aria-hidden="true" />
            )}
            {typeof detail.exitCode === 'number'
              ? dict(
                  'PC.Components.ConversationRendererV2.toolDetailExitCode',
                  detail.exitCode,
                )
              : dict(
                  running
                    ? 'PC.Components.ConversationRendererV2.toolDetailRunning'
                    : failed
                    ? 'PC.Components.ConversationRendererV2.toolDetailFailed'
                    : 'PC.Components.ConversationRendererV2.toolDetailSucceeded',
                )}
          </span>
        </header>
        {detail.description && (
          <div className={cx(styles['tool-detail-description'])}>
            {detail.description}
          </div>
        )}
        {detail.command && (
          <div className={cx(styles['tool-detail-command'])}>
            <span aria-hidden="true">$</span>
            <TextBlock tone="command">{detail.command}</TextBlock>
          </div>
        )}
        <TextBlock>{detail.output}</TextBlock>
      </div>
    );
  }

  if (detail.kind === 'file-read' && (detail.filePath || detail.output)) {
    const range =
      typeof detail.lineStart === 'number'
        ? dict(
            'PC.Components.ConversationRendererV2.toolDetailLineRange',
            detail.lineStart,
            detail.lineEnd ?? detail.lineStart,
          )
        : '';
    return (
      <div
        className={cx(styles['tool-detail'], styles['tool-file-preview'])}
        data-tool-detail-kind="file-read"
      >
        {(detail.filePath || range) && (
          <header className={cx(styles['tool-file-header'])}>
            {detail.filePath && (
              <ResourceLink
                kind="file"
                target={detail.filePath}
                line={detail.lineStart}
                onOpenResource={onOpenResource}
              />
            )}
            {range && <span>{range}</span>}
          </header>
        )}
        <TextBlock>{detail.output}</TextBlock>
      </div>
    );
  }

  if (detail.kind === 'file-edit' && detail.diffs.length) {
    return (
      <div
        className={cx(styles['tool-detail'], styles['tool-diff-view'])}
        data-tool-detail-kind="file-edit"
      >
        <div className={cx(styles['tool-diff-summary'])}>
          {dict(
            'PC.Components.ConversationRendererV2.toolDetailFilesChanged',
            detail.diffs.length,
          )}
          <span className={cx(styles['is-added-text'])}>
            +{detail.additions}
          </span>
          <span className={cx(styles['is-removed-text'])}>
            -{detail.deletions}
          </span>
        </div>
        {detail.diffs.map((diff) => (
          <div key={diff.path} className={cx(styles['tool-detail-diff'])}>
            <ResourceLink
              kind="file"
              target={diff.path}
              onOpenResource={onOpenResource}
            />
            {diff.oldText && (
              <pre className={cx(styles['is-removed'])}>
                {diff.oldText
                  .split(/\r?\n/)
                  .map((line) => `- ${line}`)
                  .join('\n')}
              </pre>
            )}
            {diff.newText && (
              <pre className={cx(styles['is-added'])}>
                {diff.newText
                  .split(/\r?\n/)
                  .map((line) => `+ ${line}`)
                  .join('\n')}
              </pre>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (detail.kind === 'skill' && (detail.skillContent || detail.output)) {
    return (
      <div className={cx(styles['tool-detail'])} data-tool-detail-kind="skill">
        <PureMarkdownRenderer
          id={`v2-skill-detail-${node.id}`}
          theme={data.antdTheme === 'dark' ? 'dark' : 'light'}
          disableTyping
        >
          {detail.skillContent || detail.output || ''}
        </PureMarkdownRenderer>
      </div>
    );
  }

  if (
    (detail.kind === 'search' || detail.kind === 'browser') &&
    (detail.query ||
      detail.url ||
      detail.resultTitle ||
      detail.resultSummary ||
      detail.output)
  ) {
    const hasStructuredResult = Boolean(
      detail.resultTitle || detail.resultSummary,
    );
    return (
      <div
        className={cx(styles['tool-detail'], styles['tool-result-view'])}
        data-tool-detail-kind={detail.kind}
      >
        {detail.query && (
          <div className={cx(styles['tool-detail-query'])}>{detail.query}</div>
        )}
        {detail.resultTitle && (
          <strong className={cx(styles['tool-result-title'])}>
            {detail.resultTitle}
          </strong>
        )}
        {detail.url && (
          <ResourceLink
            kind="url"
            target={detail.url}
            onOpenResource={onOpenResource}
          />
        )}
        {detail.resultSummary && <p>{detail.resultSummary}</p>}
        {!hasStructuredResult && <TextBlock>{detail.output}</TextBlock>}
      </div>
    );
  }

  const hasContent =
    detail.description || detail.filePath || detail.inputText || detail.output;
  if (!hasContent) return null;

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
        <ResourceLink
          kind="file"
          target={detail.filePath}
          line={detail.lineStart}
          onOpenResource={onOpenResource}
        />
      )}
      {detail.inputText && (
        <DetailSection
          label={dict('PC.Components.ConversationRendererV2.toolDetailInput')}
        >
          <TextBlock tone="input">{detail.inputText}</TextBlock>
        </DetailSection>
      )}
      {detail.output && (
        <DetailSection
          label={dict('PC.Components.ConversationRendererV2.toolDetailResult')}
        >
          <TextBlock>{detail.output}</TextBlock>
        </DetailSection>
      )}
    </div>
  );
};

export default ToolNodeDetail;
